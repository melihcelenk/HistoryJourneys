/**
 * Turns the plan of a wall (a rectangle with rectangular and pointed-arch openings) into triangles, split into the
 * horizontal bands of its decoration. Pure maths on plain arrays, so it can be checked in unit tests.
 * Wall-local coordinates: x runs along the wall and is centred on its middle, y is up, z = 0 is the wall face and
 * negative z goes into the wall.
 */
import type { Opening } from './layout';

/** Flat triangle data: three vertices per triangle, no index. */
export interface TriangleSoup {
  positions: number[];
  normals: number[];
  uvs: number[];
}

/** A horizontal band of the wall face between two heights. */
export interface Band {
  name: string;
  bottom: number;
  top: number;
}

type Point = readonly [number, number];

const ARCH_SEGMENTS = 14;
const EPSILON = 1e-6;

export function emptySoup(): TriangleSoup {
  return { positions: [], normals: [], uvs: [] };
}

/**
 * Height of a pointed (two-centred) arch above its spring line, at a horizontal distance `offset` from its axis.
 * `halfWidth` is half the span and `rise` the height of the point. A rise below the half span would need a
 * four-centred arch; it is approximated here by squashing an equilateral pointed arch.
 */
export function archHeight(offset: number, halfWidth: number, rise: number): number {
  const distance = Math.min(Math.abs(offset), halfWidth);
  if (rise <= 0) return 0;
  const effectiveRise = Math.max(rise, halfWidth);
  const centreOffset = (effectiveRise * effectiveRise - halfWidth * halfWidth) / (2 * halfWidth);
  const radius = halfWidth + centreOffset;
  const reach = distance + centreOffset;
  const height = Math.sqrt(Math.max(0, radius * radius - reach * reach));
  return (height * rise) / effectiveRise;
}

/**
 * Height of the top edge of an opening at wall position `along`. The arch is the polygon through its
 * `ARCH_SEGMENTS` sample points, so that the wall face, the reveal and the panels of an opening meet without gaps
 * wherever the wall happens to be cut.
 */
export function openingTop(opening: Opening, along: number): number {
  if (opening.rise <= 0) return opening.spring;
  const half = opening.width / 2;
  const position = Math.max(0, Math.min(ARCH_SEGMENTS, ((along - opening.centre + half) / opening.width) * ARCH_SEGMENTS));
  const segment = Math.min(ARCH_SEGMENTS - 1, Math.floor(position));
  const sample = (index: number): number => archHeight((index / ARCH_SEGMENTS) * opening.width - half, half, opening.rise);
  const blend = position - segment;
  return opening.spring + sample(segment) * (1 - blend) + sample(segment + 1) * blend;
}

/**
 * The outline of an opening as a closed polygon in (along, height), starting at the bottom left and running
 * clockwise as seen from inside the room: up the left side, over the arch, down the right side.
 */
export function openingOutline(opening: Opening): Point[] {
  const left = opening.centre - opening.width / 2;
  const right = opening.centre + opening.width / 2;
  const points: Point[] = [[left, opening.sill]];
  if (opening.rise <= 0) {
    points.push([left, opening.spring], [right, opening.spring]);
  } else {
    for (let step = 0; step <= ARCH_SEGMENTS; step += 1) {
      const along = left + (opening.width * step) / ARCH_SEGMENTS;
      points.push([along, openingTop(opening, along)]);
    }
  }
  points.push([right, opening.sill]);
  return points;
}

function breakpoints(length: number, openings: readonly Opening[]): number[] {
  const values = [0, length];
  for (const opening of openings) {
    const segments = opening.rise > 0 ? ARCH_SEGMENTS : 1;
    for (let step = 0; step <= segments; step += 1) {
      values.push(opening.centre - opening.width / 2 + (opening.width * step) / segments);
    }
  }
  values.sort((a, b) => a - b);
  return values.filter((value, index) => index === 0 || value - (values[index - 1] ?? 0) > EPSILON);
}

/** Clips a convex polygon to the half plane y >= limit (keepAbove) or y <= limit. */
function clipToHeight(polygon: Point[], limit: number, keepAbove: boolean): Point[] {
  const inside = (point: Point): boolean => (keepAbove ? point[1] >= limit - EPSILON : point[1] <= limit + EPSILON);
  const result: Point[] = [];
  polygon.forEach((current, index) => {
    const previous = polygon[(index + polygon.length - 1) % polygon.length] ?? current;
    const currentInside = inside(current);
    if (currentInside !== inside(previous)) {
      const t = (limit - previous[1]) / (current[1] - previous[1]);
      result.push([previous[0] + (current[0] - previous[0]) * t, limit]);
    }
    if (currentInside) result.push(current);
  });
  return result;
}

