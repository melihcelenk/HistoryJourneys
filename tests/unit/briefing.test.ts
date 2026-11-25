import { describe, expect, it } from 'vitest';
import rawBriefing from '../../content/scenes/mehmed-ii.json';
import { parseBriefing } from '../../src/scene3d/briefing/briefingSchema';
import { CONQUEST_MAP } from '../../src/scene3d/briefing/conquestMap';
import { DEFAULT_SCRIPT, mapNames, markCentre, markIds, nameIn, otherScript, pebblePoints } from '../../src/scene3d/briefing/mapDefinition';
import { back, begin, forward, isRunning } from '../../src/scene3d/briefing/narration';
import { TABLE, mapPointOnTable, tableBox } from '../../src/scene3d/briefing/tableLayout';
import { ROOM_SIZE } from '../../src/scene3d/room/layout';
import { FIGURE_SPOT } from '../../src/scene3d/shots';
import { boxAround, isBlocked, type WalkSpace } from '../../src/scene3d/walk';

describe('walking through a briefing', () => {
  it('begins at the first step', () => {
    expect(begin()).toEqual({ step: 0 });
    expect(isRunning(begin())).toBe(true);
    expect(isRunning(null)).toBe(false);
  });

  it('goes forward one step at a time and ends after the last step', () => {
    let narration = begin();
    narration = forward(narration, 3);
    expect(narration).toEqual({ step: 1 });
    narration = forward(narration, 3);
    expect(narration).toEqual({ step: 2 });
    expect(forward(narration, 3)).toBeNull();
  });

  it('goes back, but not before the first step', () => {
    expect(back({ step: 2 })).toEqual({ step: 1 });
    expect(back({ step: 0 })).toEqual({ step: 0 });
  });

  it('stays ended once it has ended', () => {
    expect(forward(null, 3)).toBeNull();
    expect(back(null)).toBeNull();
  });
});

