/**
 * The floor plan of the room as plain data: its size, the openings of each wall, where the furniture stands and
 * which boxes block the player. Nothing here touches three.js, so the plan can be checked in unit tests.
 * All lengths are in metres; the floor is centred on the origin and the y axis points up.
 */

/** A box on the floor plan that the player cannot walk into, in metres. */
export interface Collider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Inner size of the room in metres. */
export const ROOM_SIZE = { width: 7.2, depth: 9, height: 4.8 } as const;

export const HALF_WIDTH = ROOM_SIZE.width / 2;
export const HALF_DEPTH = ROOM_SIZE.depth / 2;

/** Thickness of the masonry walls, visible in the window reveals. */
export const WALL_THICKNESS = 0.6;

/** Horizontal bands of the wall surface, from the floor up. */
export const WALL_BANDS = {
  plinthTop: 0.2,
  tileTop: 1.72,
  borderTop: 1.92,
  scrollTop: 2.14,
  friezeBottom: 4.28,
  friezeTop: 4.66,
} as const;

export type WallId = 'north' | 'east' | 'south' | 'west';

export type OpeningKind = 'window' | 'upperWindow' | 'niche' | 'cupboard' | 'door' | 'hearth';

/** A hole in a wall face. `centre` is measured along the wall from its left end as seen from inside the room. */
export interface Opening {
  id: string;
  kind: OpeningKind;
  centre: number;
  width: number;
  /** Height of the bottom edge above the floor. */
  sill: number;
  /** Height at which the straight sides end; the top of a rectangular opening. */
  spring: number;
  /** Height of the pointed arch above the spring line; 0 for a rectangular opening. */
  rise: number;
  /** How far the opening goes into the wall. */
  depth: number;
}

export interface WallPlan {
  id: WallId;
  length: number;
  /** Rotation of the wall around the vertical axis; the wall face looks along local +z before it is turned. */
  rotationY: number;
  /** World position of the middle of the wall at floor level. */
  origin: readonly [number, number];
  openings: readonly Opening[];
}

const NICHE_DEPTH = 0.36;
const CUPBOARD_DEPTH = 0.1;
const DOOR_DEPTH = 0.2;
const HEARTH_DEPTH = 0.42;

const LOWER_WINDOW = { width: 1.15, sill: 0.7, spring: 2.8, rise: 0 } as const;
const UPPER_WINDOW = { width: 0.86, sill: 3.3, spring: 3.78, rise: 0.5 } as const;
const WINDOW_AXES = [1.8, 4.5, 7.2] as const;
const SIDE_NICHE = { width: 0.92, sill: 1.02, spring: 1.74, rise: 0.56 } as const;
const WEST_BAY = { width: 1.12, sill: 0.52, spring: 1.7, rise: 0.62 } as const;

function westUpperWindows(): Opening[] {
  return [1.9, 4.5, 7.1].map((centre, index) => ({
    id: `upper-window-west-${index}`,
    kind: 'upperWindow' as const,
    centre,
    ...UPPER_WINDOW,
    depth: WALL_THICKNESS,
  }));
}

function eastOpenings(): Opening[] {
  return WINDOW_AXES.flatMap((centre, index) => [
    { id: `window-${index}`, kind: 'window' as const, centre, ...LOWER_WINDOW, depth: WALL_THICKNESS },
    { id: `upper-window-${index}`, kind: 'upperWindow' as const, centre, ...UPPER_WINDOW, depth: WALL_THICKNESS },
  ]);
}

/** The four walls with their openings. */
export const WALLS: readonly WallPlan[] = [
  {
    id: 'north',
    length: ROOM_SIZE.width,
    rotationY: 0,
    origin: [0, -HALF_DEPTH],
    openings: [
      { id: 'niche-north-left', kind: 'niche', centre: 1.3, ...SIDE_NICHE, depth: NICHE_DEPTH },
      { id: 'hearth', kind: 'hearth', centre: 3.6, width: 1.04, sill: 0.1, spring: 0.82, rise: 0.5, depth: HEARTH_DEPTH },
      { id: 'niche-north-right', kind: 'niche', centre: 5.9, ...SIDE_NICHE, depth: NICHE_DEPTH },
    ],
  },
  { id: 'east', length: ROOM_SIZE.depth, rotationY: -Math.PI / 2, origin: [HALF_WIDTH, 0], openings: eastOpenings() },
  {
    id: 'south',
    length: ROOM_SIZE.width,
    rotationY: Math.PI,
    origin: [0, HALF_DEPTH],
    openings: [
      { id: 'niche-south', kind: 'niche', centre: 1.25, width: 0.8, sill: 1.05, spring: 1.7, rise: 0.5, depth: NICHE_DEPTH },
      { id: 'door', kind: 'door', centre: 4.5, width: 1.5, sill: 0, spring: 1.96, rise: 0.56, depth: DOOR_DEPTH },
    ],
  },
  {
    id: 'west',
    length: ROOM_SIZE.depth,
    rotationY: Math.PI / 2,
    origin: [-HALF_WIDTH, 0],
    openings: [
      { id: 'cupboard-south', kind: 'cupboard', centre: 1.9, ...WEST_BAY, depth: CUPBOARD_DEPTH },
      { id: 'niche-west', kind: 'niche', centre: 4.5, ...WEST_BAY, depth: NICHE_DEPTH },
      { id: 'cupboard-north', kind: 'cupboard', centre: 7.1, ...WEST_BAY, depth: CUPBOARD_DEPTH },
      ...westUpperWindows(),
    ],
  },
];

