/**
 * How loud the sound of the room is: the fire is heard everywhere, more the nearer the player stands to it, and
 * is turned down while the figure speaks so that his words stay clear. A pure function of where the player is.
 */
export interface Listening {
  /** Distance from the player to the hearth, in metres. */
  distanceToHearth: number;
  /** Whether the figure is speaking. */
  speaking: boolean;
}

/** The level beside the fire, the least of it that reaches the far end of the room, and the distance at which it has halved. */
const FIRE = { near: 0.25, floor: 0.05, halfDistance: 2.2 } as const;
/** What is left of the room's sound while the figure speaks. */
const UNDER_SPEECH = 0.4;

/** The level of the room's sound, from 0 (silent) to 1 (full). */
export function ambienceLevel({ distanceToHearth, speaking }: Listening): number {
  const distance = Math.max(0, distanceToHearth);
  const fromFire = FIRE.floor + (FIRE.near - FIRE.floor) / (1 + (distance / FIRE.halfDistance) ** 2);
  return fromFire * (speaking ? UNDER_SPEECH : 1);
}
