/**
 * Lime plaster of the upper walls and the bands painted on it (kalemisi): a narrow scroll band above the tiles and
 * a broad frieze of cartouches under the ceiling.
 */
import { PALETTE } from '../palette';
import {
  addNoise,
  canvasTexture,
  createCanvas,
  noiseCanvas,
  noiseMaskCanvas,
  normalMapFromHeight,
  overlayCanvas,
  scaled,
  type Canvas2D,
  type TextureContext,
  type TextureSet,
} from '../textureTools';

const PLASTER_SEED = 1451;
const PLASTER_PIXELS = 1024;
const PLASTER_RELIEF_PIXELS = 512;

/** Metres of wall that one plaster texture covers. */
export const PLASTER_METRES = 2.6;

/** Builds the maps of the plain plaster: uneven, slightly stained lime wash. */
export function buildPlaster(context: TextureContext): TextureSet {
  const size = scaled(PLASTER_PIXELS, context);
  const layer = createCanvas(size, size);
  layer.ctx.fillStyle = PALETTE.plaster;
  layer.ctx.fillRect(0, 0, size, size);
  overlayCanvas(layer, noiseCanvas(256, 4, PLASTER_SEED).canvas, 'multiply', 0.09);
  overlayCanvas(layer, noiseCanvas(256, 24, PLASTER_SEED + 1).canvas, 'soft-light', 0.16);

  const reliefSize = scaled(PLASTER_RELIEF_PIXELS, context);
  const relief = { width: reliefSize, height: reliefSize, data: new Float32Array(reliefSize * reliefSize) };
  addNoise(relief, 1, 10, PLASTER_SEED + 2, 5);
  return {
    map: canvasTexture(layer.canvas, context, true),
    normalMap: canvasTexture(normalMapFromHeight(relief, 2.2), context, false),
  };
}

const BAND_PIXELS = { width: 1024, height: 256 } as const;

/** Metres of wall after which the painted scroll band repeats. */
export const SCROLL_BAND_METRES = 0.88;
/** Metres of wall after which the frieze repeats. */
export const FRIEZE_METRES = 1.9;

function plasterGround(context: TextureContext, seed: number): Canvas2D {
  const layer = createCanvas(scaled(BAND_PIXELS.width, context), scaled(BAND_PIXELS.height, context));
  layer.ctx.fillStyle = PALETTE.plaster;
  layer.ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
  overlayCanvas(layer, noiseCanvas(256, 6, seed).canvas, 'multiply', 0.08);
  layer.ctx.scale(layer.canvas.width / BAND_PIXELS.width, layer.canvas.height / BAND_PIXELS.height);
  return layer;
}

/** Rubs the paint thin in patches, so that it reads as old paint on plaster and not as a print. */
function weatherPaint(paint: Canvas2D, seed: number): void {
  paint.ctx.setTransform(1, 0, 0, 1, 0, 0);
  overlayCanvas(paint, noiseMaskCanvas(256, 10, seed, 0.56, 0.1).canvas, 'destination-out', 0.55);
}

function rumiLeaf(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.2, -size * 0.6, size * 0.75, -size * 0.7, size, -size * 0.25);
  ctx.bezierCurveTo(size * 0.7, -size * 0.4, size * 0.5, -size * 0.25, size * 0.42, 0);
  ctx.bezierCurveTo(size * 0.3, -size * 0.12, size * 0.15, -size * 0.05, 0, 0);
  ctx.fill();
}

