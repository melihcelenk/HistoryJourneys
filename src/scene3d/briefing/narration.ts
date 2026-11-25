/**
 * Where a briefing stands: at one of its steps, or not running. Pure functions; whoever shows the briefing keeps
 * the value and asks these for the next one.
 */
export type Narration = { readonly step: number } | null;

export function isRunning(narration: Narration): narration is { readonly step: number } {
  return narration !== null;
}

/** Starts a briefing at its first step. */
export function begin(): Narration {
  return { step: 0 };
}

/** Goes to the next step; after the last of `stepCount` steps the briefing ends. */
export function forward(narration: Narration, stepCount: number): Narration {
  if (!isRunning(narration)) return null;
  return narration.step + 1 < stepCount ? { step: narration.step + 1 } : null;
}

/** Goes to the step before; the first step stays the first. */
export function back(narration: Narration): Narration {
  if (!isRunning(narration)) return null;
  return { step: Math.max(0, narration.step - 1) };
}
