/**
 * The fireplace (ocak) of the north wall: a raised hearth stone, side piers, a tall faceted plaster hood with a
 * gilded finial, the logs, and the fire itself with its flickering light.
 */
import * as THREE from 'three';
import { GeometryBatch, metricBox } from './geometryTools';
import { FURNITURE, HALF_DEPTH, findOpening } from './layout';
import { PALETTE } from './palette';
import { createRandom, flicker } from './random';
import { noiseCanvas } from './textureTools';

const OPENING = findOpening('north', 'hearth');
const WALL_Z = -HALF_DEPTH;

const SLAB_HEIGHT = OPENING.sill;
const PIER = { width: 0.15, depth: 0.3, offset: 0.74 } as const;
const HOOD = {
  skirtBottom: 1.5,
  skirtTop: 1.72,
  top: 3.86,
  radius: 0.86,
  depthScale: 0.82,
  neckRadius: 0.085,
  facets: 7,
  rings: 12,
} as const;

/** Radius of the hood at a height between its skirt (0) and its tip (1): a slightly hollow, tent-like curve. */
function hoodRadius(share: number): number {
  const eased = Math.pow(1 - share, 1.35);
  return HOOD.neckRadius + (HOOD.radius - HOOD.neckRadius) * eased;
}

function hoodPoint(angleIndex: number, radius: number, y: number): THREE.Vector3 {
  const angle = (angleIndex / HOOD.facets) * Math.PI;
  return new THREE.Vector3(-Math.cos(angle) * radius, y, Math.sin(angle) * radius * HOOD.depthScale);
}

