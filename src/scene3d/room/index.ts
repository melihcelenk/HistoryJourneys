import * as THREE from 'three';
import { addCeiling } from './ceiling';
import { addWallPaintings } from './decor';
import { addAmbientShade, createDust, createLightShafts } from './effects';
import { applyReflections } from './environment';
import { GeometryBatch, batchToMeshes, type MeshOptions } from './geometryTools';
import { addHearth, createFire } from './hearth';
import { addJoinery } from './joinery';
import { COLLIDERS, ROOM_SIZE, type Collider } from './layout';
import { createBackdrop, createFillLights, createSun } from './lights';
import { createMaterials } from './materials';
import { addProps } from './props';
import { addSeating } from './seating';
import { addWalls } from './walls';
import { addWindows, upperWindowShape } from './windows';

export { ROOM_SIZE };
export type { Collider };

export interface Room {
  /** Everything of the room: walls, furniture and its own lights. */
  group: THREE.Group;
  /** Furniture and built-in parts the player walks around; the walls are not listed here. */
  colliders: readonly Collider[];
  /** Advances what moves in the room (fire, dust in the light); `time` is in seconds. */
  update(time: number): void;
}

export interface RoomContext {
  renderer: THREE.WebGLRenderer;
  quality: 'low' | 'high';
}

const LOW_QUALITY_TEXTURE_SCALE = 0.5;
const MAX_ANISOTROPY = 8;

function addFloor(batch: GeometryBatch): void {
  const floor = new THREE.PlaneGeometry(ROOM_SIZE.width, ROOM_SIZE.depth);
  const uv = floor.getAttribute('uv');
  for (let index = 0; index < uv.count; index += 1) uv.setXY(index, uv.getX(index) * ROOM_SIZE.width, uv.getY(index) * ROOM_SIZE.depth);
  batch.addAt('floor', floor, [0, 0, 0], [-Math.PI / 2, 0, 0]);
}

const NO_SHADOW: MeshOptions = { castShadow: false, receiveShadow: false };
const RECEIVE_ONLY: MeshOptions = { castShadow: false, receiveShadow: true };

/** Meshes that let the sun through, lie flat on the floor or glow by themselves. */
const SHADOW_OPTIONS: Readonly<Record<string, MeshOptions>> = {
  glass: NO_SHADOW,
  shade: NO_SHADOW,
  medallion: RECEIVE_ONLY,
  ember: NO_SHADOW,
  floor: RECEIVE_ONLY,
  mainCarpet: RECEIVE_ONLY,
  entryCarpet: RECEIVE_ONLY,
};

/** Builds the palace room: its shell, furniture, lights and the things that move in it. */
export function buildRoom(context: RoomContext): Promise<Room> {
  const high = context.quality === 'high';
  const textureContext = {
    anisotropy: Math.min(MAX_ANISOTROPY, context.renderer.capabilities.getMaxAnisotropy()),
    scale: high ? 1 : LOW_QUALITY_TEXTURE_SCALE,
  };
  const materials = createMaterials(textureContext, { upperWindow: upperWindowShape() });
  applyReflections(context.renderer, materials);
  const group = new THREE.Group();
  group.name = 'room';

  const batch = new GeometryBatch();
  addWalls(batch);
  addFloor(batch);
  addCeiling(batch);
  addWindows(batch);
  addJoinery(batch);
  addSeating(batch);
  addHearth(batch);
  addProps(batch);
  addAmbientShade(batch);
  addWallPaintings(batch);
  batchToMeshes(batch, materials, group, SHADOW_OPTIONS);

  const sun = createSun(context.quality);
  group.add(sun, sun.target, ...createFillLights(), createBackdrop());

  const fire = createFire();
  group.add(fire.object);
  const animated: { update(time: number): void }[] = [fire];
  if (high) {
    const dust = createDust(context.quality, context.renderer.domElement.height);
    group.add(createLightShafts(), dust.object);
    animated.push(dust);
  }

  const update = (time: number): void => {
    for (const part of animated) part.update(time);
  };
  update(0);
  return Promise.resolve({ group, colliders: COLLIDERS, update });
}
