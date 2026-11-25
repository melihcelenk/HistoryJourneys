/**
 * Walking on the floor plan: where the player may stand and how a step is shortened by what is in the way.
 * Pure functions on plain data, in metres; x and z are the two axes of the floor.
 */

export interface Point {
  x: number;
  z: number;
}

/** A rectangle on the floor plan. */
export interface Box {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WalkSpace {
  /** The walls: the player stays inside this rectangle. */
  bounds: Box;
  /** What stands in the room: the player stays outside these. */
  obstacles: readonly Box[];
  /** Half the width of the player. */
  radius: number;
}

/** Whether a player standing at `point` would touch a wall or an obstacle. */
export function isBlocked(point: Point, space: WalkSpace): boolean {
  const { bounds, obstacles, radius } = space;
  if (point.x < bounds.minX + radius || point.x > bounds.maxX - radius) return true;
  if (point.z < bounds.minZ + radius || point.z > bounds.maxZ - radius) return true;
  return obstacles.some((box) => point.x > box.minX - radius && point.x < box.maxX + radius && point.z > box.minZ - radius && point.z < box.maxZ + radius);
}

/**
 * Takes a step from `from`. A step into something is not refused outright: the part of it that runs along the
 * obstacle is kept, so the player slides along walls and furniture instead of sticking to them.
 */
export function walk(from: Point, step: Point, space: WalkSpace): Point {
  const alongX = { x: from.x + step.x, z: from.z };
  const afterX = isBlocked(alongX, space) ? from : alongX;
  const alongZ = { x: afterX.x, z: afterX.z + step.z };
  return isBlocked(alongZ, space) ? afterX : alongZ;
}

/** A square obstacle around something that stands at a point, such as the figure. */
export function boxAround(centre: Point, halfSize: number): Box {
  return { minX: centre.x - halfSize, maxX: centre.x + halfSize, minZ: centre.z - halfSize, maxZ: centre.z + halfSize };
}
