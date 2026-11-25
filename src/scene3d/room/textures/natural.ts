/** Plain building materials painted in code: walnut wood, veined marble and the hexagonal brick tiles of the floor. */
import { PALETTE, hexToRgb, shade } from '../palette';
import { hexagonCorners, type Point2 } from '../patterns';
import { createRandom, fractalNoise, hash2 } from '../random';
import {
  blurHeight,
  canvasTexture,
  createCanvas,
  heightFromCanvas,
  noiseCanvas,
  normalMapFromHeight,
  overlayCanvas,
  scaled,
  tracePolygon,
  type TextureContext,
  type TextureSet,
} from '../textureTools';

const WOOD_PIXELS = 1024;
const WOOD_SEED = 77;
const GRAIN_LINES = 520;

function grainLine(ctx: CanvasRenderingContext2D, x: number, size: number, sway: number, cycles: number, phase: number): void {
  ctx.beginPath();
  for (let step = 0; step <= 32; step += 1) {
    const px = x + Math.sin((step / 32) * Math.PI * 2 * cycles + phase) * sway;
    if (step === 0) ctx.moveTo(px, 0);
    else ctx.lineTo(px, (step / 32) * size);
  }
  ctx.stroke();
}

/** Builds a wood texture with the grain running along the v axis. `base` is the colour of the wood. */
export function buildWood(context: TextureContext, base: string, seed = WOOD_SEED): TextureSet {
  const size = scaled(WOOD_PIXELS, context);
  const layer = createCanvas(size, size);
  const { ctx } = layer;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  const random = createRandom(seed);
  for (let line = 0; line < GRAIN_LINES; line += 1) {
    const x = random() * size;
    const sway = (random() - 0.5) * size * 0.02;
    const cycles = 1 + Math.floor(random() * 3);
    ctx.strokeStyle = random() > 0.35 ? `rgba(20, 8, 2, ${0.05 + random() * 0.22})` : `rgba(255, 200, 140, ${0.03 + random() * 0.1})`;
    ctx.lineWidth = (0.6 + random() * 2.4) * context.scale;
    for (const shift of [-size, 0, size]) grainLine(ctx, x + shift, size, sway, cycles, line);
  }
  overlayCanvas(layer, noiseCanvas(256, 5, seed + 1).canvas, 'soft-light', 0.45);
  const relief = blurHeight(heightFromCanvas(layer), 1, 1);
  return {
    map: canvasTexture(layer.canvas, context, true),
    normalMap: canvasTexture(normalMapFromHeight(relief, 2.5), context, false),
  };
}

const MARBLE_PIXELS = 512;
const MARBLE_SEED = 311;

/** Builds a pale marble with soft grey veins. */
export function buildMarble(context: TextureContext): TextureSet {
  const size = scaled(MARBLE_PIXELS, context);
  const layer = createCanvas(size, size);
  const image = layer.ctx.createImageData(size, size);
  const base = hexToRgb(PALETTE.marble);
  const vein = hexToRgb(PALETTE.marbleVein);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x / size) * 4;
      const v = (y / size) * 4;
      const warp = fractalNoise(u, v, { seed: MARBLE_SEED, octaves: 5, period: 4 });
      const wave = Math.abs(Math.sin((u * 0.5 + v * 0.5 + warp * 3.2) * Math.PI));
      const amount = Math.pow(1 - wave, 9) * 0.8 + (fractalNoise(u * 3, v * 3, { seed: MARBLE_SEED + 9, octaves: 3, period: 12 }) - 0.5) * 0.12;
      const offset = (y * size + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        image.data[offset + channel] = (base[channel] ?? 0) + ((vein[channel] ?? 0) - (base[channel] ?? 0)) * Math.max(0, amount);
      }
      image.data[offset + 3] = 255;
    }
  }
  layer.ctx.putImageData(image, 0, 0);
  return { map: canvasTexture(layer.canvas, context, true) };
}

const BRICK_ACROSS = 0.26;
const BRICK_COLUMNS = 6;
const BRICK_ROW_PAIRS = 4;
const BRICK_PIXELS = 1024;
const BRICK_SEED = 905;
const BRICK_JOINT = 0.005;
const BRICK_SIDE = BRICK_ACROSS / Math.sqrt(3);

/** Size in metres of the floor area that one floor texture covers. */
export const FLOOR_METRES = { width: BRICK_ACROSS * BRICK_COLUMNS, height: BRICK_SIDE * 3 * BRICK_ROW_PAIRS } as const;

function brickCentres(): { centre: Point2; id: number }[] {
  const centres: { centre: Point2; id: number }[] = [];
  const rows = BRICK_ROW_PAIRS * 2;
  for (let row = -1; row <= rows; row += 1) {
    for (let column = -1; column <= BRICK_COLUMNS; column += 1) {
      const shift = row % 2 === 0 ? 0 : BRICK_ACROSS / 2;
      const id = ((row + rows) % rows) * BRICK_COLUMNS + ((column + BRICK_COLUMNS) % BRICK_COLUMNS);
      centres.push({ centre: [column * BRICK_ACROSS + shift, row * BRICK_SIDE * 1.5], id });
    }
  }
  return centres;
}

/** Builds the floor of hexagonal brick tiles laid in lime mortar. */
export function buildBrickFloor(context: TextureContext): TextureSet {
  const size = scaled(BRICK_PIXELS, context);
  const colour = createCanvas(size, size);
  const relief = createCanvas(size, size);
  colour.ctx.fillStyle = shade(PALETTE.grout, -0.25);
  colour.ctx.fillRect(0, 0, size, size);
  relief.ctx.fillStyle = 'rgb(30, 30, 30)';
  relief.ctx.fillRect(0, 0, size, size);
  for (const layer of [colour, relief]) layer.ctx.scale(size / FLOOR_METRES.width, size / FLOOR_METRES.height);
  for (const { centre, id } of brickCentres()) {
    const corners = hexagonCorners(centre, BRICK_SIDE, BRICK_JOINT);
    const tone = hash2(id, 1, BRICK_SEED);
    tracePolygon(colour.ctx, corners);
    colour.ctx.fillStyle = shade(tone > 0.5 ? PALETTE.terracotta : PALETTE.terracottaDark, (hash2(id, 2, BRICK_SEED) - 0.5) * 0.3);
    colour.ctx.fill();
    const lift = 140 + Math.round(hash2(id, 3, BRICK_SEED) * 90);
    tracePolygon(relief.ctx, corners);
    relief.ctx.fillStyle = `rgb(${lift}, ${lift}, ${lift})`;
    relief.ctx.fill();
  }
  for (const layer of [colour, relief]) layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
  overlayCanvas(colour, noiseCanvas(256, 20, BRICK_SEED + 1).canvas, 'soft-light', 0.5);
  overlayCanvas(colour, noiseCanvas(256, 3, BRICK_SEED + 2).canvas, 'multiply', 0.25);
  overlayCanvas(relief, noiseCanvas(256, 40, BRICK_SEED + 3).canvas, 'soft-light', 0.5);
  const height = blurHeight(heightFromCanvas(relief), 1.5);
  return {
    map: canvasTexture(colour.canvas, context, true),
    normalMap: canvasTexture(normalMapFromHeight(height, 4), context, false),
  };
}
