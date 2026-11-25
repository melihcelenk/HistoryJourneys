import * as THREE from 'three';

export interface ClothOptions {
  /** Makes the wrinkles of two cloths differ. */
  seed: number;
  /** Threads across the texture. */
  weave: number;
  /** Strength of the soft wrinkles, 0 to 1. */
  wrinkles: number;
}

export interface ClothTextures {
  /** Small relief of the threads and of soft wrinkles. */
  normal: THREE.Texture;
}

const SIZE = 512;

/** A repeatable random number in [0, 1) for a cell of a grid. */
function hash(x: number, y: number, seed: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

/** Smooth noise that repeats after `period` cells, so that the texture tiles without a seam. */
function tileNoise(x: number, y: number, period: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const at = (ix: number, iy: number): number => hash(((ix % period) + period) % period, ((iy % period) + period) % period, seed);
  const top = at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx;
  const bottom = at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx;
  return top * (1 - sy) + bottom * sy;
}

/** Height of the cloth at each texel: woven threads over soft wrinkles. */
function clothHeight(options: ClothOptions): Float32Array {
  const height = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const u = x / SIZE;
      const v = y / SIZE;
      const warp = Math.sin(u * options.weave * Math.PI * 2);
      const weft = Math.sin(v * options.weave * Math.PI * 2);
      const threads = 0.5 + 0.25 * warp * weft + 0.12 * (warp + weft);
      const wrinkle = tileNoise(u * 6, v * 6, 6, options.seed) * 0.6 + tileNoise(u * 14, v * 14, 14, options.seed + 1) * 0.4;
      height[y * SIZE + x] = threads * 0.35 + wrinkle * options.wrinkles * 3;
    }
  }
  return height;
}

/** Turns a height field into a tangent-space normal map. */
export function heightToNormalMap(height: Float32Array, size: number, strength: number): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const at = (x: number, y: number): number => height[((y + size) % size) * size + ((x + size) % size)] ?? 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const length = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      data[i] = Math.round(((-dx / length) * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round(((-dy / length) * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round((1 / length) * 0.5 * 255 + 127.5);
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/** Generates the relief of a woven cloth; the texture repeats without a seam. */
export function createClothTextures(options: ClothOptions): ClothTextures {
  return { normal: heightToNormalMap(clothHeight(options), SIZE, 6) };
}
