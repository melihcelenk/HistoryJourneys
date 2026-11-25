/**
 * Helpers for textures that are painted in code: canvases, height fields, and the normal maps made from them.
 */
import * as THREE from 'three';
import { fractalNoise } from './random';

export interface Canvas2D {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

/** What every texture builder needs to know about the machine and the chosen quality. */
export interface TextureContext {
  anisotropy: number;
  /** 1 for full size textures, 0.5 for the low quality setting. */
  scale: number;
}

/** A height field: one value per pixel, usually between 0 and 1. */
export interface HeightField {
  width: number;
  height: number;
  data: Float32Array;
}

/** The maps of one physically based material. */
export interface TextureSet {
  map: THREE.CanvasTexture;
  normalMap?: THREE.CanvasTexture;
  /** Roughness in the green channel and metalness in the blue channel. */
  surfaceMap?: THREE.CanvasTexture;
}

export function createCanvas(width: number, height: number): Canvas2D {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.round(width));
  canvas.height = Math.max(2, Math.round(height));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('This browser cannot create a 2D canvas.');
  return { canvas, ctx };
}

/** Wraps a canvas into a repeating texture. `colour` marks colour data (sRGB) as opposed to plain numbers. */
export function canvasTexture(canvas: HTMLCanvasElement, context: TextureContext, colour: boolean): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = context.anisotropy;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

/** Reads the red channel of a canvas as a height field in [0, 1]. */
export function heightFromCanvas(source: Canvas2D): HeightField {
  const { width, height } = source.canvas;
  const pixels = source.ctx.getImageData(0, 0, width, height).data;
  const data = new Float32Array(width * height);
  for (let index = 0; index < data.length; index += 1) data[index] = (pixels[index * 4] ?? 0) / 255;
  return { width, height, data };
}

function blurLine(source: Float32Array, target: Float32Array, start: number, stride: number, count: number, radius: number): void {
  const window = radius * 2 + 1;
  let sum = 0;
  for (let offset = -radius; offset <= radius; offset += 1) sum += source[start + ((offset + count) % count) * stride] ?? 0;
  for (let index = 0; index < count; index += 1) {
    target[start + index * stride] = sum / window;
    const leaving = (index - radius + count) % count;
    const entering = (index + radius + 1) % count;
    sum += (source[start + entering * stride] ?? 0) - (source[start + leaving * stride] ?? 0);
  }
}

/** Blurs a height field with a wrapping box filter; two passes come close to a Gaussian blur. */
export function blurHeight(field: HeightField, radius: number, passes = 2): HeightField {
  const size = Math.max(1, Math.round(radius));
  let current = field.data;
  for (let pass = 0; pass < passes; pass += 1) {
    const horizontal = new Float32Array(current.length);
    for (let y = 0; y < field.height; y += 1) blurLine(current, horizontal, y * field.width, 1, field.width, size);
    const vertical = new Float32Array(current.length);
    for (let x = 0; x < field.width; x += 1) blurLine(horizontal, vertical, x, field.width, field.height, size);
    current = vertical;
  }
  return { width: field.width, height: field.height, data: current };
}

/** Adds tileable fractal noise to a height field in place. `cells` is how many noise cells span the texture. */
export function addNoise(field: HeightField, amount: number, cells: number, seed: number, octaves = 4): void {
  for (let y = 0; y < field.height; y += 1) {
    for (let x = 0; x < field.width; x += 1) {
      const noise = fractalNoise((x / field.width) * cells, (y / field.height) * cells, { seed, octaves, period: cells });
      const index = y * field.width + x;
      field.data[index] = (field.data[index] ?? 0) + (noise - 0.5) * amount;
    }
  }
}

/**
 * Builds a tangent-space normal map from a height field. `strength` is how many pixels of slope a height
 * difference of 1 stands for; the field is taken to wrap around at its edges.
 */
export function normalMapFromHeight(field: HeightField, strength: number): HTMLCanvasElement {
  const { width, height, data } = field;
  const { canvas, ctx } = createCanvas(width, height);
  const image = ctx.createImageData(width, height);
  const pixels = image.data;
  for (let y = 0; y < height; y += 1) {
    const up = ((y + height - 1) % height) * width;
    const down = ((y + 1) % height) * width;
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      const left = (x + width - 1) % width;
      const right = (x + 1) % width;
      const slopeX = ((data[row + left] ?? 0) - (data[row + right] ?? 0)) * strength;
      // Canvas rows run downwards while the v axis of the texture runs upwards.
      const slopeY = ((data[down + x] ?? 0) - (data[up + x] ?? 0)) * strength;
      const scale = 127.5 / Math.sqrt(slopeX * slopeX + slopeY * slopeY + 1);
      const offset = (row + x) * 4;
      pixels[offset] = 127.5 + slopeX * scale;
      pixels[offset + 1] = 127.5 + slopeY * scale;
      pixels[offset + 2] = 127.5 + scale;
      pixels[offset + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** A square greyscale canvas of tileable fractal noise, for laying stains and wear over painted textures. */
export function noiseCanvas(size: number, cells: number, seed: number, octaves = 4): Canvas2D {
  const target = createCanvas(size, size);
  const image = target.ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const value = fractalNoise((x / size) * cells, (y / size) * cells, { seed, octaves, period: cells }) * 255;
      const offset = (y * size + x) * 4;
      image.data[offset] = value;
      image.data[offset + 1] = value;
      image.data[offset + 2] = value;
      image.data[offset + 3] = 255;
    }
  }
  target.ctx.putImageData(image, 0, 0);
  return target;
}

/**
 * A square canvas whose opacity follows tileable noise: fully clear below `threshold`, fully opaque `softness`
 * above it. Used to rub paint and gilding away in patches.
 */
export function noiseMaskCanvas(size: number, cells: number, seed: number, threshold: number, softness: number): Canvas2D {
  const target = createCanvas(size, size);
  const image = target.ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const noise = fractalNoise((x / size) * cells, (y / size) * cells, { seed, octaves: 4, period: cells });
      const alpha = Math.max(0, Math.min(1, (noise - threshold) / softness));
      const offset = (y * size + x) * 4;
      image.data[offset + 3] = alpha * 255;
    }
  }
  target.ctx.putImageData(image, 0, 0);
  return target;
}

export type BlendMode = 'multiply' | 'overlay' | 'soft-light' | 'screen' | 'source-over' | 'lighter' | 'destination-out' | 'source-in';

/** Lays a (smaller, tileable) canvas over the whole target with the given blend mode and opacity. */
export function overlayCanvas(target: Canvas2D, source: HTMLCanvasElement, mode: BlendMode, alpha: number, repeats = 1): void {
  const { ctx, canvas } = target;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = mode;
  const stepX = canvas.width / repeats;
  const stepY = canvas.height / repeats;
  for (let row = 0; row < repeats; row += 1) {
    for (let column = 0; column < repeats; column += 1) ctx.drawImage(source, column * stepX, row * stepY, stepX, stepY);
  }
  ctx.restore();
}

/** Traces a closed polygon on the canvas path. */
export function tracePolygon(ctx: CanvasRenderingContext2D, points: readonly (readonly [number, number])[]): void {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

/** Texture size after applying the quality scale. */
export function scaled(size: number, context: TextureContext): number {
  return Math.round(size * context.scale);
}
