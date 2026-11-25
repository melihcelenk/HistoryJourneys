/** Paintwork that is laid onto the plaster as flat decals: the medallions of the upper walls. */
import * as THREE from 'three';
import { GeometryBatch, wallMatrix } from './geometryTools';
import { wallPlan, type WallId } from './layout';
import { MEDALLION_ASPECT } from './textures/medallion';

const DECAL_LIFT = 0.004;

/** Where the medallions are painted: wall, position along it, height of the centre and width. */
const MEDALLIONS: readonly { wall: WallId; along: number; height: number; width: number }[] = [
  { wall: 'north', along: 1.3, height: 3.2, width: 0.92 },
  { wall: 'north', along: 5.9, height: 3.2, width: 0.92 },
  { wall: 'south', along: 4.5, height: 3.38, width: 1.0 },
  { wall: 'south', along: 1.25, height: 3.2, width: 0.86 },
  { wall: 'south', along: 6.4, height: 3.2, width: 0.86 },
];

/** Adds the painted medallions to the batch. */
export function addWallPaintings(batch: GeometryBatch): void {
  for (const medallion of MEDALLIONS) {
    const plan = wallPlan(medallion.wall);
    const plane = new THREE.PlaneGeometry(medallion.width, medallion.width * MEDALLION_ASPECT);
    batch.add('medallion', plane.translate(medallion.along - plan.length / 2, medallion.height, DECAL_LIFT), wallMatrix(plan));
  }
}
