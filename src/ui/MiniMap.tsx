import { useEffect, useRef, useState } from 'react';
import { fetchCoordinates, type Ring, tracePolygons } from '../map/geoShapes';
import { MAP_REGION } from '../map/mapRegion';
import type { LonLat, Viewport } from '../map/MapView';

const WIDTH = 190;
const HEIGHT = 118;
const LAND_URL = 'geo/land-mini.json';

/** Colors and line widths of the minimap, in one place. */
const STYLE = {
  sea: '#4f6f77',
  land: '#c9b680',
  coast: 'rgba(60, 44, 20, 0.7)',
  coastWidth: 0.6,
  viewportFill: 'rgba(240, 213, 134, 0.18)',
  viewportStroke: '#f0d586',
  viewportWidth: 1.5,
  point: '#8a1f17',
  pointRim: '#f3e6c2',
  pointRadius: 3,
  pointRimWidth: 1,
} as const;

type Rings = Ring[][];

function project([lon, lat]: LonLat | number[]): [number, number] {
  const x = (((lon ?? 0) - MAP_REGION.west) / (MAP_REGION.east - MAP_REGION.west)) * WIDTH;
  const y = ((MAP_REGION.north - (lat ?? 0)) / (MAP_REGION.north - MAP_REGION.south)) * HEIGHT;
  return [x, y];
}

function unproject(x: number, y: number): LonLat {
  return [
    MAP_REGION.west + (x / WIDTH) * (MAP_REGION.east - MAP_REGION.west),
    MAP_REGION.north - (y / HEIGHT) * (MAP_REGION.north - MAP_REGION.south),
  ];
}

function drawLand(context: CanvasRenderingContext2D, land: Rings): void {
  context.fillStyle = STYLE.land;
  context.strokeStyle = STYLE.coast;
  context.lineWidth = STYLE.coastWidth;
  tracePolygons(
    context,
    (point) => {
      const [x, y] = project(point);
      return { x, y };
    },
    land,
  );
  context.fill('evenodd');
  context.stroke();
}

function drawViewport(context: CanvasRenderingContext2D, viewport: Viewport): void {
  const [left, top] = project([viewport.west, viewport.north]);
  const [right, bottom] = project([viewport.east, viewport.south]);
  context.fillStyle = STYLE.viewportFill;
  context.strokeStyle = STYLE.viewportStroke;
  context.lineWidth = STYLE.viewportWidth;
  context.fillRect(left, top, right - left, bottom - top);
  context.strokeRect(left, top, right - left, bottom - top);
}

function drawPoints(context: CanvasRenderingContext2D, points: LonLat[]): void {
  context.fillStyle = STYLE.point;
  context.strokeStyle = STYLE.pointRim;
  context.lineWidth = STYLE.pointRimWidth;
  for (const point of points) {
    const [x, y] = project(point);
    context.beginPath();
    context.arc(x, y, STYLE.pointRadius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
}

interface MiniMapProps {
  viewport: Viewport | null;
  /** Places of the figures currently shown on the map. */
  points: LonLat[];
  onJump: (point: LonLat) => void;
}

/** Small overview of the whole region with the visible area marked (FR-32). */
export function MiniMap({ viewport, points, onJump }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [land, setLand] = useState<Rings | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCoordinates<Rings>(LAND_URL)
      .then((coordinates) => {
        if (!cancelled) setLand(coordinates);
      })
      .catch((error: unknown) => console.error('Minimap land could not be loaded', error));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const scale = window.devicePixelRatio || 1;
    canvas.width = WIDTH * scale;
    canvas.height = HEIGHT * scale;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.fillStyle = STYLE.sea;
    context.fillRect(0, 0, WIDTH, HEIGHT);
    if (land) drawLand(context, land);
    drawPoints(context, points);
    if (viewport) drawViewport(context, viewport);
  }, [land, viewport, points]);

  return (
    <div className="minimap stone">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Mini harita"
        data-testid="minimap"
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          // The canvas may be shown at another size than it is drawn; scale the click back.
          const x = ((event.clientX - box.left) * WIDTH) / box.width;
          const y = ((event.clientY - box.top) * HEIGHT) / box.height;
          onJump(unproject(x, y));
        }}
      />
    </div>
  );
}
