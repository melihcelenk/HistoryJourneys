/** Small painted textures of the loose objects: the pages of the open book and blue-and-white ceramics. */
import { PALETTE } from '../palette';
import { createRandom, fractalNoise } from '../random';
import { canvasTexture, createCanvas, noiseCanvas, overlayCanvas, scaled, type TextureContext, type TextureSet } from '../textureTools';

const PAGE_PIXELS = { width: 512, height: 384 } as const;
const PAGE_SEED = 857;
const TEXT_LINES = 11;

/** Rows of short pen strokes that read as handwriting from a distance without spelling anything. */
function scriptLines(ctx: CanvasRenderingContext2D, left: number, top: number, width: number, height: number, random: () => number): void {
  ctx.strokeStyle = PALETTE.paintBlack;
  ctx.lineCap = 'round';
  for (let line = 0; line < TEXT_LINES; line += 1) {
    const y = top + ((line + 0.6) * height) / TEXT_LINES;
    let x = left + width;
    while (x > left + 6) {
      const stroke = 5 + random() * 16;
      ctx.lineWidth = 1.4 + random() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y + (random() - 0.5) * 3);
      ctx.quadraticCurveTo(x - stroke / 2, y - 6 * random() + 2, Math.max(left, x - stroke), y + (random() - 0.5) * 4);
      ctx.stroke();
      x -= stroke + 3 + random() * 6;
    }
  }
}

function pageFrame(ctx: CanvasRenderingContext2D, left: number, top: number, width: number, height: number): void {
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 4;
  ctx.strokeRect(left, top, width, height);
  ctx.strokeStyle = PALETTE.paintBlue;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(left - 5, top - 5, width + 10, height + 10);
}

