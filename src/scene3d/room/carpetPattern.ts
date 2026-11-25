/**
 * The knot grid of the carpets: which colour each knot of a small-pattern "Holbein" carpet has. Pure functions on
 * numbers, shared by the texture painter and the unit tests.
 */
import { hash2 } from './random';

/** Colours of a carpet, as indices into its palette. */
export const CARPET_COLOURS = { field: 0, pattern: 1, accent: 2, light: 3, dark: 4, border: 5, alt: 6 } as const;

export interface CarpetPlan {
  /** Number of knots across and along the carpet. */
  knotsX: number;
  knotsY: number;
  /** Width of the whole border, in knots. */
  border: number;
  /** Size of one repeat of the field pattern, in knots. */
  repeat: number;
  seed: number;
}

function diamondDistance(x: number, y: number): number {
  return Math.abs(x) + Math.abs(y);
}

function octagonDistance(x: number, y: number): number {
  return Math.max(Math.abs(x), Math.abs(y), (Math.abs(x) + Math.abs(y)) * 0.72);
}

/** True inside an eight-pointed star (a square laid over a diamond) of the given outer radius. */
function insideStar(x: number, y: number, radius: number): boolean {
  return Math.max(Math.abs(x), Math.abs(y)) < radius * Math.SQRT1_2 || diamondDistance(x, y) < radius;
}

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

/** The star in the heart of an octagon medallion. */
function medallionHeart(x: number, y: number, radius: number, ground: number): number {
  if (!insideStar(x, y, radius)) return ground;
  if (!insideStar(x, y, radius - 1.6)) return CARPET_COLOURS.light;
  if (diamondDistance(x, y) < 2.6) return CARPET_COLOURS.accent;
  if (Math.abs(x) < 1 || Math.abs(y) < 1) return CARPET_COLOURS.dark;
  return CARPET_COLOURS.field;
}

const OUTLINE = 1.2;
const INTERLACE = 3;

/** An octagon medallion: a dark outline, a band of interlace in two colours and a star on a coloured ground. */
function octagonKnot(x: number, y: number, radius: number, ground: number): number | null {
  const distance = octagonDistance(x, y);
  if (distance > radius) return null;
  const bandInner = radius - OUTLINE - INTERLACE;
  if (distance > radius - OUTLINE) return CARPET_COLOURS.dark;
  if (distance > bandInner) {
    const turn = ((Math.atan2(y, x) + Math.PI) / (Math.PI / 8) + 0.5) % 2;
    if (turn % 1 < 0.14) return CARPET_COLOURS.dark;
    return turn < 1 ? CARPET_COLOURS.light : CARPET_COLOURS.accent;
  }
  if (distance > bandInner - OUTLINE) return CARPET_COLOURS.dark;
  return medallionHeart(x, y, (bandInner - OUTLINE) * 0.8, ground);
}

/** The small diamond that sits where four octagons meet. */
function diamondKnot(x: number, y: number, radius: number): number | null {
  const distance = diamondDistance(x, y);
  if (distance > radius) return null;
  if (distance > radius - 1.4) return CARPET_COLOURS.dark;
  if (distance > radius - 3) return CARPET_COLOURS.light;
  if (distance < 1.6) return CARPET_COLOURS.dark;
  return Math.abs(x) < 1 || Math.abs(y) < 1 ? CARPET_COLOURS.field : CARPET_COLOURS.accent;
}

/**
 * Colour of one knot of the field of a small-pattern "Holbein" carpet: rows of octagons with an interlaced
 * outline whose grounds alternate between two colours, diamonds in the gaps between them and small studs on
 * the lines that join them.
 */
