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

/** The mouth of a figure who is not speaking: shut. */
export const MOUTH_REST = 0;
/** Speech: about this many syllables a second, each opening the mouth by an uneven amount. */
const SYLLABLES_PER_SECOND = 5.2;

/**
 * How far the mouth is open at a moment, from 0 (shut) to 1. While the figure speaks it opens and closes at the
 * pace of syllables, unevenly, as a mouth does; it does not follow the sounds of the words themselves.
 */
export function mouthOpening(time: number, speaking: boolean): number {
  if (!speaking) return MOUTH_REST;
  const beat = Math.abs(Math.sin(time * Math.PI * SYLLABLES_PER_SECOND));
  // A slower swell over the syllables: some are stressed, some swallowed, and now and then he pauses.
  const stress = 0.6 + 0.4 * Math.sin(time * 2.3 + 1.1) * Math.sin(time * 0.71);
  return Math.min(1, Math.max(0, beat ** 1.4 * stress));
}
