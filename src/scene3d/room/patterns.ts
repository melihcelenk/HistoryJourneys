/**
 * Pattern maths of the room's decoration: the hexagon-and-triangle tiling of the dado, star polygons and the
 * grilles of the upper windows. Pure functions on numbers, shared by the texture painters and the unit tests.
 */
import { archHeight } from './wallMesher';

export type Point2 = readonly [number, number];

const SQRT3 = Math.sqrt(3);

/** One repeat of the hexagon-and-triangle tiling: hexagons standing on a point that touch at their corners. */
export interface HexTriangleCell {
  /** Side length of the hexagons and of the triangles between them. */
  side: number;
  /** Size of the rectangle that repeats. */
  width: number;
  height: number;
  /** Centres of the two hexagons of one repeat. */
  hexagonCentres: readonly Point2[];
}

/** The repeat of the tiling for hexagons that measure `across` from flat side to flat side. */
export function hexTriangleCell(across: number): HexTriangleCell {
  const side = across / SQRT3;
  return { side, width: across * 2, height: side * 2, hexagonCentres: [[0, 0], [across, side]] };
}

/** Corners of a hexagon standing on a point, shrunk towards its centre by `inset`. */
export function hexagonCorners(centre: Point2, side: number, inset = 0): Point2[] {
  const radius = side - (inset * 2) / SQRT3;
  const corners: Point2[] = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = Math.PI / 2 + (index * Math.PI) / 3;
    corners.push([centre[0] + Math.cos(angle) * radius, centre[1] + Math.sin(angle) * radius]);
  }
  return corners;
}

/**
 * The two triangles that belong to a hexagon of the tiling: the one on its right flat side and the one on its
 * left. Each is shrunk towards its own centre by `inset`.
 */
export function sideTriangles(centre: Point2, side: number, inset = 0): Point2[][] {
  const across = side * SQRT3;
  return [1, -1].map((direction) => {
    const corners: Point2[] = [
      [centre[0] + (direction * across) / 2, centre[1] - side / 2],
      [centre[0] + (direction * across) / 2, centre[1] + side / 2],
      [centre[0] + direction * across, centre[1]],
    ];
    const middleX = (corners[0]![0] + corners[1]![0] + corners[2]![0]) / 3;
    const middleY = centre[1];
    const inRadius = side / (2 * SQRT3);
    const factor = Math.max(0, 1 - inset / inRadius);
    return corners.map(([x, y]): Point2 => [middleX + (x - middleX) * factor, middleY + (y - middleY) * factor]);
  });
}

/** Corners of a star polygon with `points` tips, alternating between the outer and the inner radius. */
export function starPolygon(centre: Point2, points: number, outer: number, inner: number, rotation = 0): Point2[] {
  const corners: Point2[] = [];
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = rotation + (index * Math.PI) / points;
    corners.push([centre[0] + Math.cos(angle) * radius, centre[1] + Math.sin(angle) * radius]);
  }
  return corners;
}

/** A window opening with straight sides of height `straight` under a pointed arch of height `rise`. */
export interface ArchShape {
  width: number;
  straight: number;
  rise: number;
}

/**
 * Centres of the round glass openings of a plaster window grille: a honeycomb of circles that keeps `margin`
 * clear of the edge of the arch. Coordinates start at the bottom left corner of the opening.
 */
export function traceryHoles(shape: ArchShape, spacing: number, radius: number, margin: number): Point2[] {
  const holes: Point2[] = [];
  // Without a positive spacing the rows would never advance and the loop below would never end.
  if (!(spacing > 0) || !(radius > 0)) return holes;
  const rowStep = (spacing * SQRT3) / 2;
  const reach = radius + margin;
  const roofAt = (x: number): number => shape.straight + archHeight(x - shape.width / 2, shape.width / 2, shape.rise);
  for (let row = 0; reach + row * rowStep < shape.straight + shape.rise; row += 1) {
    const y = reach + row * rowStep;
    const count = Math.floor((shape.width - reach * 2) / spacing - (row % 2 === 0 ? 0 : 1)) + 1;
    const rowWidth = (count - 1) * spacing;
    for (let column = 0; column < count; column += 1) {
      const x = shape.width / 2 - rowWidth / 2 + column * spacing;
      if (y + reach <= Math.min(roofAt(x - radius), roofAt(x + radius), roofAt(x))) holes.push([x, y]);
    }
  }
  return holes;
}