/** Builds the two facing pages of an open manuscript, with ruled frames and an illuminated heading. */
export function buildBookPages(context: TextureContext): TextureSet {
  const layer = createCanvas(scaled(PAGE_PIXELS.width, context), scaled(PAGE_PIXELS.height, context));
  const { ctx } = layer;
  ctx.fillStyle = '#eadfc2';
  ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
  overlayCanvas(layer, noiseCanvas(128, 5, PAGE_SEED).canvas, 'multiply', 0.15);
  ctx.scale(layer.canvas.width / PAGE_PIXELS.width, layer.canvas.height / PAGE_PIXELS.height);
  const random = createRandom(PAGE_SEED);
  const half = PAGE_PIXELS.width / 2;
  for (const page of [0, 1]) {
    const left = page * half + 30;
    const width = half - 60;
    pageFrame(ctx, left, 34, width, PAGE_PIXELS.height - 68);
    if (page === 1) {
      ctx.fillStyle = PALETTE.paintBlue;
      ctx.fillRect(left + 4, 38, width - 8, 52);
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.ellipse(left + width / 2, 64, width * 0.34, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      scriptLines(ctx, left + 10, 100, width - 20, PAGE_PIXELS.height - 140, random);
    } else {
      scriptLines(ctx, left + 10, 42, width - 20, PAGE_PIXELS.height - 84, random);
    }
  }
  // The gutter between the pages.
  const gutter = ctx.createLinearGradient(half - 26, 0, half + 26, 0);
  gutter.addColorStop(0, 'rgba(60, 40, 20, 0)');
  gutter.addColorStop(0.5, 'rgba(60, 40, 20, 0.55)');
  gutter.addColorStop(1, 'rgba(60, 40, 20, 0)');
  ctx.fillStyle = gutter;
  ctx.fillRect(half - 26, 0, 52, PAGE_PIXELS.height);
  return { map: canvasTexture(layer.canvas, context, true) };
}

const CERAMIC_PIXELS = 256;

/** Builds blue-and-white glazed ware: bands of blue scrolls on a white body. The texture wraps around the pot. */
export function buildBlueAndWhite(context: TextureContext): TextureSet {
  const size = scaled(CERAMIC_PIXELS, context);
  const layer = createCanvas(size, size);
  const { ctx } = layer;
  ctx.scale(size / CERAMIC_PIXELS, size / CERAMIC_PIXELS);
  ctx.fillStyle = '#eef0ec';
  ctx.fillRect(0, 0, CERAMIC_PIXELS, CERAMIC_PIXELS);
  ctx.fillStyle = '#1d3a8a';
  for (const y of [18, 58, 196, 236]) ctx.fillRect(0, y, CERAMIC_PIXELS, 5);
  ctx.strokeStyle = '#1d3a8a';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const step = CERAMIC_PIXELS / 4;
  for (let index = 0; index < 4; index += 1) {
    const x = index * step;
    ctx.beginPath();
    ctx.moveTo(x, 128);
    ctx.bezierCurveTo(x + step * 0.3, 60, x + step * 0.7, 196, x + step, 128);
    ctx.stroke();
    for (const [dx, dy] of [[0.28, 96], [0.72, 160]] as const) {
      ctx.beginPath();
      ctx.ellipse(x + step * dx, dy, 14, 8, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x + step * 0.5, 38, 6, 0, Math.PI * 2);
    ctx.arc(x + step * 0.5, 216, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  return { map: canvasTexture(layer.canvas, context, true) };
}

const EMBER_PIXELS = 256;
const EMBER_SEED = 1299;

/** Colour of a glowing coal for a heat between 0 (black) and 1 (white hot). */
function emberColour(heat: number): [number, number, number] {
  const red = Math.min(1, heat * 2.2);
  const green = Math.max(0, Math.min(1, (heat - 0.35) * 1.9));
  const blue = Math.max(0, (heat - 0.8) * 2.5);
  return [red * 255, green * 255, blue * 255];
}

/**
 * Builds the two maps of a bed of embers: the dark, ashy colour of the coals and the glow that shows in the
 * cracks between them.
 */
export function buildEmbers(context: TextureContext): { map: TextureSet['map']; glow: TextureSet['map'] } {
  const size = scaled(EMBER_PIXELS, context);
  const colour = createCanvas(size, size);
  const glow = createCanvas(size, size);
  const colourImage = colour.ctx.createImageData(size, size);
  const glowImage = glow.ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x / size) * 9;
      const v = (y / size) * 9;
      const lumps = fractalNoise(u, v, { seed: EMBER_SEED, octaves: 3, period: 9 });
      const cracks = Math.pow(1 - Math.min(1, Math.abs(lumps - 0.5) * 13), 2);
      const patches = fractalNoise(u * 0.4, v * 0.4, { seed: EMBER_SEED + 3, octaves: 2, period: 4 });
      const heat = Math.min(1, cracks * (0.2 + patches * 1.2) + Math.max(0, patches - 0.62) * 1.1);
      const offset = (y * size + x) * 4;
      const ash = 30 + lumps * 95;
      colourImage.data.set([ash, ash * 0.92, ash * 0.86, 255], offset);
      glowImage.data.set([...emberColour(heat), 255], offset);
    }
  }
  colour.ctx.putImageData(colourImage, 0, 0);
  glow.ctx.putImageData(glowImage, 0, 0);
  return { map: canvasTexture(colour.canvas, context, true), glow: canvasTexture(glow.canvas, context, true) };
}

const PATINA_PIXELS = 256;
const PATINA_SEED = 733;

/**
 * Builds the maps of worked metal: a colour map that tarnishes the metal in soft patches and a surface map with
 * polished and dull areas. Both are neutral, so the colour of the material decides which metal it is.
 */
export function buildPatina(context: TextureContext): TextureSet {
  const size = scaled(PATINA_PIXELS, context);
  const colour = createCanvas(size, size);
  const surface = createCanvas(size, size);
  const colourImage = colour.ctx.createImageData(size, size);
  const surfaceImage = surface.ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x / size) * 6;
      const v = (y / size) * 6;
      const tarnish = fractalNoise(u, v, { seed: PATINA_SEED, octaves: 4, period: 6 });
      const scratches = fractalNoise(u * 9, v * 1.5, { seed: PATINA_SEED + 4, octaves: 2, period: 54 });
      const tone = 150 + tarnish * 105;
      const offset = (y * size + x) * 4;
      colourImage.data.set([tone, tone * (0.92 + tarnish * 0.08), tone * (0.8 + tarnish * 0.2), 255], offset);
      surfaceImage.data.set([0, 60 + (1 - tarnish) * 90 + scratches * 40, 255, 255], offset);
    }
  }
  colour.ctx.putImageData(colourImage, 0, 0);
  surface.ctx.putImageData(surfaceImage, 0, 0);
  return { map: canvasTexture(colour.canvas, context, true), surfaceMap: canvasTexture(surface.canvas, context, false) };
}
