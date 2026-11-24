import { createLandTexture, createRandom, createSeaTexture } from '../textures';
import { fetchCoordinates, type Projector, type Ring, traceLines, tracePolygons } from '../geoShapes';
import type { RegionProjection } from './projection';

/** Map data the terrain is painted from; the shapes are those of public/geo/*.json. */
export interface TerrainData {
  land: Ring[][];
  lakes: Ring[][];
  rivers: number[][][];
  relief: CanvasImageSource;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Image ${url} could not be loaded`));
    image.src = url;
  });
}

export async function loadTerrainData(): Promise<TerrainData> {
  const [land, lakes, rivers, relief] = await Promise.all([
    fetchCoordinates<Ring[][]>('geo/land.json'),
    fetchCoordinates<Ring[][]>('geo/lakes.json'),
    fetchCoordinates<number[][][]>('geo/rivers.json'),
    loadImage('geo/relief.jpg'),
  ]);
  return { land, lakes, rivers, relief };
}

function pattern(context: CanvasRenderingContext2D, texture: HTMLCanvasElement): CanvasPattern {
  const created = context.createPattern(texture, 'repeat');
  if (!created) throw new Error('Canvas pattern could not be created');
  return created;
}

/** Runs a drawing step with its own state, so that filters, clips and blend modes do not leak. */
function layer(context: CanvasRenderingContext2D, draw: () => void): void {
  context.save();
  draw();
  context.restore();
}

/** Width of the map for which the line widths and blurs below are tuned. */
const REFERENCE_WIDTH = 4096;

/**
 * Paints the terrain of the whole region once: textured sea, pale shallows
 * along the coast, textured land shaded by real relief, rivers, lakes and an
 * inked coastline. The result is used as one big texture, the way a strategy
 * game uses a painted campaign map (FR-30).
 */
export function paintTerrain(projection: RegionProjection, data: TerrainData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = projection.width;
  canvas.height = projection.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is not available');
  // Line widths are tuned for the reference width and scale with the actual size.
  const unit = projection.width / REFERENCE_WIDTH;
  const project: Projector = (point) => projection.project(point);
  const { width, height } = canvas;
  context.lineJoin = 'round';
  context.lineCap = 'round';

  layer(context, () => {
    context.fillStyle = pattern(context, createSeaTexture());
    context.fillRect(0, 0, width, height);
  });

  // Shallow water: a pale, soft band around every coast.
  layer(context, () => {
    context.filter = `blur(${10 * unit}px)`;
    context.strokeStyle = 'rgba(176, 208, 198, 0.75)';
    context.lineWidth = 26 * unit;
    tracePolygons(context, project, data.land);
    context.stroke();
  });

  layer(context, () => {
    tracePolygons(context, project, data.land);
    context.clip('evenodd');
    context.fillStyle = pattern(context, createLandTexture());
    context.fillRect(0, 0, width, height);
    // Real relief: mid-grey leaves the land as it is, shadows darken and sunlit slopes lighten it.
    context.globalCompositeOperation = 'overlay';
    context.drawImage(data.relief, 0, 0, width, height);
    context.globalAlpha = 0.6;
    context.drawImage(data.relief, 0, 0, width, height);
    // The land darkens slightly towards the coast, as on a hand-painted map.
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    context.filter = `blur(${7 * unit}px)`;
    context.strokeStyle = 'rgba(96, 72, 36, 0.5)';
    context.lineWidth = 12 * unit;
    tracePolygons(context, project, data.land);
    context.stroke();
  });

  layer(context, () => {
    context.strokeStyle = 'rgba(74, 112, 124, 0.85)';
    context.lineWidth = 2.2 * unit;
    traceLines(context, project, data.rivers);
    context.stroke();
    context.fillStyle = '#5f8791';
    context.strokeStyle = '#3f5c64';
    context.lineWidth = 1.5 * unit;
    tracePolygons(context, project, data.lakes);
    context.fill('evenodd');
    context.stroke();
  });

  layer(context, () => {
    context.strokeStyle = 'rgba(58, 42, 20, 0.9)';
    context.lineWidth = 2 * unit;
    tracePolygons(context, project, data.land);
    context.stroke();
  });

  return canvas;
}

const CLOUD_TEXTURE_SIZE = 512;

/** Soft, tileable blotches used as drifting cloud shadows over the map. */
export function createCloudShadowTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CLOUD_TEXTURE_SIZE;
  canvas.height = CLOUD_TEXTURE_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is not available');
  const random = createRandom(11);
  const offsets = [-CLOUD_TEXTURE_SIZE, 0, CLOUD_TEXTURE_SIZE];
  for (let i = 0; i < 9; i += 1) {
    const x = random() * CLOUD_TEXTURE_SIZE;
    const y = random() * CLOUD_TEXTURE_SIZE;
    const radius = 60 + random() * 90;
    for (const dx of offsets) {
      for (const dy of offsets) {
        const gradient = context.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, radius);
        gradient.addColorStop(0, 'rgba(18, 24, 30, 0.55)');
        gradient.addColorStop(1, 'rgba(18, 24, 30, 0)');
        context.fillStyle = gradient;
        context.fillRect(x + dx - radius, y + dy - radius, radius * 2, radius * 2);
      }
    }
  }
  return canvas;
}
