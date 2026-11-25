import { findOpening, wallPlan, wallToWorld } from './room/layout';
import type { Point } from './walk';

/**
 * The way into and out of the room: where its door is, where the player comes in and when the player stands
 * close enough to the door to be offered the way back to the map. Plain data and pure functions, in metres.
 */
const SOUTH = wallPlan('south');
const OPENING = findOpening('south', 'door');
const [DOOR_X, , DOOR_Z] = wallToWorld(SOUTH, OPENING.centre, 0);

/** The middle of the threshold of the door. */
export const DOOR: Point = { x: DOOR_X, z: DOOR_Z };

/** Where the player enters: a step inside the door, turned a little towards the figure (radians around the vertical). */
export const PLAYER_START = { x: DOOR.x, z: DOOR.z - 0.9, yaw: -0.2 } as const;

/** How near the door the player must stand to be offered the way out: within the width of the door and this far in front of it. */
const REACH = 0.7;

/** Whether a player standing at `point` is at the door. The place of entering is deliberately not: the offer comes when the player walks back to the door. */
export function isAtDoor(point: Point): boolean {
  return Math.abs(point.x - DOOR.x) <= OPENING.width / 2 && DOOR.z - point.z <= REACH;
}
