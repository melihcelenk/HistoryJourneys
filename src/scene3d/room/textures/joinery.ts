/**
 * Painted and inlaid woodwork: the star-and-cross panels of the doors and shutters (in the manner of kundekari
 * joinery) and the painted boards of the ceiling.
 */
import { PALETTE, shade } from '../palette';
import { starPolygon, type Point2 } from '../patterns';
import { hash2 } from '../random';
import {
  blurHeight,
  canvasTexture,
  createCanvas,
  heightFromCanvas,
  noiseCanvas,
  noiseMaskCanvas,
  normalMapFromHeight,
  overlayCanvas,
  scaled,
  tracePolygon,
  type Canvas2D,
  type TextureContext,
  type TextureSet,
} from '../textureTools';

const PANEL_PIXELS = 1024;
const PANEL_STARS = 4;
const PANEL_SEED = 640;
/** Inner radius of an eight-pointed star made of two squares, as a share of its outer radius. */
const STAR_INNER_RATIO = Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8);

/** Metres of wood that one repeat of the star-and-cross panel texture covers. */
export const PANEL_METRES = 0.44;

function paintStar(colour: Canvas2D, relief: Canvas2D, centre: Point2, radius: number, id: number): void {
  const outline = starPolygon(centre, 8, radius * 0.93, radius * 0.93 * STAR_INNER_RATIO);
  tracePolygon(colour.ctx, outline);
  colour.ctx.fillStyle = shade(PALETTE.walnutDark, (hash2(id, 1, PANEL_SEED) - 0.3) * 0.12);
  colour.ctx.fill();
  tracePolygon(relief.ctx, outline);
  relief.ctx.fillStyle = 'rgb(235, 235, 235)';
  relief.ctx.fill();
  const inner = starPolygon(centre, 8, radius * 0.55, radius * 0.55 * STAR_INNER_RATIO, Math.PI / 8);
  tracePolygon(colour.ctx, inner);
  colour.ctx.fillStyle = PALETTE.walnutLight;
  colour.ctx.fill();
  tracePolygon(relief.ctx, inner);
  relief.ctx.fillStyle = 'rgb(180, 180, 180)';
  relief.ctx.fill();
  for (const layer of [colour, relief]) {
    layer.ctx.beginPath();
    layer.ctx.arc(centre[0], centre[1], radius * 0.11, 0, Math.PI * 2);
    layer.ctx.fillStyle = layer === colour ? '#bfae88' : 'rgb(255, 255, 255)';
    layer.ctx.fill();
  }
}

/** Builds the star-and-cross panel: dark eight-pointed stars with ivory studs, set between lighter crosses. */
export function buildStarPanel(context: TextureContext): TextureSet {
  const size = scaled(PANEL_PIXELS, context);
  const colour = createCanvas(size, size);
  const relief = createCanvas(size, size);
  colour.ctx.fillStyle = PALETTE.walnut;
  colour.ctx.fillRect(0, 0, size, size);
  overlayCanvas(colour, noiseCanvas(256, 14, PANEL_SEED + 4).canvas, 'soft-light', 0.5);
  relief.ctx.fillStyle = 'rgb(150, 150, 150)';
  relief.ctx.fillRect(0, 0, size, size);
  const step = size / PANEL_STARS;
  for (let row = 0; row <= PANEL_STARS; row += 1) {
    for (let column = 0; column <= PANEL_STARS; column += 1) {
      const id = (row % PANEL_STARS) * PANEL_STARS + (column % PANEL_STARS);
      paintStar(colour, relief, [column * step, row * step], step / 2, id);
    }
  }
  // Grooves between the pieces: the outline of every star, cut dark into both maps.
  for (const layer of [colour, relief]) {
    layer.ctx.strokeStyle = layer === colour ? PALETTE.ebony : 'rgb(20, 20, 20)';
    layer.ctx.lineWidth = step * 0.035;
    for (let row = 0; row <= PANEL_STARS; row += 1) {
      for (let column = 0; column <= PANEL_STARS; column += 1) {
        tracePolygon(layer.ctx, starPolygon([column * step, row * step], 8, step / 2, (step / 2) * STAR_INNER_RATIO));
        layer.ctx.stroke();
      }
    }
  }
  overlayCanvas(colour, noiseCanvas(256, 40, PANEL_SEED + 5).canvas, 'soft-light', 0.35);
  const height = blurHeight(heightFromCanvas(relief), 2 * context.scale);
  return {
    map: canvasTexture(colour.canvas, context, true),
    normalMap: canvasTexture(normalMapFromHeight(height, 7), context, false),
  };
}

