import { describe, expect, it } from 'vitest';
import { CARPET_COLOURS, abrash, carpetKnot, holbeinFieldKnot, type CarpetPlan } from '../../src/scene3d/room/carpetPattern';
import {
  COLLIDERS,
  ENTRANCE_SPOT,
  FURNITURE,
  HALF_DEPTH,
  HALF_WIDTH,
  ROOM_SIZE,
  WALLS,
  WALL_THICKNESS,
  distanceToCollider,
  isPathFree,
  isSpotFree,
  sunTravelDirection,
  wallPlan,
  wallToWorld,
} from '../../src/scene3d/room/layout';
import { hexTriangleCell, hexagonCorners, sideTriangles, starPolygon, traceryHoles, type Point2 } from '../../src/scene3d/room/patterns';
import { createRandom, flicker, fractalNoise, hash2, valueNoise } from '../../src/scene3d/room/random';
import { archHeight, meshArchBand, meshOpeningPanel, meshReveal, meshWallFace, openingOutline, openingTop, soupArea } from '../../src/scene3d/room/wallMesher';
import { FIGURE_SPOT } from '../../src/scene3d/shots';

/** Area of a polygon by the shoelace formula. */
function polygonArea(points: readonly Point2[]): number {
  let twice = 0;
  points.forEach(([x, y], index) => {
    const [nextX, nextY] = points[(index + 1) % points.length] ?? [x, y];
    twice += x * nextY - nextX * y;
  });
  return Math.abs(twice) / 2;
}

