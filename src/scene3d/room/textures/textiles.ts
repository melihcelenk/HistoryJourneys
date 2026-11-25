/**
 * Woven things: the knotted carpets, and the silks and velvets of the cushions.
 */
import * as THREE from 'three';
import { PALETTE, hexToRgb, shade } from '../palette';
import { abrash, carpetKnot, type CarpetPlan } from '../carpetPattern';
import { hash2 } from '../random';
import {
  addNoise,
  canvasTexture,
  createCanvas,
  noiseCanvas,
  normalMapFromHeight,
  overlayCanvas,
  scaled,
  type Canvas2D,
  type TextureContext,
  type TextureSet,
} from '../textureTools';

/** Side length of one knot of a carpet, in metres. */
export const KNOT_METRES = 0.0075;
const FRINGE_KNOTS = 9;
const CARPET_UPSCALE = 2;

export interface CarpetDesign {
  /** Size of the woven part in metres. */
  width: number;
  length: number;
  borderMetres: number;
  repeatMetres: number;
  /** Colours in the order of `CARPET_COLOURS`: field, pattern, accent, light, dark, border. */
  palette: readonly string[];
  seed: number;
}

/** The knot grid of a carpet design. */
export function carpetPlan(design: CarpetDesign): CarpetPlan {
  const repeat = Math.round(design.repeatMetres / KNOT_METRES / 2) * 2;
  return {
    knotsX: Math.round(design.width / KNOT_METRES),
    knotsY: Math.round(design.length / KNOT_METRES),
    border: Math.round(design.borderMetres / KNOT_METRES),
    repeat,
    seed: design.seed,
  };
}

function paintKnots(design: CarpetDesign, plan: CarpetPlan): Canvas2D {
  const layer = createCanvas(plan.knotsX, plan.knotsY + FRINGE_KNOTS * 2);
  const image = layer.ctx.createImageData(layer.canvas.width, layer.canvas.height);
  const colours = design.palette.map(hexToRgb);
  const ivory = hexToRgb(PALETTE.carpetIvory);
  for (let row = 0; row < layer.canvas.height; row += 1) {
    const y = row - FRINGE_KNOTS;
    const inFringe = y < 0 || y >= plan.knotsY;
    const tone = inFringe ? 0 : abrash(plan, y);
    for (let x = 0; x < plan.knotsX; x += 1) {
      const offset = (row * plan.knotsX + x) * 4;
      const colour = inFringe ? ivory : (colours[carpetKnot(plan, x, y)] ?? ivory);
      const grain = 1 + tone + (hash2(x, row, plan.seed) - 0.5) * 0.1;
      image.data[offset] = colour[0] * grain;
      image.data[offset + 1] = colour[1] * grain;
      image.data[offset + 2] = colour[2] * grain;
      // The fringe is a row of separate threads: every other column stays clear.
      image.data[offset + 3] = inFringe && (x % 3 === 0 || hash2(x, 7, plan.seed) < 0.15) ? 0 : 255;
    }
  }
  layer.ctx.putImageData(image, 0, 0);
  return layer;
}

/** Builds the texture of a knotted carpet; the fringes at its two ends are part of the image. */
export function buildCarpet(design: CarpetDesign, context: TextureContext): THREE.CanvasTexture {
  const plan = carpetPlan(design);
  const knots = paintKnots(design, plan);
  const upscale = CARPET_UPSCALE * context.scale;
  const layer = createCanvas(knots.canvas.width * upscale, knots.canvas.height * upscale);
  layer.ctx.imageSmoothingEnabled = false;
  layer.ctx.drawImage(knots.canvas, 0, 0, layer.canvas.width, layer.canvas.height);
  const texture = canvasTexture(layer.canvas, context, true);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/** Length in metres that the fringe adds to each end of a carpet. */
export const FRINGE_METRES = FRINGE_KNOTS * KNOT_METRES;

const PILE_PIXELS = 256;

/** A fine, bumpy normal map shared by carpets and cloth; `cells` sets how coarse the bumps are. */
export function buildWeaveNormal(context: TextureContext, cells: number, strength: number, seed: number): THREE.CanvasTexture {
  const size = scaled(PILE_PIXELS, context);
  const relief = { width: size, height: size, data: new Float32Array(size * size) };
  addNoise(relief, 1, cells, seed, 3);
  return canvasTexture(normalMapFromHeight(relief, strength), context, false);
}

const CLOTH_PIXELS = 512;
const CLOTH_SEED = 1481;

function clothLayer(context: TextureContext, ground: string, seed: number): Canvas2D {
  const size = scaled(CLOTH_PIXELS, context);
  const layer = createCanvas(size, size);
  layer.ctx.fillStyle = ground;
  layer.ctx.fillRect(0, 0, size, size);
  overlayCanvas(layer, noiseCanvas(128, 6, seed).canvas, 'soft-light', 0.4);
  layer.ctx.scale(size / CLOTH_PIXELS, size / CLOTH_PIXELS);
  return layer;
}

function finishCloth(layer: Canvas2D, context: TextureContext, seed: number): TextureSet {
  layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
  overlayCanvas(layer, noiseCanvas(256, 64, seed + 1, 2).canvas, 'soft-light', 0.35);
  return { map: canvasTexture(layer.canvas, context, true) };
}

/** Three balls over a pair of wavy lines: the cintamani motif of Ottoman court silks. */
function cintamani(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, ground: string): void {
  ctx.fillStyle = PALETTE.gold;
  const balls: [number, number][] = [[0, -size * 0.62], [-size * 0.36, -size * 0.02], [size * 0.36, -size * 0.02]];
  for (const [dx, dy] of balls) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.gold;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + dx + size * 0.07, y + dy + size * 0.05, size * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = ground;
    ctx.fill();
  }
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = size * 0.14;
  ctx.lineCap = 'round';
  for (const lift of [0.55, 0.85]) {
    ctx.beginPath();
    ctx.moveTo(x - size * 0.75, y + size * lift);
    ctx.bezierCurveTo(x - size * 0.3, y + size * (lift - 0.3), x + size * 0.3, y + size * (lift + 0.3), x + size * 0.75, y + size * lift);
    ctx.stroke();
  }
}

