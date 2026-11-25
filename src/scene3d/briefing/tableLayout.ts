import { FIGURE_SPOT } from '../shots';
import type { Box } from '../walk';
import type { MapPoint } from './mapDefinition';

/**
 * Where the map table stands and how the map lies on it, as plain numbers in metres. The table stands in front
 * of the figure, between him and the visitor.
 */
export const TABLE = {
  x: FIGURE_SPOT.x,
  z: FIGURE_SPOT.z + 1.02,
  width: 1.64,
  depth: 1.1,
  /** Low, as the furniture of the room is: the map is read standing over it. */
  height: 0.58,
  /** The sheet of the map, smaller than the top of the table and of the same proportions as its picture. */
  mapWidth: 1.4,
  mapDepth: 0.875,
} as const;

/** The floor the table takes; the player walks around it. */
export function tableBox(): Box {
  return { minX: TABLE.x - TABLE.width / 2, maxX: TABLE.x + TABLE.width / 2, minZ: TABLE.z - TABLE.depth / 2, maxZ: TABLE.z + TABLE.depth / 2 };
}

/** How far the sheet lies above the top of the table, so that the two never fight for the same depth. */
const SHEET_LIFT = 0.004;

/**
 * Where a point of the map is in the room. The map is turned to the visitor: its north lies on the far side of
 * the table, towards the figure, and its east to the visitor's right.
 */
export function mapPointOnTable([x, y]: MapPoint): [number, number, number] {
  return [TABLE.x + (x - 0.5) * TABLE.mapWidth, TABLE.height + SHEET_LIFT, TABLE.z + (y - 0.5) * TABLE.mapDepth];
}
