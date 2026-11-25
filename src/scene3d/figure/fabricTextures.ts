import * as THREE from 'three';

/**
 * Patterns of the cloths, painted in code. The silk of the inner kaftan carries the çintamani motif (three discs
 * over two wavy bands), which is woven into kaftans kept in the Topkapı Palace and attributed to Mehmed II.
 */

const TILE = 512;

function createCanvas(size: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A 2D canvas is needed to paint the patterns of the cloths.');
  return { canvas, context };
}

function toTexture(canvas: HTMLCanvasElement, colour: boolean): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** One çintamani motif around (x, y): three discs, each with a darker crescent, over two wavy bands. */
function drawCintamani(context: CanvasRenderingContext2D, x: number, y: number, unit: number, motif: string, hollow: string): void {
  const discs: readonly (readonly [number, number])[] = [
    [0, -0.62],
    [-0.5, 0.12],
    [0.5, 0.12],
  ];
  for (const [dx, dy] of discs) {
    context.fillStyle = motif;
    context.beginPath();
    context.arc(x + dx * unit, y + dy * unit, unit * 0.36, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = hollow;
    context.beginPath();
    context.arc(x + (dx + 0.07) * unit, y + (dy - 0.06) * unit, unit * 0.2, 0, Math.PI * 2);
    context.fill();
  }
  context.strokeStyle = motif;
  context.lineCap = 'round';
  context.lineWidth = unit * 0.2;
  for (const offset of [0.95, 1.4]) {
    context.beginPath();
    context.moveTo(x - unit * 1.05, y + unit * offset);
    context.bezierCurveTo(x - unit * 0.45, y + unit * (offset - 0.42), x + unit * 0.2, y + unit * (offset + 0.42), x + unit * 1.05, y + unit * (offset - 0.05));
    context.stroke();
  }
}

export interface SilkTextures {
  colour: THREE.Texture;
  /** White where the gold thread lies, black on the silk. */
  gold: THREE.Texture;
}

/** Silk with gold çintamani motifs in staggered rows; the texture repeats without a seam. */
export function createCintamaniSilk(ground: string, motif: string, hollow: string): SilkTextures {
  const colour = createCanvas(TILE);
  const gold = createCanvas(TILE);
  colour.context.fillStyle = ground;
  colour.context.fillRect(0, 0, TILE, TILE);
  gold.context.fillStyle = '#000';
  gold.context.fillRect(0, 0, TILE, TILE);
  const unit = TILE * 0.105;
  // Two motifs per tile, the second half a tile along and down; drawn again around the edges so that it tiles.
  for (const [cx, cy] of [
    [0.25, 0.2],
    [0.75, 0.7],
  ] as const) {
    for (const wrapX of [-1, 0, 1]) {
      for (const wrapY of [-1, 0, 1]) {
        const x = (cx + wrapX) * TILE;
        const y = (cy + wrapY) * TILE;
        drawCintamani(colour.context, x, y, unit, motif, hollow);
        drawCintamani(gold.context, x, y, unit, '#fff', '#000');
      }
    }
  }
  return { colour: toTexture(colour.canvas, true), gold: toTexture(gold.canvas, false) };
}

/** A repeatable random number in [0, 1). */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Fur seen from close: many short hairs of slightly different browns, lying mostly one way. */
export function createFurTexture(seed: number): THREE.Texture {
  const { canvas, context } = createCanvas(TILE);
  const next = random(seed);
  context.fillStyle = '#5e4429';
  context.fillRect(0, 0, TILE, TILE);
  const HAIRS = 9000;
  for (let i = 0; i < HAIRS; i += 1) {
    const x = next() * TILE;
    const y = next() * TILE;
    const length = 10 + next() * 22;
    const lean = (next() - 0.5) * 9;
    const light = 28 + next() * 30;
    context.strokeStyle = `hsl(${24 + next() * 10}, ${38 + next() * 20}%, ${light}%)`;
    context.lineWidth = 0.8 + next() * 1.4;
    // Drawn three times so that hairs crossing an edge continue on the other side.
    for (const wrap of [-TILE, 0, TILE]) {
      context.beginPath();
      context.moveTo(x + wrap, y);
      context.lineTo(x + wrap + lean, y + length);
      context.moveTo(x, y + wrap);
      context.lineTo(x + lean, y + wrap + length);
      context.stroke();
    }
  }
  return toTexture(canvas, true);
}