/** Builds crimson velvet with gold cintamani (catma); one repeat covers `VELVET_METRES`. */
export function buildVelvet(context: TextureContext): TextureSet {
  const layer = clothLayer(context, PALETTE.velvetCrimson, CLOTH_SEED);
  const step = CLOTH_PIXELS / 2;
  for (let row = -1; row <= 2; row += 1) {
    for (let column = -1; column <= 2; column += 1) {
      const shift = row % 2 === 0 ? 0 : step / 2;
      cintamani(layer.ctx, column * step + shift + step / 4, row * step + step / 2, step * 0.2, PALETTE.velvetCrimson);
    }
  }
  return finishCloth(layer, context, CLOTH_SEED);
}

function ogive(ctx: CanvasRenderingContext2D, x: number, y: number, halfWidth: number, halfHeight: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - halfHeight);
  ctx.bezierCurveTo(x + halfWidth * 0.2, y - halfHeight * 0.55, x + halfWidth, y - halfHeight * 0.45, x + halfWidth, y);
  ctx.bezierCurveTo(x + halfWidth, y + halfHeight * 0.45, x + halfWidth * 0.2, y + halfHeight * 0.55, x, y + halfHeight);
  ctx.bezierCurveTo(x - halfWidth * 0.2, y + halfHeight * 0.55, x - halfWidth, y + halfHeight * 0.45, x - halfWidth, y);
  ctx.bezierCurveTo(x - halfWidth, y - halfHeight * 0.45, x - halfWidth * 0.2, y - halfHeight * 0.55, x, y - halfHeight);
  ctx.closePath();
}

/** Builds a silk with a lattice of pointed ovals, each holding a flower, in `figure` colour on the given ground. */
export function buildBrocade(context: TextureContext, ground: string, seed: number, figure: string = PALETTE.gold): TextureSet {
  const layer = clothLayer(context, ground, seed);
  const { ctx } = layer;
  const stepX = CLOTH_PIXELS / 2;
  const stepY = CLOTH_PIXELS;
  for (let row = -1; row <= 2; row += 1) {
    for (let column = -1; column <= 2; column += 1) {
      const x = column * stepX + (row % 2 === 0 ? 0 : stepX / 2);
      const y = (row * stepY) / 2;
      ogive(ctx, x, y, stepX * 0.47, stepY * 0.47);
      ctx.strokeStyle = figure;
      ctx.lineWidth = 9;
      ctx.stroke();
      ctx.fillStyle = figure;
      for (let petal = 0; petal < 6; petal += 1) {
        const angle = (petal * Math.PI) / 3;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(angle) * stepX * 0.14, y + Math.sin(angle) * stepX * 0.14, stepX * 0.1, stepX * 0.045, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, y, stepX * 0.05, 0, Math.PI * 2);
      ctx.fillStyle = shade(ground, 0.5);
      ctx.fill();
    }
  }
  return finishCloth(layer, context, seed);
}

/** Builds a striped silk: broad bands of the given colours divided by thin gold lines. */
export function buildStripes(context: TextureContext, colours: readonly string[], seed: number): TextureSet {
  const layer = clothLayer(context, colours[0] ?? PALETTE.silkIvory, seed);
  const band = CLOTH_PIXELS / colours.length;
  colours.forEach((colour, index) => {
    layer.ctx.fillStyle = colour;
    layer.ctx.fillRect(index * band, 0, band, CLOTH_PIXELS);
    layer.ctx.fillStyle = PALETTE.gold;
    layer.ctx.fillRect(index * band - 4, 0, 8, CLOTH_PIXELS);
    layer.ctx.fillStyle = PALETTE.paintBlack;
    layer.ctx.fillRect(index * band + 10, 0, 3, CLOTH_PIXELS);
  });
  return finishCloth(layer, context, seed);
}
