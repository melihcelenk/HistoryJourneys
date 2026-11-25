/**
 * The glazed tiles of the dado: a field of turquoise hexagons with gilded stencil ornament and dark blue
 * triangles between them, and the polychrome border that closes the field at the top.
 */
import { PALETTE, shade } from '../palette';
import { hexTriangleCell, hexagonCorners, sideTriangles, type Point2 } from '../patterns';
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

/** Hexagons measure 20 cm from flat to flat; one texture holds 6 by 10 repeats of the pattern. */
const HEX_ACROSS = 0.2;
const CELLS_X = 6;
const CELLS_Y = 10;
const GROUT = 0.0022;
const FIELD_PIXELS = 2048;
const RELIEF_PIXELS = 1024;
const TILE_SEED = 1472;

const CELL = hexTriangleCell(HEX_ACROSS);

/** Size in metres of the wall area that one tile field texture covers. */
export const TILE_FIELD_METRES = { width: CELL.width * CELLS_X, height: CELL.height * CELLS_Y } as const;

interface TileLayers {
  colour: Canvas2D;
  gold: Canvas2D;
  relief: Canvas2D;
  surface: Canvas2D;
}

function inMetres(layer: Canvas2D): void {
  layer.ctx.setTransform(layer.canvas.width / TILE_FIELD_METRES.width, 0, 0, layer.canvas.height / TILE_FIELD_METRES.height, 0, 0);
}

function fillPolygon(layer: Canvas2D, points: readonly Point2[], style: string | CanvasGradient): void {
  tracePolygon(layer.ctx, points);
  layer.ctx.fillStyle = style;
  layer.ctx.fill();
}

function glazeGradient(layer: Canvas2D, centre: Point2, radius: number, base: string, variation: number): CanvasGradient {
  const gradient = layer.ctx.createRadialGradient(centre[0], centre[1], radius * 0.1, centre[0], centre[1], radius);
  gradient.addColorStop(0, shade(base, variation + 0.07));
  gradient.addColorStop(0.75, shade(base, variation));
  gradient.addColorStop(1, shade(base, variation - 0.22));
  return gradient;
}

function petal(ctx: CanvasRenderingContext2D, length: number, width: number): void {
  ctx.beginPath();
  ctx.moveTo(0, length * 0.18);
  ctx.bezierCurveTo(width, length * 0.4, width * 0.8, length * 0.85, 0, length);
  ctx.bezierCurveTo(-width * 0.8, length * 0.85, -width, length * 0.4, 0, length * 0.18);
  ctx.fill();
}

