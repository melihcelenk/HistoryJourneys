import { MAP_REGION } from '../mapRegion';
import type { LonLat } from '../MapView';

/** A point in world pixels: the painted map at scale 1. */
export interface WorldPoint {
  x: number;
  y: number;
}

const DEGREES_TO_RADIANS = Math.PI / 180;

function mercatorY(latitude: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (latitude * DEGREES_TO_RADIANS) / 2));
}

const TOP = mercatorY(MAP_REGION.north);
const BOTTOM = mercatorY(MAP_REGION.south);
const LONGITUDE_SPAN = MAP_REGION.east - MAP_REGION.west;

/**
 * Mercator projection of the game region onto a rectangle of the given width.
 * The relief image (scripts/build-relief.py) uses the same projection, so it
 * lines up with the coastlines.
 */
export class RegionProjection {
  readonly height: number;

  constructor(readonly width: number) {
    this.height = Math.round((width * (TOP - BOTTOM)) / (LONGITUDE_SPAN * DEGREES_TO_RADIANS));
  }

  project([lon, lat]: LonLat | number[]): WorldPoint {
    return {
      x: (((lon ?? 0) - MAP_REGION.west) / LONGITUDE_SPAN) * this.width,
      y: ((TOP - mercatorY(lat ?? 0)) / (TOP - BOTTOM)) * this.height,
    };
  }

  unproject(point: WorldPoint): LonLat {
    const mercator = TOP - (point.y / this.height) * (TOP - BOTTOM);
    return [
      MAP_REGION.west + (point.x / this.width) * LONGITUDE_SPAN,
      (2 * Math.atan(Math.exp(mercator)) - Math.PI / 2) / DEGREES_TO_RADIANS,
    ];
  }
}
