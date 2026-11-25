/** The painted medallions (semse) of the upper walls: a lobed roundel with pendants above and below. */
import type * as THREE from 'three';
import { PALETTE } from '../palette';
import { starPolygon } from '../patterns';
import { canvasTexture, createCanvas, noiseMaskCanvas, overlayCanvas, scaled, tracePolygon, type TextureContext } from '../textureTools';

const PIXELS = { width: 384, height: 640 } as const;
const SEED = 1463;
const LOBES = 16;

/** Height of the medallion image divided by its width. */
export const MEDALLION_ASPECT = PIXELS.height / PIXELS.width;

function lobedPath(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, lobes: number): void {
  ctx.beginPath();
  for (let lobe = 0; lobe < lobes; lobe += 1) {
    const angle = (lobe / lobes) * Math.PI * 2;
    const next = ((lobe + 1) / lobes) * Math.PI * 2;
    const middle = (angle + next) / 2;
    if (lobe === 0) ctx.moveTo(x + Math.cos(angle) * radius * 0.9, y + Math.sin(angle) * radius * 0.9);
    ctx.quadraticCurveTo(x + Math.cos(middle) * radius * 1.12, y + Math.sin(middle) * radius * 1.12, x + Math.cos(next) * radius * 0.9, y + Math.sin(next) * radius * 0.9);
  }
  ctx.closePath();
}

function pendant(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, direction: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + size * 0.75, y + direction * size * 0.3, x + size * 0.6, y + direction * size * 1.1, x, y + direction * size * 1.7);
  ctx.bezierCurveTo(x - size * 0.6, y + direction * size * 1.1, x - size * 0.75, y + direction * size * 0.3, x, y);
  ctx.closePath();
  ctx.fillStyle = PALETTE.paintRed;
  ctx.fill();
  ctx.strokeStyle = PALETTE.paintOchre;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = PALETTE.paintOchre;
  ctx.beginPath();
  ctx.ellipse(x, y + direction * size * 0.85, size * 0.16, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function scrollwork(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  ctx.strokeStyle = PALETTE.paintOchre;
  ctx.fillStyle = PALETTE.paintOchre;
  ctx.lineWidth = 3.5;
  for (let arm = 0; arm < 8; arm += 1) {
    const angle = (arm * Math.PI) / 4;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(radius * 0.3, 0);
    ctx.bezierCurveTo(radius * 0.5, -radius * 0.26, radius * 0.82, -radius * 0.2, radius * 0.8, radius * 0.04);
    ctx.bezierCurveTo(radius * 0.78, radius * 0.2, radius * 0.6, radius * 0.18, radius * 0.6, radius * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(radius * 0.52, -radius * 0.17, radius * 0.12, radius * 0.05, -0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** Builds the medallion on a clear ground, so that it can be laid over the plaster as a decal. */
export function buildMedallion(context: TextureContext): THREE.CanvasTexture {
  const layer = createCanvas(scaled(PIXELS.width, context), scaled(PIXELS.height, context));
  const { ctx } = layer;
  ctx.scale(layer.canvas.width / PIXELS.width, layer.canvas.height / PIXELS.height);
  const x = PIXELS.width / 2;
  const y = PIXELS.height / 2;
  const radius = PIXELS.width * 0.4;
  pendant(ctx, x, y - radius * 1.08, radius * 0.3, -1);
  pendant(ctx, x, y + radius * 1.08, radius * 0.3, 1);
  lobedPath(ctx, x, y, radius, LOBES);
  ctx.fillStyle = PALETTE.paintOchre;
  ctx.fill();
  lobedPath(ctx, x, y, radius * 0.92, LOBES);
  ctx.fillStyle = PALETTE.paintBlue;
  ctx.fill();
  scrollwork(ctx, x, y, radius * 0.9);
  tracePolygon(ctx, starPolygon([x, y], 8, radius * 0.3, radius * 0.17, Math.PI / 8));
  ctx.fillStyle = PALETTE.paintRed;
  ctx.fill();
  ctx.strokeStyle = PALETTE.paintOchre;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.paintOchre;
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  overlayCanvas(layer, noiseMaskCanvas(256, 9, SEED, 0.58, 0.1).canvas, 'destination-out', 0.5);
  const texture = canvasTexture(layer.canvas, context, true);
  texture.premultiplyAlpha = false;
  return texture;
}
