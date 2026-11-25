/**
 * Keeps the game fluid on a weak graphics card by drawing fewer pixels: when frames take too long, the picture
 * is drawn a step coarser and stretched to the screen. Pure functions; the scene applies the result.
 */
export interface ResolutionLimits {
  /** The coarsest the picture may get, as a share of the pixels of the page. */
  floor: number;
  /** A mean frame time above this, in milliseconds, is too slow. */
  slowFrameMs: number;
  /** What the fineness is multiplied by when frames are too slow. */
  step: number;
}

/**
 * What the scene uses: about 40 frames a second is the least it accepts. The limit is not set tighter, because a
 * few slow frames among many fast ones would then make the picture coarse for nothing.
 */
export const RESOLUTION_LIMITS: ResolutionLimits = { floor: 0.7, slowFrameMs: 25, step: 0.85 };

/**
 * The fineness to draw at next, given the fineness now and how long frames took. It only ever gets coarser: a
 * picture that grew finer again as soon as frames were fast would swing back and forth.
 */
export function nextPixelRatio(ratio: number, meanFrameMs: number, limits: ResolutionLimits): number {
  if (meanFrameMs <= limits.slowFrameMs) return ratio;
  return Math.max(limits.floor, ratio * limits.step);
}

export interface FrameMeter {
  /** Takes the time of one frame, in milliseconds; returns the mean of a window of frames when one is full. */
  add(frameMs: number): number | null;
}

export interface FrameMeterOptions {
  /** Frames in one reading. */
  window: number;
  /** Frames at the start that are not counted: loading makes them slow whatever the graphics card. */
  skip: number;
}

export function createFrameMeter(options: FrameMeterOptions): FrameMeter {
  let skipped = 0;
  let count = 0;
  let sum = 0;
  return {
    add(frameMs) {
      if (skipped < options.skip) {
        skipped += 1;
        return null;
      }
      count += 1;
      sum += frameMs;
      if (count < options.window) return null;
      const mean = sum / count;
      count = 0;
      sum = 0;
      return mean;
    },
  };
}