export function holbeinFieldKnot(x: number, y: number, repeat: number): number {
  const half = repeat / 2;
  const localX = positiveModulo(x, repeat) - half;
  const localY = positiveModulo(y, repeat) - half;
  const cellParity = positiveModulo(Math.floor(x / repeat) + Math.floor(y / repeat), 2);
  const ground = cellParity === 0 ? CARPET_COLOURS.pattern : CARPET_COLOURS.alt;
  const octagon = octagonKnot(localX, localY, half * 0.8, ground);
  if (octagon !== null) return octagon;
  const cornerX = localX < 0 ? localX + half : localX - half;
  const cornerY = localY < 0 ? localY + half : localY - half;
  const diamond = diamondKnot(cornerX, cornerY, half * 0.44);
  if (diamond !== null) return diamond;
  const stud = Math.min(diamondDistance(cornerX, localY), diamondDistance(localX, cornerY));
  return stud < 2.2 ? CARPET_COLOURS.light : CARPET_COLOURS.field;
}

const GUARD = { line: 2, cord: 6 } as const;
const GUARD_WIDTH = GUARD.line * 2 + GUARD.cord;
const BORDER_PERIOD = 24;

/** A guard stripe: a twisted cord of two colours between a dark and a light line. */
function guardKnot(across: number, along: number): number {
  if (across < GUARD.line) return CARPET_COLOURS.dark;
  if (across >= GUARD.line + GUARD.cord) return CARPET_COLOURS.light;
  return positiveModulo(along + across, 6) < 3 ? CARPET_COLOURS.field : CARPET_COLOURS.light;
}

function between(value: number, from: number, to: number): boolean {
  return value >= from && value < to;
}

/** True where the angular, pseudo-Kufic interlace of the main border runs. */
function borderInterlace(across: number, phase: number, band: number): boolean {
  const low = band * 0.32;
  const high = band * 0.68;
  if (between(across, 2, 4) || between(across, band - 4, band - 2)) return true;
  if (between(phase, 2, 4) && between(across, 4, high)) return true;
  if (between(phase, 14, 16) && between(across, low, band - 4)) return true;
  if (between(phase, 4, 10) && between(across, high - 2, high)) return true;
  return between(phase, 8, 14) && between(across, low, low + 2);
}

/** Colour of a knot in the border: two guard stripes around a band of angular interlace with small diamonds. */
function borderKnot(depth: number, along: number, border: number): number {
  if (depth < GUARD_WIDTH) return guardKnot(depth, along);
  if (depth >= border - GUARD_WIDTH) return guardKnot(border - 1 - depth, along);
  const band = border - GUARD_WIDTH * 2;
  const across = depth - GUARD_WIDTH;
  const phase = positiveModulo(along, BORDER_PERIOD);
  if (borderInterlace(across, phase, band)) return CARPET_COLOURS.light;
  const jewel = Math.min(diamondDistance(phase - 8.5, across - band * 0.3), diamondDistance(phase - 20.5, across - band * 0.7));
  return jewel < 2.4 ? CARPET_COLOURS.accent : CARPET_COLOURS.border;
}

/** Palette index of the knot at (x, y) of a carpet; the same plan always gives the same carpet. */
export function carpetKnot(plan: CarpetPlan, x: number, y: number): number {
  const depth = Math.min(x, y, plan.knotsX - 1 - x, plan.knotsY - 1 - y);
  if (depth < plan.border) {
    // Measured from the nearer end, so that the two halves of every border mirror each other.
    const fromEndX = Math.min(x, plan.knotsX - 1 - x);
    const fromEndY = Math.min(y, plan.knotsY - 1 - y);
    return borderKnot(depth, fromEndX < fromEndY ? fromEndY : fromEndX, plan.border);
  }
  const fieldWidth = plan.knotsX - plan.border * 2;
  const fieldLength = plan.knotsY - plan.border * 2;
  const offsetX = Math.floor(positiveModulo(fieldWidth, plan.repeat) / 2);
  const offsetY = Math.floor(positiveModulo(fieldLength, plan.repeat) / 2);
  return holbeinFieldKnot(x - plan.border - offsetX, y - plan.border - offsetY, plan.repeat);
}

/** A small, repeatable change of brightness per knot row, like the uneven dye lots (abrash) of a hand-woven carpet. */
export function abrash(plan: CarpetPlan, y: number): number {
  const band = Math.floor(y / 9);
  return (hash2(band, 0, plan.seed) - 0.5) * 0.12 + (hash2(y, 1, plan.seed) - 0.5) * 0.04;
}