function pushVertex(soup: TriangleSoup, along: number, height: number, halfLength: number): void {
  soup.positions.push(along - halfLength, height, 0);
  soup.normals.push(0, 0, 1);
  soup.uvs.push(along, height);
}

function pushPolygon(soup: TriangleSoup, polygon: Point[], halfLength: number): void {
  const first = polygon[0];
  if (!first) return;
  for (let index = 1; index + 1 < polygon.length; index += 1) {
    const second = polygon[index];
    const third = polygon[index + 1];
    if (!second || !third) continue;
    pushVertex(soup, first[0], first[1], halfLength);
    pushVertex(soup, second[0], second[1], halfLength);
    pushVertex(soup, third[0], third[1], halfLength);
  }
}

/** The solid parts of one vertical strip of the wall, as quads between the openings that cross the strip. */
function solidQuads(left: number, right: number, height: number, openings: readonly Opening[]): Point[][] {
  const middle = (left + right) / 2;
  const crossing = openings
    .filter((opening) => Math.abs(middle - opening.centre) < opening.width / 2)
    .sort((a, b) => a.sill - b.sill);
  const quads: Point[][] = [];
  let bottomLeft = 0;
  let bottomRight = 0;
  for (const opening of crossing) {
    quads.push([[left, bottomLeft], [right, bottomRight], [right, opening.sill], [left, opening.sill]]);
    bottomLeft = openingTop(opening, left);
    bottomRight = openingTop(opening, right);
  }
  quads.push([[left, bottomLeft], [right, bottomRight], [right, height], [left, height]]);
  return quads;
}

function sortIntoBands(quad: Point[], bands: readonly Band[], soups: Map<string, TriangleSoup>, halfLength: number): void {
  for (const band of bands) {
    const clipped = clipToHeight(clipToHeight(quad, band.bottom, true), band.top, false);
    const soup = soups.get(band.name);
    if (soup && clipped.length >= 3) pushPolygon(soup, clipped, halfLength);
  }
}

/**
 * Triangulates the face of a wall around its openings and sorts the triangles into the given bands.
 * Texture coordinates are the position on the wall in metres.
 */
export function meshWallFace(length: number, height: number, openings: readonly Opening[], bands: readonly Band[]): Map<string, TriangleSoup> {
  const soups = new Map<string, TriangleSoup>(bands.map((band) => [band.name, emptySoup()]));
  const edges = breakpoints(length, openings);
  for (let index = 0; index + 1 < edges.length; index += 1) {
    const left = edges[index] ?? 0;
    const right = edges[index + 1] ?? length;
    for (const quad of solidQuads(left, right, height, openings)) sortIntoBands(quad, bands, soups, length / 2);
  }
  return soups;
}

function pushRevealQuad(soup: TriangleSoup, from: Point, to: Point, depth: number, halfLength: number, run: number): void {
  const edgeX = to[0] - from[0];
  const edgeY = to[1] - from[1];
  const edgeLength = Math.hypot(edgeX, edgeY) || 1;
  // The outline runs clockwise, so the normal that looks into the opening is the edge turned to the right.
  const normalX = edgeY / edgeLength;
  const normalY = -edgeX / edgeLength;
  const corners: [number, number, number, number, number][] = [
    [from[0], from[1], 0, run, 0],
    [to[0], to[1], 0, run + edgeLength, 0],
    [to[0], to[1], -depth, run + edgeLength, depth],
    [from[0], from[1], -depth, run, depth],
  ];
  for (const cornerIndex of [0, 2, 1, 0, 3, 2]) {
    const corner = corners[cornerIndex];
    if (!corner) continue;
    soup.positions.push(corner[0] - halfLength, corner[1], corner[2]);
    soup.normals.push(normalX, normalY, 0);
    soup.uvs.push(corner[3], corner[4]);
  }
}

/** The inner sides of an opening (jambs, arch soffit and sill) down to its depth. */
export function meshReveal(opening: Opening, wallLength: number, includeSill = true): TriangleSoup {
  const soup = emptySoup();
  const outline = openingOutline(opening);
  let run = 0;
  const lastEdge = includeSill ? outline.length : outline.length - 1;
  for (let index = 0; index < lastEdge; index += 1) {
    const from = outline[index];
    const to = outline[(index + 1) % outline.length];
    if (!from || !to) continue;
    pushRevealQuad(soup, from, to, opening.depth, wallLength / 2, run);
    run += Math.hypot(to[0] - from[0], to[1] - from[1]);
  }
  return soup;
}