/** A band of flat facets between two half rings of the hood; texture coordinates are in metres. */
function hoodBand(bottomY: number, bottomRadius: number, topY: number, topRadius: number, vStart: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const slant = Math.hypot(topY - bottomY, bottomRadius - topRadius);
  for (let facet = 0; facet < HOOD.facets; facet += 1) {
    const a = hoodPoint(facet, bottomRadius, bottomY);
    const b = hoodPoint(facet + 1, bottomRadius, bottomY);
    const c = hoodPoint(facet + 1, topRadius, topY);
    const d = hoodPoint(facet, topRadius, topY);
    const width = a.distanceTo(b);
    const topWidth = d.distanceTo(c);
    const inset = (width - topWidth) / 2;
    const u0 = facet * 0.4;
    for (const [point, u, v] of [[a, 0, 0], [b, width, 0], [c, width - inset, slant], [a, 0, 0], [c, width - inset, slant], [d, inset, slant]] as const) {
      positions.push(point.x, point.y, point.z);
      uvs.push(u0 + u, vStart + v);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

/** The underside of the hood: a flat fan from the wall to the lower edge of the skirt, black with soot. */
function hoodUnderside(): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  for (let facet = 0; facet < HOOD.facets; facet += 1) {
    const a = hoodPoint(facet, HOOD.radius, HOOD.skirtBottom);
    const b = hoodPoint(facet + 1, HOOD.radius, HOOD.skirtBottom);
    for (const point of [new THREE.Vector3(0, HOOD.skirtBottom, 0), b, a]) {
      positions.push(point.x, point.y, point.z);
      uvs.push(point.x, point.z);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

function addHood(batch: GeometryBatch): void {
  const place = new THREE.Matrix4().makeTranslation(0, 0, WALL_Z);
  batch.add('hoodBand', hoodBand(HOOD.skirtBottom, HOOD.radius, HOOD.skirtTop, HOOD.radius, 0), place);
  batch.add('soot', hoodUnderside(), place);
  const height = HOOD.top - HOOD.skirtTop;
  let run = 0;
  for (let ring = 0; ring < HOOD.rings; ring += 1) {
    const from = ring / HOOD.rings;
    const to = (ring + 1) / HOOD.rings;
    const band = hoodBand(HOOD.skirtTop + from * height, hoodRadius(from), HOOD.skirtTop + to * height, hoodRadius(to), run);
    batch.add('hoodPlaster', band, place);
    run += Math.hypot(height / HOOD.rings, hoodRadius(from) - hoodRadius(to));
  }
  // Gilded mouldings at the two edges of the skirt, and the finial on the tip.
  for (const y of [HOOD.skirtBottom + 0.012, HOOD.skirtTop]) {
    batch.add('gilt', hoodBand(y - 0.014, HOOD.radius + 0.014, y + 0.014, HOOD.radius + 0.014, 0), place);
  }
  for (let edge = 0; edge <= HOOD.facets; edge += 1) {
    const points: THREE.Vector3[] = [];
    for (let ring = 0; ring <= HOOD.rings; ring += 1) {
      const share = ring / HOOD.rings;
      points.push(hoodPoint(edge, hoodRadius(share) + 0.004, HOOD.skirtTop + share * height));
    }
    batch.add('gilt', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), HOOD.rings, 0.011, 4, false), place);
  }
  const finial = [
    [0.1, 0],
    [0.12, 0.03],
    [0.06, 0.07],
    [0.085, 0.12],
    [0.085, 0.16],
    [0.03, 0.22],
    [0.02, 0.3],
    [0, 0.34],
  ].map(([radius, lift]) => new THREE.Vector2(radius, lift));
  batch.add('gilt', new THREE.LatheGeometry(finial, 14).translate(0, HOOD.top - 0.02, WALL_Z + 0.06));
}

function addMasonry(batch: GeometryBatch): void {
  const slab = FURNITURE.hearthSlab;
  batch.add('marble', metricBox(slab.sizeX, SLAB_HEIGHT, slab.sizeZ).translate(slab.x, SLAB_HEIGHT / 2, slab.z));
  for (const side of [-1, 1]) {
    const pierHeight = HOOD.skirtBottom - SLAB_HEIGHT;
    batch.add('marble', metricBox(PIER.width, pierHeight, PIER.depth).translate(side * PIER.offset, SLAB_HEIGHT + pierHeight / 2, WALL_Z + PIER.depth / 2));
    // A stepped console carries the hood out over the pier.
    [0.42, 0.56, 0.7].forEach((reach, index) => {
      const y = HOOD.skirtBottom - 0.05 - (2 - index) * 0.1;
      batch.add('marble', metricBox(PIER.width + 0.03, 0.1, reach).translate(side * PIER.offset, y, WALL_Z + reach / 2));
    });
  }
}

const LOGS: readonly { x: number; z: number; y: number; turn: number; tilt: number; length: number; radius: number }[] = [
  { x: -0.08, z: -0.1, y: 0.07, turn: 0.2, tilt: 0, length: 0.62, radius: 0.06 },
  { x: 0.1, z: -0.2, y: 0.07, turn: -0.35, tilt: 0, length: 0.56, radius: 0.055 },
  { x: 0.02, z: -0.14, y: 0.17, turn: 1.25, tilt: 0.25, length: 0.5, radius: 0.05 },
  { x: -0.12, z: -0.22, y: 0.19, turn: -1.0, tilt: -0.3, length: 0.46, radius: 0.045 },
];

function addLogs(batch: GeometryBatch): void {
  for (const log of LOGS) {
    const geometry = new THREE.CylinderGeometry(log.radius, log.radius * 0.9, log.length, 8).rotateZ(Math.PI / 2 + log.tilt).rotateY(log.turn);
    batch.add('charredWood', geometry.translate(log.x, SLAB_HEIGHT + log.y, WALL_Z + log.z));
  }
  const embers = new THREE.SphereGeometry(0.34, 14, 5, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.16, 0.6);
  batch.add('ember', embers.translate(0, SLAB_HEIGHT + 0.004, WALL_Z - 0.14));
}

/** Adds the masonry, hood and logs of the hearth to the batch. */
export function addHearth(batch: GeometryBatch): void {
  addMasonry(batch);
  addHood(batch);
  addLogs(batch);
}

const FLAME_VERTEX = /* glsl */ `
  attribute float seed;
  varying vec2 vUv;
  varying float vSeed;
  void main() {
    vUv = uv;
    vSeed = seed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FLAME_FRAGMENT = /* glsl */ `
  uniform sampler2D noiseMap;
  uniform float time;
  varying vec2 vUv;
  varying float vSeed;
  void main() {
    float rise = time * (0.55 + vSeed * 0.25);
    float broad = texture2D(noiseMap, vec2(vUv.x * 0.55 + vSeed, vUv.y * 0.6 - rise)).r;
    float fine = texture2D(noiseMap, vec2(vUv.x * 1.3 - vSeed * 2.0, vUv.y * 1.2 - rise * 1.9)).r;
    float sway = (broad - 0.5) * 0.7 * vUv.y;
    float x = (vUv.x - 0.5) * 2.0 + sway;
    float height = 0.5 + 0.5 * fine;
    float taper = pow(clamp(1.0 - vUv.y / height, 0.0, 1.0), 0.75);
    float width = 0.62 * taper * (0.75 + 0.5 * broad);
    float body = (1.0 - smoothstep(width * 0.25, width, abs(x))) * smoothstep(0.0, 0.1, vUv.y) * taper;
    float core = smoothstep(0.35, 0.95, body);
    vec3 colour = mix(vec3(1.0, 0.24, 0.03), vec3(1.0, 0.72, 0.2), core);
    colour = mix(colour, vec3(1.0, 0.95, 0.72), smoothstep(0.75, 1.0, body) * (1.0 - vUv.y));
    gl_FragColor = vec4(colour * body * 1.5, body);
  }
`;

const FLAMES: readonly { x: number; z: number; width: number; height: number; turn: number }[] = [
  { x: -0.1, z: -0.12, width: 0.5, height: 0.78, turn: 0 },
  { x: 0.1, z: -0.17, width: 0.46, height: 0.7, turn: 0.5 },
  { x: 0.0, z: -0.08, width: 0.36, height: 0.52, turn: -0.4 },
  { x: -0.18, z: -0.2, width: 0.26, height: 0.4, turn: 0.9 },
  { x: 0.2, z: -0.1, width: 0.24, height: 0.34, turn: -0.9 },
];

function flameGeometry(): THREE.BufferGeometry {
  const batch = new GeometryBatch();
  const seeds: number[] = [];
  const random = createRandom(1470);
  for (const flame of FLAMES) {
    const plane = new THREE.PlaneGeometry(flame.width, flame.height).translate(0, flame.height / 2, 0).rotateY(flame.turn);
    batch.add('flame', plane.translate(flame.x, SLAB_HEIGHT + 0.05, WALL_Z + flame.z));
    const seed = random();
    for (let vertex = 0; vertex < 6; vertex += 1) seeds.push(seed);
  }
  const geometry = batch.merged('flame') ?? new THREE.BufferGeometry();
  geometry.setAttribute('seed', new THREE.Float32BufferAttribute(seeds, 1));
  return geometry;
}

const FIRE_LIGHT = { intensity: 4.2, distance: 8, decay: 1.5, flickerShare: 0.22 } as const;

export interface Fire {
  object: THREE.Object3D;
  update(time: number): void;
}

/** Builds the flames and the warm, flickering light they throw into the room. */
export function createFire(): Fire {
  const noise = new THREE.CanvasTexture(noiseCanvas(128, 6, 1471).canvas);
  noise.wrapS = THREE.RepeatWrapping;
  noise.wrapT = THREE.RepeatWrapping;
  const material = new THREE.ShaderMaterial({
    uniforms: { noiseMap: { value: noise }, time: { value: 0 } },
    vertexShader: FLAME_VERTEX,
    fragmentShader: FLAME_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const flames = new THREE.Mesh(flameGeometry(), material);
  flames.name = 'flames';
  const light = new THREE.PointLight(PALETTE.fire, FIRE_LIGHT.intensity, FIRE_LIGHT.distance, FIRE_LIGHT.decay);
  const lightHome = new THREE.Vector3(0, 0.8, WALL_Z + 0.8);
  light.position.copy(lightHome);
  const object = new THREE.Group();
  object.add(flames, light);
  return {
    object,
    update(time: number): void {
      material.uniforms.time!.value = time;
      light.intensity = FIRE_LIGHT.intensity * (1 + FIRE_LIGHT.flickerShare * flicker(time, 3));
      light.position.set(lightHome.x + flicker(time, 11) * 0.04, lightHome.y + flicker(time, 17) * 0.05, lightHome.z);
    },
  };
}
