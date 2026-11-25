/**
 * Drawing by hand: lines that waver and are gone over twice, as a quill draws them, and thin washes of colour
 * that do not quite keep inside the lines. Used for the signs and routes of the map, so that nothing on it looks
 * printed. The shaking is taken from a seeded random number, so the same drawing comes out the same every time.
 */
export type InkPoint = readonly [number, number];
export type Stroke = readonly InkPoint[];

export interface Pen {
  context: CanvasRenderingContext2D;
  /** A repeatable random number in [0, 1). */
  next: () => number;
  /** Width of the nib, in the units the pen draws in. */
  width: number;
}

/** The hand: how far a point strays, how far a stroke bows between two points, how strong a wash is. */
const HAND = { shake: 1.5, bow: 2.2, washStrength: 0.32 } as const;

/** A repeatable random number in [0, 1). */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Draws a line through the given points, each moved a little by the hand, in two passes that do not quite cover each other. */
export function ink(pen: Pen, points: Stroke, closed = false): void {
  const { context, next } = pen;
  for (let pass = 0; pass < 2; pass += 1) {
    const shaken = points.map(([x, y]): [number, number] => [x + (next() - 0.5) * HAND.shake, y + (next() - 0.5) * HAND.shake]);
    const first = shaken[0];
    if (!first) return;
    context.beginPath();
    context.moveTo(first[0], first[1]);
    for (let i = 1; i < shaken.length; i += 1) {
      const from = shaken[i - 1] as [number, number];
      const to = shaken[i] as [number, number];
      // A slight bow in every stroke: no line drawn by hand is straight.
      const bow = (next() - 0.5) * HAND.bow;
      context.quadraticCurveTo((from[0] + to[0]) / 2 + bow, (from[1] + to[1]) / 2 + bow, to[0], to[1]);
    }
    if (closed) context.closePath();
    context.lineWidth = pen.width * (0.8 + next() * 0.5);
    context.stroke();
  }
}

/** Lays a thin wash of colour inside an outline, a little off the lines, as a brush does. */
export function wash(pen: Pen, points: Stroke, colour: string): void {
  const { context, next } = pen;
  context.save();
  context.fillStyle = colour;
  context.globalAlpha = HAND.washStrength;
  context.beginPath();
  points.forEach(([x, y], index) => {
    const px = x + (next() - 0.5) * HAND.shake * 2 + 1.5;
    const py = y + (next() - 0.5) * HAND.shake * 2 + 1;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  });
  context.closePath();
  context.fill();
  context.restore();
}

/** Points along an arc, for domes and wheels; angles in radians, measured as the canvas measures them. */
export function arcPoints(centre: InkPoint, radius: InkPoint, from: number, to: number, steps = 8): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, index): [number, number] => {
    const angle = from + ((to - from) * index) / steps;
    return [centre[0] + Math.cos(angle) * radius[0], centre[1] + Math.sin(angle) * radius[1]];
  });
}

/** Short strokes across a line at each of its points: the towers of a wall, the links of a chain. */
export function tick(pen: Pen, stroke: Stroke, length: number): void {
  stroke.forEach(([x, y], index) => {
    const [nx, ny] = stroke[Math.min(stroke.length - 1, index + 1)] as InkPoint;
    const [bx, by] = stroke[Math.max(0, index - 1)] as InkPoint;
    const along = Math.hypot(nx - bx, ny - by) || 1;
    const ax = (-(ny - by) / along) * length;
    const ay = ((nx - bx) / along) * length;
    ink(pen, [
      [x - ax, y - ay],
      [x + ax, y + ay],
    ]);
  });
}

/** The two barbs of an arrow head at the end of a stroke. */
export function arrowHead(pen: Pen, stroke: Stroke, size: number): void {
  const tip = stroke.at(-1);
  const before = stroke.at(-2);
  if (!tip || !before) return;
  const angle = Math.atan2(tip[1] - before[1], tip[0] - before[0]);
  const barb = (turn: number): [number, number] => [tip[0] - Math.cos(angle + turn) * size, tip[1] - Math.sin(angle + turn) * size];
  ink(pen, [barb(0.5), [tip[0], tip[1]], barb(-0.5)]);
}