describe('the briefing of Mehmed II', () => {
  const briefing = parseBriefing(rawBriefing);

  it('is told in several steps, each with a title and a text', () => {
    expect(briefing.figure).toBe('mehmed-ii');
    expect(briefing.steps.length).toBeGreaterThanOrEqual(5);
    for (const step of briefing.steps) {
      expect(step.title.length, step.id).toBeGreaterThan(2);
      expect(step.text.length, step.id).toBeGreaterThan(60);
    }
  });

  it('gives every step an id of its own', () => {
    const ids = briefing.steps.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('points only at what is drawn on the map, and points at something in every step', () => {
    const known = new Set(markIds(CONQUEST_MAP));
    for (const step of briefing.steps) {
      expect(step.marks.length, step.id).toBeGreaterThan(0);
      for (const mark of step.marks) expect(known.has(mark), `${step.id} → ${mark}`).toBe(true);
    }
  });

  it('names its sources', () => {
    expect(briefing.sources.length).toBeGreaterThan(0);
    for (const source of briefing.sources) expect(source.url).toMatch(/^https:\/\//);
  });

  it('is refused when a step has no text', () => {
    const broken = { ...rawBriefing, steps: [{ id: 'x', title: 'Başlık', text: '', marks: [] }] };
    expect(() => parseBriefing(broken)).toThrow();
  });
});

describe('the map of the conquest', () => {
  it('keeps everything it marks on the sheet', () => {
    for (const id of markIds(CONQUEST_MAP)) {
      const [x, y] = markCentre(CONQUEST_MAP, id);
      expect(x, id).toBeGreaterThan(0.02);
      expect(x, id).toBeLessThan(0.98);
      expect(y, id).toBeGreaterThan(0.02);
      expect(y, id).toBeLessThan(0.98);
    }
  });

  it('knows the places the plan turns on', () => {
    for (const id of ['rumeli-hisari', 'anadolu-hisari', 'land-walls', 'chain', 'overland', 'camp']) {
      expect(markIds(CONQUEST_MAP), id).toContain(id);
    }
  });

  it('refuses a mark it does not have', () => {
    expect(() => markCentre(CONQUEST_MAP, 'atlantis')).toThrow();
  });
});

describe('the table the map lies on', () => {
  const box = tableBox();

  it('stands inside the room, in front of the figure, without touching him', () => {
    expect(box.minX).toBeGreaterThan(-ROOM_SIZE.width / 2);
    expect(box.maxX).toBeLessThan(ROOM_SIZE.width / 2);
    expect(box.minZ).toBeGreaterThan(FIGURE_SPOT.z + 0.3);
    expect(Math.abs((box.minX + box.maxX) / 2 - FIGURE_SPOT.x)).toBeLessThan(0.2);
  });

  it('stops the player', () => {
    const space: WalkSpace = {
      bounds: { minX: -ROOM_SIZE.width / 2, maxX: ROOM_SIZE.width / 2, minZ: -ROOM_SIZE.depth / 2, maxZ: ROOM_SIZE.depth / 2 },
      obstacles: [box, boxAround(FIGURE_SPOT, 0.42)],
      radius: 0.3,
    };
    expect(isBlocked({ x: TABLE.x, z: TABLE.z }, space)).toBe(true);
    expect(isBlocked({ x: TABLE.x, z: box.maxZ + 0.5 }, space)).toBe(false);
  });

  it('places the corners of the map on its top', () => {
    const [x0, y0, z0] = mapPointOnTable([0, 0]);
    const [x1, y1, z1] = mapPointOnTable([1, 1]);
    expect(y0).toBeCloseTo(TABLE.height, 1);
    expect(y1).toBe(y0);
    for (const [x, z] of [
      [x0, z0],
      [x1, z1],
    ] as const) {
      expect(x).toBeGreaterThanOrEqual(box.minX);
      expect(x).toBeLessThanOrEqual(box.maxX);
      expect(z).toBeGreaterThanOrEqual(box.minZ);
      expect(z).toBeLessThanOrEqual(box.maxZ);
    }
    // The map is turned to the visitor: its top edge (north) lies on the far side, towards the figure.
    expect(z0).toBeLessThan(z1);
    expect(x0).toBeLessThan(x1);
  });
});

describe('the two scripts of the map', () => {
  /** Arabic letters, Arabic-Indic digits, the zero-width non-joiner and spaces. */
  const OTTOMAN = /^[؀-ۿ‌ ]+$/;

  it('writes every name in both scripts', () => {
    const names = mapNames(CONQUEST_MAP);
    expect(names.length).toBeGreaterThan(12);
    for (const name of names) {
      expect(name.latin.trim().length, JSON.stringify(name)).toBeGreaterThan(1);
      expect(name.ottoman, name.latin).toMatch(OTTOMAN);
    }
  });

  it('gives no two things the same name', () => {
    const latin = mapNames(CONQUEST_MAP).map((name) => name.latin);
    expect(new Set(latin).size).toBe(latin.length);
  });

  it('opens in the Ottoman script and turns to Latin and back', () => {
    expect(DEFAULT_SCRIPT).toBe('ottoman');
    expect(otherScript('ottoman')).toBe('latin');
    expect(otherScript('latin')).toBe('ottoman');
  });

  it('reads a name in the script asked for', () => {
    const city = CONQUEST_MAP.places.city;
    expect(city).toBeDefined();
    if (!city) return;
    expect(nameIn(city.label, 'latin')).toBe('Kostantiniyye');
    expect(nameIn(city.label, 'ottoman')).toBe('قسطنطينيه');
  });

  it('dates the sheet by the calendar of each script', () => {
    expect(nameIn(CONQUEST_MAP.title, 'latin')).toContain('1453');
    expect(nameIn(CONQUEST_MAP.title, 'ottoman')).toContain('٨٥٧');
  });
});

describe('the pebbles that show what is spoken of', () => {
  it('lie one beside each marked place and along each marked route, all on the sheet', () => {
    const points = pebblePoints(CONQUEST_MAP, ['rumeli-hisari', 'land-walls']);
    expect(points).toHaveLength(1 + (CONQUEST_MAP.routes['land-walls']?.points.length ?? 0));
    for (const [x, y] of points) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(1);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(1);
    }
  });

  it('are taken off when nothing is marked, and ignore a mark the map does not have', () => {
    expect(pebblePoints(CONQUEST_MAP, [])).toEqual([]);
    expect(pebblePoints(CONQUEST_MAP, ['atlantis'])).toEqual([]);
  });

  it('never need more pebbles than a step of the briefing marks', () => {
    for (const step of parseBriefing(rawBriefing).steps) expect(pebblePoints(CONQUEST_MAP, step.marks).length, step.id).toBeLessThanOrEqual(14);
  });
});
