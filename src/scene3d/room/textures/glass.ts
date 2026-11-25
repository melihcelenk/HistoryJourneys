/**
 * The upper windows: a plaster grille pierced by round openings, and the coloured glass that sits behind it.
 * Both are painted from the same layout of holes, so that the glass shows exactly through the grille.
 */
import { PALETTE, shade } from '../palette';
import { traceryHoles, type ArchShape, type Point2 } from '../patterns';
import { hash2 } from '../random';
import { canvasTexture, createCanvas, noiseCanvas, overlayCanvas, type Canvas2D, type TextureContext } from '../textureTools';
import type * as THREE from 'three';

const PIXELS_PER_METRE = 560;
const HOLE_SPACING = 0.094;
const HOLE_RADIUS = 0.033;
const HOLE_MARGIN = 0.03;
const GLASS_SEED = 1453;
const GLASS_COLOURS = ['#e2b23a', '#c9302a', '#2a4fc0', '#e9e3cf', '#2f8f52', '#c9302a', '#2a4fc0'] as const;

/**
 * The colour of the glass in a hole. The colours run in rings around the middle of the window, the way a glazier
 * lays them out, with an occasional odd pane.
 */
export function glassColour(hole: Point2, shape: ArchShape): string {
  const ring = Math.round(Math.hypot(hole[0] - shape.width / 2, hole[1] - shape.straight * 0.85) / HOLE_SPACING);
  const odd = hash2(Math.round(hole[0] * 100), Math.round(hole[1] * 100), GLASS_SEED) < 0.08 ? 1 : 0;
  return GLASS_COLOURS[(ring + odd) % GLASS_COLOURS.length] ?? GLASS_COLOURS[0];
}

function layoutCanvas(shape: ArchShape, context: TextureContext): { layer: Canvas2D; holes: Point2[]; scale: number } {
  const scale = PIXELS_PER_METRE * context.scale;
  const layer = createCanvas(shape.width * scale, (shape.straight + shape.rise) * scale);
  const holes = traceryHoles(shape, HOLE_SPACING, HOLE_RADIUS, HOLE_MARGIN);
  return { layer, holes, scale };
}

function circle(layer: Canvas2D, hole: Point2, radius: number, scale: number): void {
  // The canvas runs downwards while the window is measured upwards from its sill.
  layer.ctx.beginPath();
  layer.ctx.arc(hole[0] * scale, layer.canvas.height - hole[1] * scale, radius * scale, 0, Math.PI * 2);
}

/** Builds the plaster grille; its alpha channel is clear where the round openings are. */
export function buildTracery(shape: ArchShape, context: TextureContext): THREE.CanvasTexture {
  const { layer, holes, scale } = layoutCanvas(shape, context);
  layer.ctx.fillStyle = PALETTE.plaster;
  layer.ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
  overlayCanvas(layer, noiseCanvas(128, 8, GLASS_SEED + 1).canvas, 'multiply', 0.2);
  for (const hole of holes) {
    circle(layer, hole, HOLE_RADIUS * 1.22, scale);
    layer.ctx.strokeStyle = shade(PALETTE.plasterShade, -0.25);
    layer.ctx.lineWidth = scale * 0.008;
    layer.ctx.stroke();
  }
  layer.ctx.globalCompositeOperation = 'destination-out';
  for (const hole of holes) {
    circle(layer, hole, HOLE_RADIUS, scale);
    layer.ctx.fill();
  }
  const texture = canvasTexture(layer.canvas, context, true);
  texture.premultiplyAlpha = false;
  return texture;
}

/** Builds the coloured glass: one glowing roundel behind every opening of the grille. */
export function buildGlass(shape: ArchShape, context: TextureContext): THREE.CanvasTexture {
  const { layer, holes, scale } = layoutCanvas(shape, context);
  layer.ctx.fillStyle = '#0d0b0a';
  layer.ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
  holes.forEach((hole) => {
    const x = hole[0] * scale;
    const y = layer.canvas.height - hole[1] * scale;
    const colour = glassColour(hole, shape);
    const gradient = layer.ctx.createRadialGradient(x, y, 0, x, y, HOLE_RADIUS * scale * 1.3);
    gradient.addColorStop(0, shade(colour, 0.12));
    gradient.addColorStop(0.8, colour);
    gradient.addColorStop(1, shade(colour, -0.25));
    circle(layer, hole, HOLE_RADIUS * 1.3, scale);
    layer.ctx.fillStyle = gradient;
    layer.ctx.fill();
  });
  return canvasTexture(layer.canvas, context, true);
}
