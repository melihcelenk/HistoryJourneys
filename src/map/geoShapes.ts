/** A ring of a polygon: points as [longitude, latitude]. */
export type Ring = number[][];

/** Turns a [longitude, latitude] point into canvas coordinates. */
export type Projector = (point: number[]) => { x: number; y: number };

interface GeoFeature<T> {
  geometry: { coordinates: T };
}

/** Downloads one of the map data files (public/geo) and returns the coordinates of its geometry. */
export async function fetchCoordinates<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Map data ${url} could not be loaded (HTTP ${response.status})`);
  return ((await response.json()) as GeoFeature<T>).geometry.coordinates;
}

function tracePoints(context: CanvasRenderingContext2D, project: Projector, points: number[][]): void {
  points.forEach((point, index) => {
    const { x, y } = project(point);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
}

/** Starts a new path with every ring of the polygons, closed; the caller fills or strokes it. */
export function tracePolygons(context: CanvasRenderingContext2D, project: Projector, polygons: Ring[][]): void {
  context.beginPath();
  for (const polygon of polygons) {
    for (const ring of polygon) {
      tracePoints(context, project, ring);
      context.closePath();
    }
  }
}

/** Starts a new path with the given open lines; the caller strokes it. */
export function traceLines(context: CanvasRenderingContext2D, project: Projector, lines: number[][][]): void {
  context.beginPath();
  for (const line of lines) tracePoints(context, project, line);
}