/** A flat panel with the shape of the opening, set `into` metres behind the wall face and looking into the room. */
export function meshOpeningPanel(opening: Opening, wallLength: number, into: number): TriangleSoup {
  const soup = emptySoup();
  const segments = opening.rise > 0 ? ARCH_SEGMENTS : 1;
  const left = opening.centre - opening.width / 2;
  for (let step = 0; step < segments; step += 1) {
    const a = left + (opening.width * step) / segments;
    const b = left + (opening.width * (step + 1)) / segments;
    const polygon: Point[] = [[a, opening.sill], [b, opening.sill], [b, openingTop(opening, b)], [a, openingTop(opening, a)]];
    const start = soup.positions.length;
    pushPolygon(soup, polygon, wallLength / 2);
    for (let index = start + 2; index < soup.positions.length; index += 3) soup.positions[index] = -into;
  }
  return soup;
}

/** Total area of the triangles of a soup, for checking that nothing of the wall got lost or doubled. */
export function soupArea(soup: TriangleSoup): number {
  const at = (index: number): number => soup.positions[index] ?? 0;
  let area = 0;
  for (let index = 0; index + 8 < soup.positions.length; index += 9) {
    const ux = at(index + 3) - at(index);
    const uy = at(index + 4) - at(index + 1);
    const uz = at(index + 5) - at(index + 2);
    const vx = at(index + 6) - at(index);
    const vy = at(index + 7) - at(index + 1);
    const vz = at(index + 8) - at(index + 2);
    area += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
  }
  return area;
}

function unitNormal(from: Point, to: Point): Point {
  const edgeX = to[0] - from[0];
  const edgeY = to[1] - from[1];
  const length = Math.hypot(edgeX, edgeY) || 1;
  // Pointing away from the opening: the edge of the clockwise outline turned to the left.
  return [-edgeY / length, edgeX / length];
}

/** The outline of an opening without its sill, pushed outwards by `distance` with mitred corners. */
export function offsetOutline(outline: readonly Point[], distance: number): Point[] {
  return outline.map((point, index) => {
    const previous = outline[index - 1];
    const next = outline[index + 1];
    const before = previous ? unitNormal(previous, point) : null;
    const after = next ? unitNormal(point, next) : null;
    const first = before ?? after ?? [0, 0];
    const second = after ?? before ?? [0, 0];
    const sumX = first[0] + second[0];
    const sumY = first[1] + second[1];
    const length = Math.hypot(sumX, sumY) || 1;
    const cosHalf = Math.max(0.5, (first[0] * sumX + first[1] * sumY) / length);
    return [point[0] + ((sumX / length) * distance) / cosHalf, point[1] + ((sumY / length) * distance) / cosHalf];
  });
}

function pushFlatQuad(soup: TriangleSoup, corners: readonly (readonly [number, number, number])[], normal: readonly [number, number, number], uvs: readonly Point[]): void {
  for (const cornerIndex of [0, 2, 1, 0, 3, 2]) {
    const corner = corners[cornerIndex];
    const uv = uvs[cornerIndex];
    if (!corner || !uv) continue;
    soup.positions.push(corner[0], corner[1], corner[2]);
    soup.normals.push(normal[0], normal[1], normal[2]);
    soup.uvs.push(uv[0], uv[1]);
  }
}

/**
 * A moulding that follows the sides and the arch of an opening: a band `bandWidth` wide that stands `proud`
 * metres in front of the wall face, with its outer edge closed down to the wall.
 */
export function meshArchBand(opening: Opening, wallLength: number, bandWidth: number, proud: number): TriangleSoup {
  const soup = emptySoup();
  const inner = openingOutline(opening);
  const outer = offsetOutline(inner, bandWidth);
  const half = wallLength / 2;
  let run = 0;
  for (let index = 0; index + 1 < inner.length; index += 1) {
    const a = inner[index];
    const b = inner[index + 1];
    const c = outer[index + 1];
    const d = outer[index];
    if (!a || !b || !c || !d) continue;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const uvs: Point[] = [[run, 0], [run, bandWidth], [run + length, bandWidth], [run + length, 0]];
    pushFlatQuad(soup, [[a[0] - half, a[1], proud], [d[0] - half, d[1], proud], [c[0] - half, c[1], proud], [b[0] - half, b[1], proud]], [0, 0, 1], uvs);
    const out = unitNormal(a, b);
    pushFlatQuad(soup, [[d[0] - half, d[1], proud], [d[0] - half, d[1], 0], [c[0] - half, c[1], 0], [c[0] - half, c[1], proud]], [out[0], out[1], 0], [[run, 0], [run, proud], [run + length, proud], [run + length, 0]]);
    pushFlatQuad(soup, [[a[0] - half, a[1], 0], [a[0] - half, a[1], proud], [b[0] - half, b[1], proud], [b[0] - half, b[1], 0]], [-out[0], -out[1], 0], [[run, 0], [run, proud], [run + length, proud], [run + length, 0]]);
    run += length;
  }
  return soup;
}