/** Looks a wall up by its name. */
export function wallPlan(id: WallId): WallPlan {
  const plan = WALLS.find((wall) => wall.id === id);
  if (!plan) throw new Error(`Unknown wall: ${id}`);
  return plan;
}

/** Looks an opening up by its id on the given wall. */
export function findOpening(wall: WallId, id: string): Opening {
  const opening = wallPlan(wall).openings.find((candidate) => candidate.id === id);
  if (!opening) throw new Error(`Wall ${wall} has no opening ${id}`);
  return opening;
}

/**
 * Turns a point given on a wall into room coordinates. `along` runs from the left end of the wall as seen from
 * inside, `height` is above the floor and `into` is the distance behind the wall face (negative values are in
 * front of the wall, inside the room).
 */
export function wallToWorld(wall: WallPlan, along: number, height: number, into = 0): [number, number, number] {
  const localX = along - wall.length / 2;
  const localZ = -into;
  const cos = Math.cos(wall.rotationY);
  const sin = Math.sin(wall.rotationY);
  return [wall.origin[0] + localX * cos + localZ * sin, height, wall.origin[1] - localX * sin + localZ * cos];
}

/** The low sun: how high it stands and how far it is turned from due east towards the south, in degrees. */
export const SUN = { elevationDeg: 14, azimuthDeg: 22 } as const;

/** The direction in which the sunlight travels, as a unit vector. */
export function sunTravelDirection(): [number, number, number] {
  const elevation = (SUN.elevationDeg * Math.PI) / 180;
  const azimuth = (SUN.azimuthDeg * Math.PI) / 180;
  return [-Math.cos(elevation) * Math.cos(azimuth), -Math.sin(elevation), -Math.cos(elevation) * Math.sin(azimuth)];
}

/** A rectangle on the floor given by its centre and size. */
export interface FloorRect {
  x: number;
  z: number;
  sizeX: number;
  sizeZ: number;
}

/** Where the furniture stands. Every piece that blocks the player also appears in `COLLIDERS`. */
export const FURNITURE = {
  sedir: { x: 3.17, z: -0.55, sizeX: 0.86, sizeZ: 7.9 },
  hearthSlab: { x: 0, z: -4.14, sizeX: 1.9, sizeZ: 0.72 },
  mainCarpet: { x: 0.05, z: -0.75, sizeX: 4.3, sizeZ: 5.9 },
  entryCarpet: { x: -0.9, z: 3.36, sizeX: 1.5, sizeZ: 1.96 },
  rahle: { x: -1.8, z: -2.55, sizeX: 0.62, sizeZ: 0.46 },
  readingCushion: { x: -1.8, z: -3.2, sizeX: 0.78, sizeZ: 0.7 },
  brazier: { x: 1.78, z: 0.2, sizeX: 0.84, sizeZ: 0.84 },
  trayTable: { x: 2.12, z: -3.15, sizeX: 0.78, sizeZ: 0.78 },
  chest: { x: 1.95, z: 4.14, sizeX: 1.25, sizeZ: 0.56 },
  candlestickLeft: { x: -1.42, z: -4.12, sizeX: 0.34, sizeZ: 0.34 },
  candlestickRight: { x: 1.42, z: -4.12, sizeX: 0.34, sizeZ: 0.34 },
  floorCushions: { x: -3.05, z: 1.35, sizeX: 0.9, sizeZ: 1.5 },
} as const satisfies Record<string, FloorRect>;

/** Carpets lie flat and can be walked on; everything else in `FURNITURE` blocks the player. */
const WALKABLE: ReadonlySet<string> = new Set(['mainCarpet', 'entryCarpet']);

function rectToCollider(rect: FloorRect): Collider {
  return {
    minX: rect.x - rect.sizeX / 2,
    maxX: rect.x + rect.sizeX / 2,
    minZ: rect.z - rect.sizeZ / 2,
    maxZ: rect.z + rect.sizeZ / 2,
  };
}

/** Floor-plan boxes of the furniture and built-in parts the player must walk around. */
export const COLLIDERS: readonly Collider[] = Object.entries(FURNITURE)
  .filter(([name]) => !WALKABLE.has(name))
  .map(([, rect]) => rectToCollider(rect));

/** Where the player enters the room. */
export const ENTRANCE_SPOT = { x: -0.9, z: 4.0 } as const;

/** Distance from a point on the floor to the nearest edge of a collider; 0 when the point is inside it. */
export function distanceToCollider(collider: Collider, x: number, z: number): number {
  const dx = Math.max(collider.minX - x, 0, x - collider.maxX);
  const dz = Math.max(collider.minZ - z, 0, z - collider.maxZ);
  return Math.hypot(dx, dz);
}

/** True when a disc of the given radius around the point touches none of the colliders. */
export function isSpotFree(colliders: readonly Collider[], x: number, z: number, radius: number): boolean {
  return colliders.every((collider) => distanceToCollider(collider, x, z) >= radius);
}

const PATH_SAMPLE_STEP = 0.05;

/** True when a disc of the given radius can slide along the straight line between two points without touching a collider. */
export function isPathFree(
  colliders: readonly Collider[],
  from: { x: number; z: number },
  to: { x: number; z: number },
  radius: number,
): boolean {
  const length = Math.hypot(to.x - from.x, to.z - from.z);
  const steps = Math.max(1, Math.ceil(length / PATH_SAMPLE_STEP));
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    if (!isSpotFree(colliders, from.x + (to.x - from.x) * t, from.z + (to.z - from.z) * t, radius)) return false;
  }
  return true;
}