/** A six-petalled rosette with buds between the petals. */
function rosetteMotif(ctx: CanvasRenderingContext2D, radius: number): void {
  for (let index = 0; index < 6; index += 1) {
    ctx.save();
    ctx.rotate((index * Math.PI) / 3);
    petal(ctx, radius * 0.78, radius * 0.2);
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.arc(0, radius * 0.7, radius * 0.075, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.11, 0, Math.PI * 2);
  ctx.fill();
}

/** Two interlaced triangles with a ring in the middle. */
function starMotif(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.lineWidth = radius * 0.07;
  ctx.lineJoin = 'miter';
  for (const turn of [0, Math.PI]) {
    ctx.beginPath();
    for (let index = 0; index < 3; index += 1) {
      const angle = turn + Math.PI / 2 + (index * Math.PI * 2) / 3;
      const x = Math.cos(angle) * radius * 0.74;
      const y = Math.sin(angle) * radius * 0.74;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.07, 0, Math.PI * 2);
  ctx.fill();
}

/** Six split-leaf (rumi) scrolls turning around the centre. */
function scrollMotif(ctx: CanvasRenderingContext2D, radius: number): void {
  for (let index = 0; index < 6; index += 1) {
    ctx.save();
    ctx.rotate((index * Math.PI) / 3);
    ctx.beginPath();
    ctx.moveTo(0, radius * 0.16);
    ctx.bezierCurveTo(radius * 0.34, radius * 0.22, radius * 0.4, radius * 0.6, radius * 0.08, radius * 0.8);
    ctx.bezierCurveTo(radius * 0.22, radius * 0.58, radius * 0.16, radius * 0.38, 0, radius * 0.16);
    ctx.fill();
    ctx.restore();
  }
  ctx.lineWidth = radius * 0.05;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.12, 0, Math.PI * 2);
  ctx.stroke();
}

const MOTIFS = [rosetteMotif, scrollMotif, starMotif] as const;

/** Paints the gilded ornament of one hexagon: a fine line along its edge and a medallion in the middle. */
function gildHexagon(layer: Canvas2D, centre: Point2, variant: number): void {
  const { ctx } = layer;
  ctx.strokeStyle = PALETTE.gold;
  ctx.fillStyle = PALETTE.gold;
  ctx.lineWidth = CELL.side * 0.035;
  tracePolygon(ctx, hexagonCorners(centre, CELL.side, CELL.side * 0.13));
  ctx.stroke();
  ctx.save();
  ctx.translate(centre[0], centre[1]);
  const motif = MOTIFS[variant % MOTIFS.length] ?? rosetteMotif;
  motif(ctx, CELL.side * 0.66);
  ctx.restore();
}

function paintHexagon(layers: TileLayers, centre: Point2, tileId: number, variant: number): void {
  const variation = (hash2(tileId, 3, TILE_SEED) - 0.5) * 0.2;
  const corners = hexagonCorners(centre, CELL.side, GROUT);
  fillPolygon(layers.colour, corners, glazeGradient(layers.colour, centre, CELL.side, PALETTE.tileTurquoise, variation));
  const lift = 150 + Math.round(hash2(tileId, 5, TILE_SEED) * 70);
  fillPolygon(layers.relief, corners, `rgb(${lift}, ${lift}, ${lift})`);
  const roughness = 26 + Math.round(hash2(tileId, 7, TILE_SEED) * 34);
  fillPolygon(layers.surface, corners, `rgb(0, ${roughness}, 0)`);
  gildHexagon(layers.gold, centre, variant);
}

function paintTriangles(layers: TileLayers, centre: Point2, tileId: number): void {
  sideTriangles(centre, CELL.side, GROUT).forEach((corners, index) => {
    const variation = (hash2(tileId, 11 + index, TILE_SEED) - 0.5) * 0.22;
    fillPolygon(layers.colour, corners, shade(PALETTE.tileCobalt, variation));
    const lift = 150 + Math.round(hash2(tileId, 13 + index, TILE_SEED) * 70);
    fillPolygon(layers.relief, corners, `rgb(${lift}, ${lift}, ${lift})`);
    fillPolygon(layers.surface, corners, `rgb(0, ${30 + index * 12}, 0)`);
  });
}

function paintField(layers: TileLayers): void {
  for (let row = -1; row <= CELLS_Y; row += 1) {
    for (let column = -1; column <= CELLS_X; column += 1) {
      CELL.hexagonCentres.forEach((offset, index) => {
        const centre: Point2 = [column * CELL.width + offset[0], row * CELL.height + offset[1]];
        const wrappedColumn = (column + CELLS_X) % CELLS_X;
        const wrappedRow = (row + CELLS_Y) % CELLS_Y;
        const tileId = (wrappedRow * CELLS_X + wrappedColumn) * 2 + index;
        paintHexagon(layers, centre, tileId, index === 0 ? 0 : 1);
        paintTriangles(layers, centre, tileId);
      });
    }
  }
}

/** Rubs part of the gilding away and lays what is left onto the colour and the surface maps. */
function applyGilding(layers: TileLayers): void {
  const size = layers.gold.canvas.width;
  const wear = noiseMaskCanvas(512, 9, TILE_SEED + 1, 0.5, 0.12);
  layers.gold.ctx.setTransform(1, 0, 0, 1, 0, 0);
  overlayCanvas(layers.gold, wear.canvas, 'destination-out', 0.85);
  const tone = noiseCanvas(256, 12, TILE_SEED + 2);
  const toned = createCanvas(size, size);
  toned.ctx.drawImage(layers.gold.canvas, 0, 0);
  overlayCanvas(toned, tone.canvas, 'source-in', 1);
  layers.colour.ctx.setTransform(1, 0, 0, 1, 0, 0);
  layers.colour.ctx.drawImage(layers.gold.canvas, 0, 0);
  overlayCanvas(layers.colour, toned.canvas, 'soft-light', 0.5);

  const metal = createCanvas(layers.surface.canvas.width, layers.surface.canvas.height);
  metal.ctx.drawImage(layers.gold.canvas, 0, 0, metal.canvas.width, metal.canvas.height);
  metal.ctx.globalCompositeOperation = 'source-in';
  metal.ctx.fillStyle = 'rgb(0, 96, 255)';
  metal.ctx.fillRect(0, 0, metal.canvas.width, metal.canvas.height);
  layers.surface.ctx.setTransform(1, 0, 0, 1, 0, 0);
  layers.surface.ctx.drawImage(metal.canvas, 0, 0);
}

/** Builds the maps of the hexagon-and-triangle tile field. */
export function buildTileField(context: TextureContext): TextureSet {
  const colourSize = scaled(FIELD_PIXELS, context);
  const reliefSize = scaled(RELIEF_PIXELS, context);
  const layers: TileLayers = {
    colour: createCanvas(colourSize, colourSize),
    gold: createCanvas(colourSize, colourSize),
    relief: createCanvas(reliefSize, reliefSize),
    surface: createCanvas(reliefSize, reliefSize),
  };
  layers.colour.ctx.fillStyle = PALETTE.grout;
  layers.colour.ctx.fillRect(0, 0, colourSize, colourSize);
  layers.relief.ctx.fillStyle = 'rgb(40, 40, 40)';
  layers.relief.ctx.fillRect(0, 0, reliefSize, reliefSize);
  layers.surface.ctx.fillStyle = 'rgb(0, 235, 0)';
  layers.surface.ctx.fillRect(0, 0, reliefSize, reliefSize);
  [layers.colour, layers.gold, layers.relief, layers.surface].forEach(inMetres);
  paintField(layers);
  applyGilding(layers);
  overlayCanvas(layers.colour, noiseCanvas(512, 6, TILE_SEED + 3).canvas, 'soft-light', 0.35);

  const relief = blurHeight(heightFromCanvas(layers.relief), 1.5);
  return {
    map: canvasTexture(layers.colour.canvas, context, true),
    normalMap: canvasTexture(normalMapFromHeight(relief, 5), context, false),
    surfaceMap: canvasTexture(layers.surface.canvas, context, false),
  };
}

const BORDER_METRES = { width: 0.8, height: 0.2 } as const;
const BORDER_PIXELS = { width: 1024, height: 256 } as const;

/** Length of wall, in metres, after which the border pattern repeats. */
export const TILE_BORDER_METRES = BORDER_METRES;

function outlined(ctx: CanvasRenderingContext2D, fill: string): void {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.stroke();
}

function palmette(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.bezierCurveTo(size * 0.5, -size * 0.55, size * 0.95, -size * 0.1, size * 0.42, size * 0.42);
  ctx.bezierCurveTo(size * 0.3, size * 0.2, size * 0.12, size * 0.3, 0, size * 0.55);
  ctx.bezierCurveTo(-size * 0.12, size * 0.3, -size * 0.3, size * 0.2, -size * 0.42, size * 0.42);
  ctx.bezierCurveTo(-size * 0.95, -size * 0.1, -size * 0.5, -size * 0.55, 0, -size);
  outlined(ctx, PALETTE.tileTurquoise);
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.62);
  ctx.bezierCurveTo(size * 0.3, -size * 0.3, size * 0.3, size * 0.05, 0, size * 0.2);
  ctx.bezierCurveTo(-size * 0.3, size * 0.05, -size * 0.3, -size * 0.3, 0, -size * 0.62);
  outlined(ctx, PALETTE.tileYellow);
}

