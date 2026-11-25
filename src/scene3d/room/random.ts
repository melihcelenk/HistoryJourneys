/**
 * Seeded pseudo-random numbers and noise. Everything here is a pure function of its inputs, so the textures and
 * the animation of the room come out the same on every run.
 */

const UINT32_RANGE = 4294967296;

/** Returns a generator of numbers in [0, 1) that always yields the same sequence for the same seed (mulberry32). */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

/** A number in [0, 1) that depends only on the two integer coordinates and the seed. */
export function hash2(x: number, y: number, seed: number): number {
  let mixed = (Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b1)) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 15), 0x85ebca6b) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 13), 0xc2b2ae35) >>> 0;
  return ((mixed ^ (mixed >>> 16)) >>> 0) / UINT32_RANGE;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function wrap(value: number, period: number): number {
  return period > 0 ? ((value % period) + period) % period : value;
}

/**
 * Smooth value noise in [0, 1). With a positive `period` the noise repeats every `period` units on both axes,
 * which makes textures drawn from it tile without a seam.
 */
export function valueNoise(x: number, y: number, seed: number, period = 0): number {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const blendX = smooth(x - cellX);
  const blendY = smooth(y - cellY);
  const x0 = wrap(cellX, period);
  const x1 = wrap(cellX + 1, period);
  const y0 = wrap(cellY, period);
  const y1 = wrap(cellY + 1, period);
  const top = hash2(x0, y0, seed) * (1 - blendX) + hash2(x1, y0, seed) * blendX;
  const bottom = hash2(x0, y1, seed) * (1 - blendX) + hash2(x1, y1, seed) * blendX;
  return top * (1 - blendY) + bottom * blendY;
}

export interface FractalOptions {
  seed: number;
  octaves: number;
  /** Repeat length of the first octave; 0 means the noise does not repeat. */
  period?: number;
}

/** Several octaves of value noise added up, in [0, 1). */
export function fractalNoise(x: number, y: number, options: FractalOptions): number {
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;
  let weight = 0;
  for (let octave = 0; octave < options.octaves; octave += 1) {
    const period = (options.period ?? 0) * frequency;
    total += amplitude * valueNoise(x * frequency, y * frequency, options.seed + octave * 17, period);
    weight += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return total / weight;
}

/** A smooth, repeatable wobble in [-1, 1] over time, used for the flicker of the fire. */
export function flicker(time: number, seed: number): number {
  const slow = valueNoise(time * 2.3, seed * 0.37, seed) - 0.5;
  const fast = valueNoise(time * 9.1, seed * 1.91, seed + 5) - 0.5;
  return Math.max(-1, Math.min(1, slow * 1.4 + fast * 0.9));
}