describe('seeded randomness of the room', () => {
  it('gives the same sequence for the same seed', () => {
    const first = createRandom(42);
    const second = createRandom(42);
    const a = Array.from({ length: 20 }, () => first());
    const b = Array.from({ length: 20 }, () => second());
    expect(a).toEqual(b);
  });

  it('gives a different sequence for a different seed, inside [0, 1)', () => {
    const first = createRandom(1);
    const second = createRandom(2);
    const a = Array.from({ length: 200 }, () => first());
    const b = Array.from({ length: 200 }, () => second());
    expect(a).not.toEqual(b);
    for (const value of [...a, ...b]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('hashes grid points repeatably and spreads them over [0, 1)', () => {
    const values: number[] = [];
    for (let x = -10; x < 10; x += 1) {
      for (let y = -10; y < 10; y += 1) values.push(hash2(x, y, 7));
    }
    expect(hash2(3, -4, 7)).toBe(hash2(3, -4, 7));
    expect(hash2(3, -4, 7)).not.toBe(hash2(3, -4, 8));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(mean).toBeGreaterThan(0.4);
    expect(mean).toBeLessThan(0.6);
  });

  it('makes noise that repeats with its period, so textures tile', () => {
    for (const [x, y] of [[0.3, 0.7], [2.25, 3.5], [5.9, 0.1]] as const) {
      expect(valueNoise(x + 6, y, 11, 6)).toBeCloseTo(valueNoise(x, y, 11, 6), 10);
      expect(valueNoise(x, y + 6, 11, 6)).toBeCloseTo(valueNoise(x, y, 11, 6), 10);
      expect(fractalNoise(x + 4, y + 4, { seed: 5, octaves: 4, period: 4 })).toBeCloseTo(fractalNoise(x, y, { seed: 5, octaves: 4, period: 4 }), 10);
    }
  });

  it('keeps fractal noise inside [0, 1)', () => {
    for (let step = 0; step < 300; step += 1) {
      const value = fractalNoise(step * 0.37, step * 0.11, { seed: 3, octaves: 5 });
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('flickers the same way at the same time and stays inside [-1, 1]', () => {
    for (let step = 0; step < 200; step += 1) {
      const time = step * 0.173;
      expect(flicker(time, 3)).toBe(flicker(time, 3));
      expect(Math.abs(flicker(time, 3))).toBeLessThanOrEqual(1);
    }
    const samples = Array.from({ length: 50 }, (_, index) => flicker(index * 0.31, 3));
    expect(new Set(samples).size).toBeGreaterThan(25);
  });
});

describe('tile and window patterns', () => {
  it('fills one repeat of the dado exactly with two hexagons and four triangles', () => {
    const cell = hexTriangleCell(0.2);
    let area = 0;
    for (const centre of cell.hexagonCentres) {
      area += polygonArea(hexagonCorners(centre, cell.side));
      for (const triangle of sideTriangles(centre, cell.side)) area += polygonArea(triangle);
    }
    expect(area).toBeCloseTo(cell.width * cell.height, 10);
  });

  it('makes hexagons that measure the given width from flat to flat', () => {
    const cell = hexTriangleCell(0.2);
    const corners = hexagonCorners([0, 0], cell.side);
    expect(corners).toHaveLength(6);
    const xs = corners.map(([x]) => x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(0.2, 10);
    for (const [x, y] of corners) expect(Math.hypot(x, y)).toBeCloseTo(cell.side, 10);
  });

  it('shrinks tiles towards their centre for the joints', () => {
    const cell = hexTriangleCell(0.2);
    const inset = 0.004;
    const full = polygonArea(hexagonCorners([0, 0], cell.side));
    const shrunk = polygonArea(hexagonCorners([0, 0], cell.side, inset));
    expect(shrunk).toBeLessThan(full);
    const acrossShrunk = Math.max(...hexagonCorners([0, 0], cell.side, inset).map(([x]) => x)) * 2;
    expect(acrossShrunk).toBeCloseTo(0.2 - inset * 2, 10);
    for (const triangle of sideTriangles([0, 0], cell.side, inset)) {
      expect(polygonArea(triangle)).toBeLessThan(polygonArea(sideTriangles([0, 0], cell.side)[0] ?? []));
      expect(polygonArea(triangle)).toBeGreaterThan(0);
    }
  });

  it('draws star polygons with alternating radii', () => {
    const star = starPolygon([1, 2], 8, 1, 0.5);
    expect(star).toHaveLength(16);
    star.forEach(([x, y], index) => expect(Math.hypot(x - 1, y - 2)).toBeCloseTo(index % 2 === 0 ? 1 : 0.5, 10));
  });

  it('keeps every glass opening of an upper window inside its arch, the same on every call', () => {
    const shape = { width: 0.86, straight: 0.48, rise: 0.5 };
    const radius = 0.033;
    const margin = 0.03;
    const holes = traceryHoles(shape, 0.094, radius, margin);
    expect(holes).toEqual(traceryHoles(shape, 0.094, radius, margin));
    expect(holes.length).toBeGreaterThan(30);
    for (const [x, y] of holes) {
      expect(x - radius).toBeGreaterThanOrEqual(margin - 1e-9);
      expect(x + radius).toBeLessThanOrEqual(shape.width - margin + 1e-9);
      expect(y - radius).toBeGreaterThanOrEqual(margin - 1e-9);
      expect(y + radius).toBeLessThanOrEqual(shape.straight + archHeight(x - shape.width / 2, shape.width / 2, shape.rise) - margin + 1e-9);
    }
    // The grille is symmetric about the axis of the window.
    for (const [x, y] of holes) {
      expect(holes.some(([otherX, otherY]) => Math.abs(otherX - (shape.width - x)) < 1e-9 && Math.abs(otherY - y) < 1e-9)).toBe(true);
    }
  });
});

describe('carpet pattern', () => {
  const plan: CarpetPlan = { knotsX: 573, knotsY: 760, border: 48, repeat: 40, seed: 11 };
  const colourCount = Object.keys(CARPET_COLOURS).length;

  it('gives the same carpet for the same plan', () => {
    for (let y = 0; y < plan.knotsY; y += 7) {
      for (let x = 0; x < plan.knotsX; x += 5) {
        const knot = carpetKnot(plan, x, y);
        expect(knot).toBe(carpetKnot({ ...plan }, x, y));
        expect(Number.isInteger(knot)).toBe(true);
        expect(knot).toBeGreaterThanOrEqual(0);
        expect(knot).toBeLessThan(colourCount);
      }
    }
  });

  it('repeats the field pattern with its period and uses every colour', () => {
    const seen = new Set<number>();
    for (let y = 0; y < 80; y += 1) {
      for (let x = 0; x < 80; x += 1) {
        const knot = holbeinFieldKnot(x, y, 40);
        seen.add(knot);
        expect(holbeinFieldKnot(x + 80, y, 40)).toBe(knot);
        expect(holbeinFieldKnot(x, y + 80, 40)).toBe(knot);
      }
    }
    for (const colour of [CARPET_COLOURS.field, CARPET_COLOURS.pattern, CARPET_COLOURS.alt, CARPET_COLOURS.accent, CARPET_COLOURS.light, CARPET_COLOURS.dark]) {
      expect(seen.has(colour)).toBe(true);
    }
  });

  it('is mirrored left to right and top to bottom, as a woven carpet is', () => {
    for (let y = 0; y < plan.knotsY; y += 11) {
      for (let x = 0; x < plan.knotsX; x += 9) {
        const border = Math.min(x, y, plan.knotsX - 1 - x, plan.knotsY - 1 - y) < plan.border;
        if (!border) continue;
        expect(carpetKnot(plan, plan.knotsX - 1 - x, y)).toBe(carpetKnot(plan, x, y));
      }
    }
  });

  it('frames the field with a border that does not use the field colours of the medallions', () => {
    for (let x = 0; x < plan.knotsX; x += 1) {
      expect(carpetKnot(plan, x, 0)).toBe(CARPET_COLOURS.dark);
      expect(carpetKnot(plan, x, plan.knotsY - 1)).toBe(CARPET_COLOURS.dark);
    }
    const middleOfBorder = Math.floor(plan.border / 2);
    const seen = new Set<number>();
    for (let y = plan.border; y < plan.knotsY - plan.border; y += 1) seen.add(carpetKnot(plan, middleOfBorder, y));
    expect(seen.has(CARPET_COLOURS.border)).toBe(true);
    expect(seen.has(CARPET_COLOURS.pattern)).toBe(false);
  });

  it('varies the dye a little from row to row, always the same way', () => {
    const values = Array.from({ length: 200 }, (_, row) => abrash(plan, row));
    expect(values).toEqual(Array.from({ length: 200 }, (_, row) => abrash(plan, row)));
    expect(Math.max(...values.map(Math.abs))).toBeLessThanOrEqual(0.08);
    expect(new Set(values).size).toBeGreaterThan(50);
  });
});

describe('wall mesher', () => {
  it('shapes a pointed arch: full rise on the axis, nothing at the springing', () => {
    expect(archHeight(0, 0.5, 0.6)).toBeCloseTo(0.6, 10);
    expect(archHeight(0.5, 0.5, 0.6)).toBeCloseTo(0, 10);
    expect(archHeight(-0.5, 0.5, 0.6)).toBeCloseTo(0, 10);
    expect(archHeight(0.2, 0.5, 0)).toBe(0);
    let previous = Infinity;
    for (let offset = 0; offset <= 0.5; offset += 0.05) {
      const height = archHeight(offset, 0.5, 0.6);
      expect(height).toBeLessThanOrEqual(previous + 1e-12);
      expect(archHeight(-offset, 0.5, 0.6)).toBeCloseTo(height, 12);
      previous = height;
    }
  });

  it('loses and doubles no wall: bands plus openings add up to the whole face', () => {
    const bands = [
      { name: 'low', bottom: 0, top: 1.72 },
      { name: 'middle', bottom: 1.72, top: 2.14 },
      { name: 'high', bottom: 2.14, top: ROOM_SIZE.height },
    ];
    for (const wall of WALLS) {
      const faces = meshWallFace(wall.length, ROOM_SIZE.height, wall.openings, bands);
      let solid = 0;
      for (const soup of faces.values()) solid += soupArea(soup);
      const holes = wall.openings.reduce((sum, opening) => sum + polygonArea(openingOutline(opening)), 0);
      expect(solid + holes).toBeCloseTo(wall.length * ROOM_SIZE.height, 6);
    }
  });

  it('keeps every triangle of a band inside the heights of the band', () => {
    const wall = wallPlan('north');
    const bands = [{ name: 'dado', bottom: 0.2, top: 1.72 }];
    const soup = meshWallFace(wall.length, ROOM_SIZE.height, wall.openings, bands).get('dado');
    expect(soup).toBeDefined();
    const positions = soup?.positions ?? [];
    expect(positions.length).toBeGreaterThan(0);
    for (let index = 0; index < positions.length; index += 3) {
      expect(positions[index + 1]).toBeGreaterThanOrEqual(0.2 - 1e-9);
      expect(positions[index + 1]).toBeLessThanOrEqual(1.72 + 1e-9);
      expect(Math.abs(positions[index] ?? 0)).toBeLessThanOrEqual(wall.length / 2 + 1e-9);
      expect(positions[index + 2]).toBe(0);
    }
  });

  it('closes an opening with a panel of the same area as its outline, set back into the wall', () => {
    for (const wall of WALLS) {
      for (const opening of wall.openings) {
        const panel = meshOpeningPanel(opening, wall.length, opening.depth);
        expect(soupArea(panel)).toBeCloseTo(polygonArea(openingOutline(opening)), 6);
        for (let index = 2; index < panel.positions.length; index += 3) expect(panel.positions[index]).toBe(-opening.depth);
      }
    }
  });

  it('lines the sides of an opening down to its depth', () => {
    const opening = wallPlan('east').openings[0];
    expect(opening).toBeDefined();
    if (!opening) return;
    const perimeter = 2 * (opening.width + (opening.spring - opening.sill));
    expect(soupArea(meshReveal(opening, ROOM_SIZE.depth))).toBeCloseTo(perimeter * opening.depth, 6);
    expect(soupArea(meshReveal(opening, ROOM_SIZE.depth, false))).toBeCloseTo((perimeter - opening.width) * opening.depth, 6);
  });

  it('wraps a moulding around an arch that is wider than the opening everywhere', () => {
    const niche = wallPlan('north').openings.find((opening) => opening.kind === 'niche');
    expect(niche).toBeDefined();
    if (!niche) return;
    const band = meshArchBand(niche, ROOM_SIZE.width, 0.07, 0.02);
    expect(band.positions.length).toBeGreaterThan(0);
    let highest = -Infinity;
    for (let index = 1; index < band.positions.length; index += 3) highest = Math.max(highest, band.positions[index] ?? 0);
    expect(highest).toBeGreaterThan(openingTop(niche, niche.centre));
    expect(highest).toBeLessThan(openingTop(niche, niche.centre) + 0.2);
  });
});

describe('floor plan of the room', () => {
  it('keeps every collider inside the room', () => {
    expect(COLLIDERS.length).toBeGreaterThan(5);
    for (const collider of COLLIDERS) {
      expect(collider.minX).toBeLessThan(collider.maxX);
      expect(collider.minZ).toBeLessThan(collider.maxZ);
      expect(collider.minX).toBeGreaterThanOrEqual(-HALF_WIDTH);
      expect(collider.maxX).toBeLessThanOrEqual(HALF_WIDTH);
      expect(collider.minZ).toBeGreaterThanOrEqual(-HALF_DEPTH);
      expect(collider.maxZ).toBeLessThanOrEqual(HALF_DEPTH);
    }
  });

  it('leaves at least 1.2 m of clear floor around the figure', () => {
    expect(isSpotFree(COLLIDERS, FIGURE_SPOT.x, FIGURE_SPOT.z, 1.2)).toBe(true);
  });

  it('leaves the entrance and a straight path from it to the figure free', () => {
    const shoulder = 0.35;
    expect(isSpotFree(COLLIDERS, ENTRANCE_SPOT.x, ENTRANCE_SPOT.z, shoulder)).toBe(true);
    expect(isPathFree(COLLIDERS, ENTRANCE_SPOT, FIGURE_SPOT, shoulder)).toBe(true);
  });

  it('notices a path that is blocked', () => {
    const blocker = [{ minX: -1, maxX: 1, minZ: 0.5, maxZ: 1.5 }];
    expect(isPathFree(blocker, ENTRANCE_SPOT, FIGURE_SPOT, 0.35)).toBe(false);
    expect(isSpotFree(blocker, 0, 1, 0.1)).toBe(false);
    expect(distanceToCollider(blocker[0] ?? { minX: 0, maxX: 0, minZ: 0, maxZ: 0 }, 2, 1)).toBeCloseTo(1, 10);
    expect(distanceToCollider(blocker[0] ?? { minX: 0, maxX: 0, minZ: 0, maxZ: 0 }, 0, 1)).toBe(0);
  });

  it('puts the figure on the main carpet and the carpets inside the room, clear of the hearth stone and the sedir', () => {
    const carpet = FURNITURE.mainCarpet;
    expect(Math.abs(FIGURE_SPOT.x - carpet.x)).toBeLessThan(carpet.sizeX / 2 - 0.5);
    expect(Math.abs(FIGURE_SPOT.z - carpet.z)).toBeLessThan(carpet.sizeZ / 2 - 0.5);
    for (const rug of [FURNITURE.mainCarpet, FURNITURE.entryCarpet]) {
      expect(Math.abs(rug.x) + rug.sizeX / 2).toBeLessThan(HALF_WIDTH);
      expect(Math.abs(rug.z) + rug.sizeZ / 2).toBeLessThan(HALF_DEPTH);
    }
    expect(carpet.x + carpet.sizeX / 2).toBeLessThanOrEqual(FURNITURE.sedir.x - FURNITURE.sedir.sizeX / 2);
    expect(carpet.z - carpet.sizeZ / 2).toBeGreaterThanOrEqual(FURNITURE.hearthSlab.z + FURNITURE.hearthSlab.sizeZ / 2);
    expect(FURNITURE.entryCarpet.z - FURNITURE.entryCarpet.sizeZ / 2).toBeGreaterThanOrEqual(carpet.z + carpet.sizeZ / 2);
  });

  it('keeps the openings of each wall inside the wall and apart from each other', () => {
    for (const wall of WALLS) {
      for (const opening of wall.openings) {
        expect(opening.centre - opening.width / 2).toBeGreaterThan(0.2);
        expect(opening.centre + opening.width / 2).toBeLessThan(wall.length - 0.2);
        expect(opening.sill).toBeGreaterThanOrEqual(0);
        expect(opening.spring).toBeGreaterThan(opening.sill);
        expect(opening.spring + opening.rise).toBeLessThan(ROOM_SIZE.height);
        expect(opening.depth).toBeLessThanOrEqual(WALL_THICKNESS);
      }
      wall.openings.forEach((first, index) => {
        for (const second of wall.openings.slice(index + 1)) {
          const apartAlong = Math.abs(first.centre - second.centre) >= (first.width + second.width) / 2;
          const apartInHeight = first.spring + first.rise <= second.sill || second.spring + second.rise <= first.sill;
          expect(apartAlong || apartInHeight).toBe(true);
        }
      });
    }
  });

  it('maps wall coordinates to the room: each wall runs left to right as seen from inside', () => {
    expect(wallToWorld(wallPlan('north'), 0, 0)).toEqual([-HALF_WIDTH, 0, -HALF_DEPTH]);
    const northRight = wallToWorld(wallPlan('north'), ROOM_SIZE.width, 1);
    expect(northRight[0]).toBeCloseTo(HALF_WIDTH, 10);
    expect(northRight[2]).toBeCloseTo(-HALF_DEPTH, 10);
    const eastLeft = wallToWorld(wallPlan('east'), 0, 0);
    expect(eastLeft[0]).toBeCloseTo(HALF_WIDTH, 10);
    expect(eastLeft[2]).toBeCloseTo(-HALF_DEPTH, 10);
    const eastBehind = wallToWorld(wallPlan('east'), 4.5, 1, 0.6);
    expect(eastBehind[0]).toBeCloseTo(HALF_WIDTH + 0.6, 10);
    expect(eastBehind[2]).toBeCloseTo(0, 10);
    const southLeft = wallToWorld(wallPlan('south'), 0, 0);
    expect(southLeft[0]).toBeCloseTo(HALF_WIDTH, 10);
    expect(southLeft[2]).toBeCloseTo(HALF_DEPTH, 10);
    const westLeft = wallToWorld(wallPlan('west'), 0, 0);
    expect(westLeft[0]).toBeCloseTo(-HALF_WIDTH, 10);
    expect(westLeft[2]).toBeCloseTo(HALF_DEPTH, 10);
  });

  it('puts the door where the player enters', () => {
    const south = wallPlan('south');
    const door = south.openings.find((opening) => opening.kind === 'door');
    expect(door).toBeDefined();
    if (!door) return;
    expect(wallToWorld(south, door.centre, 0)[0]).toBeCloseTo(ENTRANCE_SPOT.x, 6);
    expect(door.spring + door.rise).toBeGreaterThan(2.2);
    expect(door.spring + door.rise).toBeLessThan(2.8);
  });

  it('lets the low sun in through an east window onto the chest and the face of the figure', () => {
    const [dx, dy, dz] = sunTravelDirection();
    expect(Math.hypot(dx, dy, dz)).toBeCloseTo(1, 10);
    expect(dx).toBeLessThan(0);
    expect(dy).toBeLessThan(0);
    const east = wallPlan('east');
    const windows = east.openings.filter((opening) => opening.kind === 'window');
    const litThroughWindow = (height: number): boolean => {
      // Walk back from the figure against the light to the inner and the outer face of the east wall.
      return [HALF_WIDTH, HALF_WIDTH + WALL_THICKNESS].every((planeX) => {
        const steps = (planeX - FIGURE_SPOT.x) / -dx;
        const y = height - dy * steps;
        const along = FIGURE_SPOT.z - dz * steps + HALF_DEPTH;
        return windows.some((opening) => Math.abs(along - opening.centre) < opening.width / 2 && y > opening.sill && y < opening.spring);
      });
    };
    expect(litThroughWindow(1.12)).toBe(true);
    expect(litThroughWindow(FIGURE_SPOT.eyeHeight)).toBe(true);
  });
});
