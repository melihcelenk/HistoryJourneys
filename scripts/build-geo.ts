/**
 * Builds the map data under public/geo from Natural Earth (public domain).
 *
 * Usage: tsx scripts/build-geo.ts <directory with Natural Earth GeoJSON files>
 * Expected files: ne_10m_land, ne_10m_lakes, ne_10m_rivers_lake_centerlines,
 * ne_50m_land (all .geojson), from
 * https://github.com/nvkelso/natural-earth-vector/tree/master/geojson
 *
 * The output is clipped to the region the game covers and rounded to about one
 * kilometre, so that it is small enough to ship with the application.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import { MAP_REGION } from '../src/map/mapRegion';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = join(root, 'public', 'geo');
const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Usage: tsx scripts/build-geo.ts <directory with Natural Earth GeoJSON files>');
  process.exit(1);
}

const { west, south, east, north } = MAP_REGION;
const DETAIL_DECIMALS = 2;
const MINI_DECIMALS = 1;
/** Natural Earth scale rank: lower is more important. */
const MAX_RIVER_RANK = 7;
const MAX_LAKE_RANK = 4;
/** Rank given to a feature without one, so that it is never important enough to keep. */
const UNRANKED = Number.POSITIVE_INFINITY;

type Ring = Position[];

function read(name: string): FeatureCollection {
  return JSON.parse(readFileSync(join(sourceDir as string, `${name}.geojson`), 'utf8')) as FeatureCollection;
}

function round(position: Position, decimals: number): Position {
  const factor = 10 ** decimals;
  return [Math.round((position[0] ?? 0) * factor) / factor, Math.round((position[1] ?? 0) * factor) / factor];
}

function dedupe(points: Position[]): Position[] {
  return points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || previous[0] !== point[0] || previous[1] !== point[1];
  });
}

interface ClipEdge {
  inside: (point: Position) => boolean;
  intersect: (a: Position, b: Position) => Position;
}

function verticalEdge(x: number, keepGreater: boolean): ClipEdge {
  return {
    inside: (point) => (keepGreater ? (point[0] ?? 0) >= x : (point[0] ?? 0) <= x),
    intersect: (a, b) => {
      const [ax = 0, ay = 0] = a;
      const [bx = 0, by = 0] = b;
      return [x, ay + ((by - ay) * (x - ax)) / (bx - ax)];
    },
  };
}

function horizontalEdge(y: number, keepGreater: boolean): ClipEdge {
  return {
    inside: (point) => (keepGreater ? (point[1] ?? 0) >= y : (point[1] ?? 0) <= y),
    intersect: (a, b) => {
      const [ax = 0, ay = 0] = a;
      const [bx = 0, by = 0] = b;
      return [ax + ((bx - ax) * (y - ay)) / (by - ay), y];
    },
  };
}

const REGION_EDGES: ClipEdge[] = [
  verticalEdge(west, true),
  verticalEdge(east, false),
  horizontalEdge(south, true),
  horizontalEdge(north, false),
];

/** Sutherland–Hodgman clipping of a ring against one edge of the region. */
function clipRingToEdge(ring: Ring, edge: ClipEdge): Ring {
  const result: Ring = [];
  ring.forEach((current, index) => {
    const previous = ring[(index + ring.length - 1) % ring.length] as Position;
    const currentInside = edge.inside(current);
    if (currentInside !== edge.inside(previous)) result.push(edge.intersect(previous, current));
    if (currentInside) result.push(current);
  });
  return result;
}

function clipRing(ring: Ring, decimals: number): Ring | null {
  const clipped = REGION_EDGES.reduce((points, edge) => (points.length ? clipRingToEdge(points, edge) : points), ring);
  const rounded = dedupe(clipped.map((point) => round(point, decimals)));
  const MIN_RING_POINTS = 4;
  if (rounded.length < MIN_RING_POINTS - 1) return null;
  const first = rounded[0] as Position;
  const last = rounded.at(-1) as Position;
  if (first[0] !== last[0] || first[1] !== last[1]) rounded.push(first);
  return rounded.length >= MIN_RING_POINTS ? rounded : null;
}

function polygonsOf(geometry: Geometry): Ring[][] {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

function linesOf(geometry: Geometry): Position[][] {
  if (geometry.type === 'LineString') return [geometry.coordinates];
  if (geometry.type === 'MultiLineString') return geometry.coordinates;
  return [];
}

function clipPolygons(collection: FeatureCollection, decimals: number, keep: (feature: Feature) => boolean): Ring[][] {
  return collection.features
    .filter(keep)
    .flatMap((feature) => polygonsOf(feature.geometry))
    .flatMap((polygon) => {
      const outer = polygon[0] ? clipRing(polygon[0], decimals) : null;
      if (!outer) return [];
      const holes = polygon.slice(1).flatMap((hole) => {
        const clipped = clipRing(hole, decimals);
        return clipped ? [clipped] : [];
      });
      return [[outer, ...holes]];
    });
}

function isInRegion(point: Position): boolean {
  const [x = 0, y = 0] = point;
  return x >= west && x <= east && y >= south && y <= north;
}

/** Keeps the parts of a line that lie inside the region. */
function clipLine(line: Position[], decimals: number): Position[][] {
  const parts: Position[][] = [];
  let current: Position[] = [];
  for (const point of line) {
    if (isInRegion(point)) {
      current.push(round(point, decimals));
    } else if (current.length > 0) {
      parts.push(current);
      current = [];
    }
  }
  if (current.length > 0) parts.push(current);
  return parts.map(dedupe).filter((part) => part.length > 1);
}

function rank(feature: Feature): number {
  const value = (feature.properties as Record<string, unknown> | null)?.scalerank;
  return typeof value === 'number' ? value : UNRANKED;
}

function write(name: string, geometry: Geometry): void {
  const content = JSON.stringify({ type: 'Feature', properties: {}, geometry });
  writeFileSync(join(outputDir, name), content);
  console.log(`${name}: ${(content.length / 1024).toFixed(0)} KB`);
}

mkdirSync(outputDir, { recursive: true });
write('land.json', { type: 'MultiPolygon', coordinates: clipPolygons(read('ne_10m_land'), DETAIL_DECIMALS, () => true) });
write('lakes.json', {
  type: 'MultiPolygon',
  coordinates: clipPolygons(read('ne_10m_lakes'), DETAIL_DECIMALS, (feature) => rank(feature) <= MAX_LAKE_RANK),
});
write('rivers.json', {
  type: 'MultiLineString',
  coordinates: read('ne_10m_rivers_lake_centerlines')
    .features.filter((feature) => rank(feature) <= MAX_RIVER_RANK)
    .flatMap((feature) => linesOf(feature.geometry))
    .flatMap((line) => clipLine(line, DETAIL_DECIMALS)),
});
write('land-mini.json', { type: 'MultiPolygon', coordinates: clipPolygons(read('ne_50m_land'), MINI_DECIMALS, () => true) });
