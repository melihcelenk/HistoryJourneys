/**
 * Procedural textures for the painted look of the map. They are generated on a
 * canvas so that no image assets need to be licensed or shipped (FR-33).
 */

export const TEXTURE_SIZE = 256;
const WAVE_MARGIN = 4;

/** Deterministic pseudo-random numbers, so that textures look the same on every run. */
export function createRandom(seed: number): () => number {
  // Linear congruential generator with the constants from Numerical Recipes.
  const MULTIPLIER = 1664525;
  const INCREMENT = 1013904223;
  const MODULUS = 2 ** 32;
  let state = seed;
  return () => {
    state = (state * MULTIPLIER + INCREMENT) % MODULUS;
    return state / MODULUS;
  };
}

function createCanvas(): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is not available');
  return { canvas, context };
}

interface Speckle {
  count: number;
  minRadius: number;
  maxRadius: number;
  colors: string[];
}

/** Offsets at which a shape is repeated so that it wraps around the edges and the texture tiles seamlessly. */
const WRAP_OFFSETS = [-TEXTURE_SIZE, 0, TEXTURE_SIZE];

function paintSpeckles(context: CanvasRenderingContext2D, random: () => number, speckle: Speckle): void {
  for (let i = 0; i < speckle.count; i += 1) {
    const radius = speckle.minRadius + random() * (speckle.maxRadius - speckle.minRadius);
    const x = random() * TEXTURE_SIZE;
    const y = random() * TEXTURE_SIZE;
    context.fillStyle = speckle.colors[Math.floor(random() * speckle.colors.length)] ?? '#000';
    for (const dx of WRAP_OFFSETS) {
      for (const dy of WRAP_OFFSETS) {
        context.beginPath();
        context.arc(x + dx, y + dy, radius, 0, Math.PI * 2);
        context.fill();
      }
    }
  }
}

/** Sun-bleached land: a warm base with soft patches of grass and dry earth. */
export function createLandTexture(): HTMLCanvasElement {
  const { canvas, context } = createCanvas();
  const random = createRandom(7);
  context.fillStyle = '#cdbb8a';
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  paintSpeckles(context, random, {
    count: 90,
    minRadius: 14,
    maxRadius: 46,
    colors: ['rgba(150,158,96,0.10)', 'rgba(196,170,112,0.12)', 'rgba(224,206,158,0.12)', 'rgba(128,120,78,0.07)'],
  });
  paintSpeckles(context, random, {
    count: 1400,
    minRadius: 0.4,
    maxRadius: 1.3,
    colors: ['rgba(90,72,40,0.10)', 'rgba(255,244,210,0.12)'],
  });
  return canvas;
}

/** Sea: a muted blue-grey with short wave strokes. */
export function createSeaTexture(): HTMLCanvasElement {
  const { canvas, context } = createCanvas();
  const random = createRandom(23);
  context.fillStyle = '#587a82';
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  paintSpeckles(context, random, {
    count: 60,
    minRadius: 18,
    maxRadius: 52,
    colors: ['rgba(40,70,82,0.10)', 'rgba(120,160,160,0.08)'],
  });
  context.lineCap = 'round';
  for (let i = 0; i < 70; i += 1) {
    const length = 6 + random() * 12;
    // Waves stay clear of the edges so that none is cut at a tile seam.
    const x = WAVE_MARGIN + random() * (TEXTURE_SIZE - length - 2 * WAVE_MARGIN);
    const y = WAVE_MARGIN + random() * (TEXTURE_SIZE - 2 * WAVE_MARGIN);
    context.strokeStyle = random() > 0.5 ? 'rgba(210,230,226,0.10)' : 'rgba(30,55,66,0.10)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(x + length / 2, y - 2, x + length, y);
    context.stroke();
  }
  return canvas;
}

/** Reads a canvas as the pixel data MapLibre expects for a pattern image. */
export function toImageData(canvas: HTMLCanvasElement): ImageData {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is not available');
  return context.getImageData(0, 0, canvas.width, canvas.height);
}