function leaf(ctx: CanvasRenderingContext2D, size: number, colour: string): void {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.5, -size * 0.45, size * 0.9, -size * 0.2, size, size * 0.15);
  ctx.bezierCurveTo(size * 0.6, size * 0.1, size * 0.4, size * 0.25, 0, 0);
  outlined(ctx, colour);
}

/** One repeat of the border: a wave of white stem with a palmette standing up and one hanging down. */
function borderRepeat(ctx: CanvasRenderingContext2D, startX: number, length: number, middle: number, amplitude: number): void {
  ctx.lineWidth = 9;
  ctx.strokeStyle = PALETTE.tileWhite;
  ctx.beginPath();
  ctx.moveTo(startX, middle);
  ctx.bezierCurveTo(startX + length * 0.25, middle - amplitude * 1.9, startX + length * 0.25, middle - amplitude * 1.9, startX + length * 0.5, middle);
  ctx.bezierCurveTo(startX + length * 0.75, middle + amplitude * 1.9, startX + length * 0.75, middle + amplitude * 1.9, startX + length, middle);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = PALETTE.paintBlack;
  [0.25, 0.75].forEach((position, index) => {
    const direction = index === 0 ? 1 : -1;
    ctx.save();
    ctx.translate(startX + length * position, middle + direction * amplitude * 0.15);
    ctx.scale(1, direction);
    palmette(ctx, amplitude * 1.15);
    ctx.restore();
    ctx.save();
    ctx.translate(startX + length * (position + 0.25), middle);
    for (const mirror of [1, -1]) {
      ctx.save();
      ctx.scale(mirror, -direction);
      ctx.rotate(-0.5);
      leaf(ctx, amplitude * 0.95, mirror === 1 ? PALETTE.tileWhite : PALETTE.tileManganese);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, amplitude * 0.2, 0, Math.PI * 2);
    outlined(ctx, PALETTE.tileYellow);
    ctx.restore();
  });
}