const COFFER_PIXELS = 512;
const CEILING_SEED = 1478;

/** Side length in metres of one painted coffer of the ceiling. */
export const COFFER_METRES = 0.6;

function goldLine(ctx: CanvasRenderingContext2D, width: number): void {
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = width;
  ctx.stroke();
}

function cofferCorner(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  ctx.fillStyle = PALETTE.paintGreen;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  goldLine(ctx, 4);
  ctx.fillStyle = PALETTE.gold;
  for (let index = 0; index < 8; index += 1) {
    const angle = (index * Math.PI) / 4;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(angle) * radius * 0.5, y + Math.sin(angle) * radius * 0.5, radius * 0.3, radius * 0.11, angle, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Wears the paint and lays the grain of the boards over it. */
function agePaintedWood(layer: Canvas2D, seed: number): void {
  layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
  const wear = noiseMaskCanvas(256, 12, seed, 0.6, 0.1);
  const stain = createCanvas(layer.canvas.width, layer.canvas.height);
  stain.ctx.fillStyle = PALETTE.walnutDark;
  stain.ctx.fillRect(0, 0, stain.canvas.width, stain.canvas.height);
  overlayCanvas(stain, wear.canvas, 'destination-out', 1);
  layer.ctx.save();
  layer.ctx.globalAlpha = 0.28;
  layer.ctx.globalCompositeOperation = 'multiply';
  layer.ctx.drawImage(stain.canvas, 0, 0);
  layer.ctx.restore();
  overlayCanvas(layer, noiseCanvas(256, 30, seed + 1).canvas, 'soft-light', 0.3);
}

/** Builds one painted coffer: a gold star on blue in a red field, with green roundels in the corners. */
export function buildCoffer(context: TextureContext): TextureSet {
  const size = scaled(COFFER_PIXELS, context);
  const layer = createCanvas(size, size);
  const { ctx } = layer;
  ctx.scale(size / COFFER_PIXELS, size / COFFER_PIXELS);
  const full = COFFER_PIXELS;
  ctx.fillStyle = '#6a1a16';
  ctx.fillRect(0, 0, full, full);
  const middle: Point2 = [full / 2, full / 2];
  tracePolygon(ctx, starPolygon(middle, 8, full * 0.4, full * 0.4 * STAR_INNER_RATIO));
  ctx.fillStyle = PALETTE.paintBlue;
  ctx.fill();
  goldLine(ctx, 7);
  tracePolygon(ctx, starPolygon(middle, 8, full * 0.24, full * 0.11, Math.PI / 8));
  ctx.fillStyle = PALETTE.gold;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(middle[0], middle[1], full * 0.07, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.paintRed;
  ctx.fill();
  goldLine(ctx, 3);
  for (const [x, y] of [[0, 0], [full, 0], [0, full], [full, full]] as const) cofferCorner(ctx, x, y, full * 0.17);
  agePaintedWood(layer, CEILING_SEED);
  return { map: canvasTexture(layer.canvas, context, true) };
}

const ROSETTE_PIXELS = 1024;
const ROSETTE_POINTS = 12;

function rosetteRing(ctx: CanvasRenderingContext2D, radius: number, fill: string, lineWidth: number): void {
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  goldLine(ctx, lineWidth);
}

function rosettePetals(ctx: CanvasRenderingContext2D, count: number, reach: number, size: readonly [number, number], colour: string, lineWidth: number): void {
  ctx.fillStyle = colour;
  for (let index = 0; index < count; index += 1) {
    const angle = (index * Math.PI * 2) / count;
    ctx.beginPath();
    ctx.ellipse(Math.cos(angle) * reach, Math.sin(angle) * reach, size[0], size[1], angle, 0, Math.PI * 2);
    ctx.fill();
    goldLine(ctx, lineWidth);
  }
}

/** Builds the painted disc of the ceiling's centrepiece: a twelve-pointed star in rings of red, blue and gold. */
export function buildRosette(context: TextureContext): TextureSet {
  const size = scaled(ROSETTE_PIXELS, context);
  const layer = createCanvas(size, size);
  const { ctx } = layer;
  ctx.fillStyle = PALETTE.walnutDark;
  ctx.fillRect(0, 0, size, size);
  ctx.translate(size / 2, size / 2);
  ctx.scale(size / 2, size / 2);
  ctx.lineJoin = 'round';
  const unit = 2 / ROSETTE_PIXELS;
  rosetteRing(ctx, 0.98, PALETTE.goldDeep, unit * 6);
  rosetteRing(ctx, 0.93, '#6a1a16', unit * 6);
  rosettePetals(ctx, 24, 0.84, [0.07, 0.03], PALETTE.gold, unit * 2);
  rosetteRing(ctx, 0.75, PALETTE.paintBlue, unit * 8);
  tracePolygon(ctx, starPolygon([0, 0], ROSETTE_POINTS, 0.74, 0.5));
  ctx.fillStyle = '#6a1a16';
  ctx.fill();
  goldLine(ctx, unit * 7);
  tracePolygon(ctx, starPolygon([0, 0], ROSETTE_POINTS, 0.56, 0.36, Math.PI / ROSETTE_POINTS));
  ctx.fillStyle = PALETTE.paintGreen;
  ctx.fill();
  goldLine(ctx, unit * 6);
  rosettePetals(ctx, ROSETTE_POINTS, 0.27, [0.11, 0.045], PALETTE.paintBlue, unit * 4);
  rosetteRing(ctx, 0.15, PALETTE.gold, unit * 4);
  agePaintedWood(layer, CEILING_SEED + 7);
  return { map: canvasTexture(layer.canvas, context, true) };
}

const BOARD_PIXELS = { width: 1024, height: 512 } as const;

/** Metres of ceiling border that one repeat of the painted board covers, along and across. */
export const CEILING_BORDER_METRES = { length: 1.2, width: 0.6 } as const;

/** Builds the painted board that frames the ceiling: a chain of gold lozenges and blue roundels on dark green. */
export function buildCeilingBorder(context: TextureContext): TextureSet {
  const layer = createCanvas(scaled(BOARD_PIXELS.width, context), scaled(BOARD_PIXELS.height, context));
  const { ctx } = layer;
  ctx.scale(layer.canvas.width / BOARD_PIXELS.width, layer.canvas.height / BOARD_PIXELS.height);
  const { width, height } = BOARD_PIXELS;
  ctx.fillStyle = '#1d3d30';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#6a1a16';
  ctx.fillRect(0, 0, width, height * 0.12);
  ctx.fillRect(0, height * 0.88, width, height * 0.12);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(0, height * 0.12, width, height * 0.025);
  ctx.fillRect(0, height * 0.855, width, height * 0.025);
  for (const centreX of [0, width / 2, width]) {
    tracePolygon(ctx, starPolygon([centreX, height / 2], 4, height * 0.33, height * 0.17));
    ctx.fillStyle = PALETTE.paintRed;
    ctx.fill();
    goldLine(ctx, 7);
    ctx.beginPath();
    ctx.arc(centreX, height / 2, height * 0.09, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.gold;
    ctx.fill();
  }
  for (const centreX of [width / 4, (width * 3) / 4]) {
    ctx.beginPath();
    ctx.arc(centreX, height / 2, height * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.paintBlue;
    ctx.fill();
    goldLine(ctx, 6);
    tracePolygon(ctx, starPolygon([centreX, height / 2], 6, height * 0.15, height * 0.07));
    ctx.fillStyle = PALETTE.gold;
    ctx.fill();
  }
  agePaintedWood(layer, CEILING_SEED + 13);
  return { map: canvasTexture(layer.canvas, context, true) };
}
