/**
 * The small movements of a figure that stands still: breathing, following the visitor with the head and blinking.
 * Pure functions of time, so that a still frame at a given moment is always the same picture.
 */

/** One breath, in seconds, how far it moves the chest and how far it lifts the head, in metres. */
export const BREATH = { seconds: 4.2, depth: 0.012, lift: 0.0012 } as const;

/** The head turns this share of the way towards the visitor, up to a limit in radians; the eyes cover the rest. */
export const HEAD_TURN = { follow: 0.55, max: 0.5, maxBow: 0.42, maxRaise: 0.1 } as const;

/** The eyes blink once in this many seconds, and a blink lasts this long. */
export const BLINK = { every: 4.7, seconds: 0.16 } as const;

/** How far the lids are open at a moment: 1, except during a blink, when they close and open again. */
export function lidOpening(time: number): number {
  // The first blink comes half a period after the start, so the eyes are open at the moment 0.
  const sinceBlink = (((time + BLINK.every / 2) % BLINK.every) + BLINK.every) % BLINK.every;
  if (sinceBlink > BLINK.seconds) return 1;
  return Math.abs(sinceBlink / BLINK.seconds - 0.5) * 2;
}