function borderStripes(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const stripes: [number, number, string][] = [
    [0, 0.05, PALETTE.paintBlack],
    [0.05, 0.1, PALETTE.tileWhite],
    [0.1, 0.17, PALETTE.tileYellow],
    [0.17, 0.2, PALETTE.paintBlack],
  ];
  for (const [from, to, colour] of stripes) {
    ctx.fillStyle = colour;
    ctx.fillRect(0, from * height, width, (to - from) * height);
    ctx.fillRect(0, (1 - to) * height, width, (to - from) * height);
  }
}

/** Builds the polychrome border of the dado, in the manner of black-line (cuerda seca) tiles. */
export function buildTileBorder(context: TextureContext): TextureSet {
  const width = scaled(BORDER_PIXELS.width, context);
  const height = scaled(BORDER_PIXELS.height, context);
  const layer = createCanvas(width, height);
  const { ctx } = layer;
  ctx.scale(width / BORDER_PIXELS.width, height / BORDER_PIXELS.height);
  ctx.fillStyle = PALETTE.tileCobalt;
  ctx.fillRect(0, 0, BORDER_PIXELS.width, BORDER_PIXELS.height);
  borderStripes(ctx, BORDER_PIXELS.width, BORDER_PIXELS.height);
  const repeat = BORDER_PIXELS.width / 2;
  for (let index = -1; index <= 2; index += 1) borderRepeat(ctx, index * repeat, repeat, BORDER_PIXELS.height / 2, BORDER_PIXELS.height * 0.2);
  // Joints between the square border tiles.
  ctx.fillStyle = PALETTE.grout;
  for (let joint = 0; joint < 4; joint += 1) ctx.fillRect(joint * (BORDER_PIXELS.width / 4) - 1.5, 0, 3, BORDER_PIXELS.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  overlayCanvas(layer, noiseCanvas(256, 8, TILE_SEED + 9).canvas, 'soft-light', 0.3);
  return { map: canvasTexture(layer.canvas, context, true) };
}