function scrollRepeat(ctx: CanvasRenderingContext2D, startX: number, length: number, middle: number, amplitude: number): void {
  ctx.strokeStyle = PALETTE.paintBlue;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(startX, middle);
  ctx.bezierCurveTo(startX + length * 0.25, middle - amplitude * 2, startX + length * 0.25, middle - amplitude * 2, startX + length * 0.5, middle);
  ctx.bezierCurveTo(startX + length * 0.75, middle + amplitude * 2, startX + length * 0.75, middle + amplitude * 2, startX + length, middle);
  ctx.stroke();
  [0.12, 0.62].forEach((position, index) => {
    const direction = index === 0 ? 1 : -1;
    ctx.save();
    ctx.translate(startX + length * position, middle - direction * amplitude * 0.7);
    ctx.scale(1, direction);
    ctx.fillStyle = PALETTE.paintBlue;
    rumiLeaf(ctx, amplitude * 1.9);
    ctx.scale(-1, -1);
    ctx.fillStyle = PALETTE.paintGreen;
    rumiLeaf(ctx, amplitude * 1.1);
    ctx.restore();
    ctx.fillStyle = PALETTE.paintRed;
    ctx.beginPath();
    ctx.arc(startX + length * (position + 0.13), middle - direction * amplitude * 1.0, amplitude * 0.26, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** Builds the narrow painted band that runs above the tiles: a scroll of split leaves between ruled lines. */
export function buildScrollBand(context: TextureContext): TextureSet {
  const layer = plasterGround(context, PLASTER_SEED + 10);
  const paint = createCanvas(layer.canvas.width, layer.canvas.height);
  const { ctx } = paint;
  ctx.scale(paint.canvas.width / BAND_PIXELS.width, paint.canvas.height / BAND_PIXELS.height);
  const rules: [number, number, string][] = [
    [14, 9, PALETTE.paintRed],
    [30, 4, PALETTE.paintBlue],
    [BAND_PIXELS.height - 23, 9, PALETTE.paintRed],
    [BAND_PIXELS.height - 34, 4, PALETTE.paintBlue],
  ];
  for (const [y, thickness, colour] of rules) {
    ctx.fillStyle = colour;
    ctx.fillRect(0, y, BAND_PIXELS.width, thickness);
  }
  const repeat = BAND_PIXELS.width / 2;
  for (let index = -1; index <= 2; index += 1) scrollRepeat(ctx, index * repeat, repeat, BAND_PIXELS.height / 2, 46);
  weatherPaint(paint, PLASTER_SEED + 11);
  layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
  layer.ctx.drawImage(paint.canvas, 0, 0);
  return { map: canvasTexture(layer.canvas, context, true) };
}

function cartouchePath(ctx: CanvasRenderingContext2D, centreX: number, centreY: number, halfLength: number, halfHeight: number): void {
  const lobe = halfHeight * 0.9;
  ctx.beginPath();
  ctx.moveTo(centreX - halfLength, centreY);
  ctx.quadraticCurveTo(centreX - halfLength + lobe * 0.2, centreY - halfHeight * 0.5, centreX - halfLength + lobe, centreY - halfHeight * 0.55);
  ctx.quadraticCurveTo(centreX - halfLength + lobe * 1.1, centreY - halfHeight, centreX - halfLength + lobe * 1.9, centreY - halfHeight);
  ctx.lineTo(centreX + halfLength - lobe * 1.9, centreY - halfHeight);
  ctx.quadraticCurveTo(centreX + halfLength - lobe * 1.1, centreY - halfHeight, centreX + halfLength - lobe, centreY - halfHeight * 0.55);
  ctx.quadraticCurveTo(centreX + halfLength - lobe * 0.2, centreY - halfHeight * 0.5, centreX + halfLength, centreY);
  ctx.quadraticCurveTo(centreX + halfLength - lobe * 0.2, centreY + halfHeight * 0.5, centreX + halfLength - lobe, centreY + halfHeight * 0.55);
  ctx.quadraticCurveTo(centreX + halfLength - lobe * 1.1, centreY + halfHeight, centreX + halfLength - lobe * 1.9, centreY + halfHeight);
  ctx.lineTo(centreX - halfLength + lobe * 1.9, centreY + halfHeight);
  ctx.quadraticCurveTo(centreX - halfLength + lobe * 1.1, centreY + halfHeight, centreX - halfLength + lobe, centreY + halfHeight * 0.55);
  ctx.quadraticCurveTo(centreX - halfLength + lobe * 0.2, centreY + halfHeight * 0.5, centreX - halfLength, centreY);
  ctx.closePath();
}

/** A spiral stem with small leaves, the filling of a cartouche. */
function goldSpiral(ctx: CanvasRenderingContext2D, centreX: number, centreY: number, radius: number, direction: number): void {
  ctx.beginPath();
  for (let step = 0; step <= 40; step += 1) {
    const angle = direction * (step / 40) * Math.PI * 2.6;
    const reach = radius * (1 - step / 46);
    const x = centreX + Math.cos(angle) * reach;
    const y = centreY + Math.sin(angle) * reach;
    if (step === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  for (let leafIndex = 0; leafIndex < 5; leafIndex += 1) {
    const angle = direction * (leafIndex / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(centreX + Math.cos(angle) * radius * 0.78, centreY + Math.sin(angle) * radius * 0.78, radius * 0.2, radius * 0.09, angle + 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function friezeMedallion(ctx: CanvasRenderingContext2D, centreX: number, centreY: number, radius: number): void {
  ctx.fillStyle = PALETTE.paintRed;
  ctx.strokeStyle = PALETTE.paintOchre;
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let index = 0; index <= 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2;
    const reach = radius * (index % 2 === 0 ? 1 : 0.84);
    ctx.lineTo(centreX + Math.cos(angle) * reach, centreY + Math.sin(angle) * reach);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.paintOchre;
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(centreX + Math.cos(angle) * radius * 0.42, centreY + Math.sin(angle) * radius * 0.42, radius * 0.24, radius * 0.1, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(centreX, centreY, radius * 0.14, 0, Math.PI * 2);
  ctx.fill();
}

/** Builds the frieze under the ceiling: blue cartouches with gold scrolls between red medallions. */
export function buildFrieze(context: TextureContext): TextureSet {
  const layer = plasterGround(context, PLASTER_SEED + 20);
  const paint = createCanvas(layer.canvas.width, layer.canvas.height);
  const { ctx } = paint;
  ctx.scale(paint.canvas.width / BAND_PIXELS.width, paint.canvas.height / BAND_PIXELS.height);
  const { width, height } = BAND_PIXELS;
  ctx.fillStyle = PALETTE.paintOchre;
  ctx.fillRect(0, 10, width, 12);
  ctx.fillRect(0, height - 22, width, 12);
  ctx.fillStyle = PALETTE.paintRed;
  ctx.fillRect(0, 22, width, 5);
  ctx.fillRect(0, height - 27, width, 5);
  cartouchePath(ctx, width * 0.36, height / 2, width * 0.3, height * 0.33);
  ctx.fillStyle = PALETTE.paintBlue;
  ctx.fill();
  ctx.strokeStyle = PALETTE.paintOchre;
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.strokeStyle = PALETTE.paintOchre;
  ctx.fillStyle = PALETTE.paintOchre;
  ctx.lineWidth = 4.5;
  [0.16, 0.29, 0.43, 0.56].forEach((position, index) => goldSpiral(ctx, width * position, height / 2, height * 0.2, index % 2 === 0 ? 1 : -1));
  for (const centre of [width * 0.86, width * -0.14]) friezeMedallion(ctx, centre, height / 2, height * 0.3);
  weatherPaint(paint, PLASTER_SEED + 21);
  layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
  layer.ctx.drawImage(paint.canvas, 0, 0);
  return { map: canvasTexture(layer.canvas, context, true) };
}

const HOOD_PIXELS = 512;

/** Metres of hood surface that one repeat of its painted pattern covers. */
export const HOOD_PAINT_METRES = 0.56;

function hoodSprig(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.fillStyle = PALETTE.paintBlue;
  for (let petal = 0; petal < 6; petal += 1) {
    const angle = (petal * Math.PI) / 3;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(angle) * size * 0.55, y + Math.sin(angle) * size * 0.55, size * 0.36, size * 0.17, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.paintOchre;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.paintRed;
  for (const [dx, dy] of [[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]] as const) {
    ctx.beginPath();
    ctx.arc(x + dx * size, y + dy * size, size * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Builds the paint of the hearth hood: small blue flowers with red dots, scattered in staggered rows on white. */
export function buildHoodPaint(context: TextureContext): TextureSet {
  const size = scaled(HOOD_PIXELS, context);
  const layer = createCanvas(size, size);
  layer.ctx.fillStyle = '#f3ecdd';
  layer.ctx.fillRect(0, 0, size, size);
  overlayCanvas(layer, noiseCanvas(256, 6, PLASTER_SEED + 30).canvas, 'multiply', 0.08);
  const paint = createCanvas(size, size);
  paint.ctx.scale(size / HOOD_PIXELS, size / HOOD_PIXELS);
  const step = HOOD_PIXELS / 2;
  for (let row = -1; row <= 4; row += 1) {
    for (let column = -1; column <= 2; column += 1) {
      const shift = row % 2 === 0 ? 0 : step / 2;
      hoodSprig(paint.ctx, column * step + shift + step / 4, (row * step) / 2 + step / 4, step * 0.11);
    }
  }
  weatherPaint(paint, PLASTER_SEED + 31);
  layer.ctx.drawImage(paint.canvas, 0, 0);
  return { map: canvasTexture(layer.canvas, context, true) };
}
