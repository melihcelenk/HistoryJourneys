/**
 * Things that are not solid: the soft darkening where surfaces meet (a stand-in for ambient occlusion), the
 * shafts of sunlight that hang in the air behind the windows, and the dust that drifts through them.
 */
import * as THREE from 'three';
import { GeometryBatch } from './geometryTools';
import { COLLIDERS, FURNITURE, HALF_DEPTH, HALF_WIDTH, ROOM_SIZE, WALLS, sunTravelDirection, wallPlan, wallToWorld, type Opening, type WallPlan } from './layout';
import { createRandom } from './random';
import { createCanvas } from './textureTools';

const SHADE_LIFT = 0.004;
const SHADE = { floor: 0.55, wallBase: 0.4, corner: 0.42, top: 0.75 } as const;

/** A quad between four corners whose darkness fades from the first edge (a-b) to the second (d-c). */
function shadeQuad(batch: GeometryBatch, corners: readonly (readonly [number, number, number])[]): void {
  const geometry = new THREE.BufferGeometry();
  const order = [0, 1, 2, 0, 2, 3];
  const uvs = [[0.25, 0], [0.25, 0], [0.25, 1], [0.25, 1]] as const;
  const positions: number[] = [];
  const uv: number[] = [];
  for (const index of order) {
    positions.push(...(corners[index] ?? [0, 0, 0]));
    uv.push(...(uvs[index] ?? [0, 0]));
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  batch.add('shade', geometry);
}

/** Stretches of a wall, at floor level, that are not interrupted by an opening that reaches the floor. */
function solidRunsAtFloor(wall: WallPlan): [number, number][] {
  const doors = wall.openings.filter((opening: Opening) => opening.sill <= 0).sort((a, b) => a.centre - b.centre);
  const runs: [number, number][] = [];
  let start = 0;
  for (const door of doors) {
    runs.push([start, door.centre - door.width / 2]);
    start = door.centre + door.width / 2;
  }
  runs.push([start, wall.length]);
  return runs;
}

function addWallShade(batch: GeometryBatch, wall: WallPlan): void {
  const p = (along: number, height: number, into: number): [number, number, number] => wallToWorld(wall, along, height, into);
  const lift = -SHADE_LIFT;
  for (const [from, to] of solidRunsAtFloor(wall)) {
    shadeQuad(batch, [p(from, 0, lift), p(to, 0, lift), p(to, SHADE.wallBase, lift), p(from, SHADE.wallBase, lift)]);
  }
  shadeQuad(batch, [p(wall.length, SHADE_LIFT, 0), p(0, SHADE_LIFT, 0), p(0, SHADE_LIFT, -SHADE.floor), p(wall.length, SHADE_LIFT, -SHADE.floor)]);
  const height = ROOM_SIZE.height;
  shadeQuad(batch, [p(wall.length, height, lift), p(0, height, lift), p(0, height - SHADE.top, lift), p(wall.length, height - SHADE.top, lift)]);
  shadeQuad(batch, [p(0, height, lift), p(0, 0, lift), p(SHADE.corner, 0, lift), p(SHADE.corner, height, lift)]);
  shadeQuad(batch, [p(wall.length, 0, lift), p(wall.length, height, lift), p(wall.length - SHADE.corner, height, lift), p(wall.length - SHADE.corner, 0, lift)]);
}

/** A soft dark blob on the floor under a piece of furniture. */
function addContactShadow(batch: GeometryBatch, minX: number, maxX: number, minZ: number, maxZ: number, spread: number, lift: number): void {
  const plane = new THREE.PlaneGeometry(maxX - minX + spread * 2, maxZ - minZ + spread * 2).rotateX(-Math.PI / 2);
  const uv = plane.getAttribute('uv');
  for (let index = 0; index < uv.count; index += 1) uv.setX(index, 0.5 + uv.getX(index) * 0.5);
  batch.add('shade', plane.translate((minX + maxX) / 2, lift, (minZ + maxZ) / 2));
}

/** Adds the soft shading of all corners and the contact shadows of the furniture to the batch. */
export function addAmbientShade(batch: GeometryBatch): void {
  for (const wall of WALLS) addWallShade(batch, wall);
  COLLIDERS.forEach((collider, index) => {
    addContactShadow(batch, collider.minX, collider.maxX, collider.minZ, collider.maxZ, 0.22, 0.016 + index * 0.0004);
  });
}

function paintShade(): HTMLCanvasElement {
  const size = 128;
  const { canvas, ctx } = createCanvas(size * 2, size);
  const edge = ctx.createLinearGradient(0, size, 0, 0);
  edge.addColorStop(0, 'rgb(255, 255, 255)');
  edge.addColorStop(0.35, 'rgb(110, 110, 110)');
  edge.addColorStop(1, 'rgb(0, 0, 0)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(size, 0, size, size);
  // The blob: dark over most of the piece, fading out within the margin around it.
  ctx.save();
  ctx.translate(size * 1.5, size / 2);
  const blob = ctx.createRadialGradient(0, 0, size * 0.18, 0, 0, size * 0.5);
  blob.addColorStop(0, 'rgb(255, 255, 255)');
  blob.addColorStop(0.55, 'rgb(150, 150, 150)');
  blob.addColorStop(1, 'rgb(0, 0, 0)');
  ctx.fillStyle = blob;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.restore();
  return canvas;
}

/** The material of the soft shading: a warm black whose opacity comes from a painted gradient. */
export function createShadeMaterial(): THREE.Material {
  const alphaMap = new THREE.CanvasTexture(paintShade());
  return new THREE.MeshBasicMaterial({
    color: '#120a06',
    alphaMap,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}

const SHAFT = { length: 6.2, verticalSheets: 4, flatSheets: 3, opacity: 0.02 } as const;
/** Part of each window that the sun really shines through, after the thick wall has cut off its edges. */
const BEAM_TRIM = { south: 0.26, top: 0.16 } as const;

interface Beam {
  /** Corners of the lit part of the window on the inner wall face: z range and height range at x = HALF_WIDTH. */
  zMin: number;
  zMax: number;
  yMin: number;
  yMax: number;
}

/** The beams of sunlight that enter through the lower windows. */
export function sunBeams(): Beam[] {
  const east = wallPlan('east');
  return east.openings
    .filter((opening) => opening.kind === 'window')
    .map((opening) => {
      const z = wallToWorld(east, opening.centre, 0)[2];
      return { zMin: z - opening.width / 2, zMax: z + opening.width / 2 - BEAM_TRIM.south, yMin: opening.sill, yMax: opening.spring - BEAM_TRIM.top };
    });
}

function shaftSheet(batch: GeometryBatch, from: THREE.Vector3, to: THREE.Vector3, travel: THREE.Vector3): void {
  const a = from;
  const b = to;
  const c = to.clone().addScaledVector(travel, SHAFT.length);
  const d = from.clone().addScaledVector(travel, SHAFT.length);
  const geometry = new THREE.BufferGeometry();
  const positions = [a, b, c, a, c, d].flatMap((point) => [point.x, point.y, point.z]);
  const uvs = [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0];
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  batch.add('shaft', geometry);
}

/** Builds the light shafts: thin sheets of glow laid lengthwise through every beam, upright and flat. */
export function createLightShafts(): THREE.Mesh {
  const batch = new GeometryBatch();
  const travel = new THREE.Vector3(...sunTravelDirection());
  for (const beam of sunBeams()) {
    for (let sheet = 0; sheet < SHAFT.verticalSheets; sheet += 1) {
      const z = beam.zMin + ((sheet + 0.5) / SHAFT.verticalSheets) * (beam.zMax - beam.zMin);
      shaftSheet(batch, new THREE.Vector3(HALF_WIDTH, beam.yMin, z), new THREE.Vector3(HALF_WIDTH, beam.yMax, z), travel);
    }
    for (let sheet = 0; sheet < SHAFT.flatSheets; sheet += 1) {
      const y = beam.yMin + ((sheet + 0.5) / SHAFT.flatSheets) * (beam.yMax - beam.yMin);
      shaftSheet(batch, new THREE.Vector3(HALF_WIDTH, y, beam.zMin), new THREE.Vector3(HALF_WIDTH, y, beam.zMax), travel);
    }
  }
  const { canvas, ctx } = createCanvas(128, 32);
  const along = ctx.createLinearGradient(0, 0, 128, 0);
  along.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  along.addColorStop(0.15, 'rgba(255, 255, 255, 1)');
  along.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = along;
  ctx.fillRect(0, 0, 128, 32);
  ctx.globalCompositeOperation = 'destination-in';
  const across = ctx.createLinearGradient(0, 0, 0, 32);
  across.addColorStop(0, 'rgba(255, 255, 255, 0)');
  across.addColorStop(0.3, 'rgba(255, 255, 255, 1)');
  across.addColorStop(0.7, 'rgba(255, 255, 255, 1)');
  across.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = across;
  ctx.fillRect(0, 0, 128, 32);
  const material = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(canvas),
    color: '#ffd9a8',
    transparent: true,
    opacity: SHAFT.opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const mesh = new THREE.Mesh(batch.merged('shaft') ?? new THREE.BufferGeometry(), material);
  mesh.name = 'lightShafts';
  mesh.renderOrder = 5;
  return mesh;
}

const DUST_VERTEX = /* glsl */ `
  uniform float time;
  uniform float pixelScale;
  attribute vec3 drift;
  varying float vGlow;
  void main() {
    float phase = drift.x * 6.2832;
    vec3 moved = position + vec3(
      sin(time * 0.11 + phase) * 0.22,
      sin(time * 0.07 + phase * 1.7) * 0.16 - mod(time * 0.006 * (0.5 + drift.y), 0.3),
      cos(time * 0.09 + phase * 1.3) * 0.22);
    vec4 viewPosition = modelViewMatrix * vec4(moved, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = pixelScale * (0.5 + drift.z) / -viewPosition.z;
    vGlow = 0.45 + 0.55 * sin(time * 0.6 + phase * 3.0);
  }
`;

const DUST_FRAGMENT = /* glsl */ `
  varying float vGlow;
  void main() {
    float distanceToCentre = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = smoothstep(1.0, 0.1, distanceToCentre) * vGlow;
    gl_FragColor = vec4(vec3(1.0, 0.86, 0.66) * alpha * 0.55, alpha);
  }
`;

const DUST = { high: 420, low: 140, minReach: 0.3, maxReach: 4.6, pixelScale: 7 } as const;

export interface Dust {
  object: THREE.Points;
  update(time: number): void;
}

/** Builds the dust motes that drift in the sunbeams. The same time always shows the same motes. */
export function createDust(quality: 'low' | 'high', pixelHeight: number): Dust {
  const count = quality === 'high' ? DUST.high : DUST.low;
  const random = createRandom(1479);
  const beams = sunBeams();
  const travel = sunTravelDirection();
  const positions = new Float32Array(count * 3);
  const drift = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const beam = beams[index % beams.length];
    if (!beam) continue;
    const reach = DUST.minReach + random() * (DUST.maxReach - DUST.minReach);
    const y = beam.yMin + random() * (beam.yMax - beam.yMin);
    const z = beam.zMin + random() * (beam.zMax - beam.zMin);
    positions.set([HALF_WIDTH + travel[0] * reach, Math.max(0.1, y + travel[1] * reach), z + travel[2] * reach], index * 3);
    drift.set([random(), random(), random()], index * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('drift', new THREE.BufferAttribute(drift, 3));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, ROOM_SIZE.height / 2, 0), Math.hypot(HALF_WIDTH, HALF_DEPTH, ROOM_SIZE.height));
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, pixelScale: { value: (DUST.pixelScale * pixelHeight) / 720 } },
    vertexShader: DUST_VERTEX,
    fragmentShader: DUST_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const object = new THREE.Points(geometry, material);
  object.name = 'dust';
  object.renderOrder = 6;
  return {
    object,
    update(time: number): void {
      material.uniforms.time!.value = time;
    },
  };
}

/** Where the sunlit patch of the carpet lies, for placing the light it throws back up. */
export function sunlitFloorCentre(): { x: number; z: number } {
  const carpet = FURNITURE.mainCarpet;
  return { x: carpet.x - carpet.sizeX * 0.22, z: carpet.z - carpet.sizeZ * 0.12 };
}
