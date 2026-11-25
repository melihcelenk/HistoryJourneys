/**
 * Daylight of the room: the low sun that comes in through the east windows, the soft light that the sky and the
 * sunlit floor give back, and the bright view outside the windows.
 */
import * as THREE from 'three';
import { HALF_DEPTH, HALF_WIDTH, ROOM_SIZE, WALL_THICKNESS, sunTravelDirection } from './layout';
import { PALETTE } from './palette';
import { createCanvas } from './textureTools';

const SUN_INTENSITY = 13;
const SUN_DISTANCE = 14;
const SHADOW_MAP_HIGH = 2048;
const SHADOW_MAP_LOW = 1024;
const SHADOW_MARGIN = 0.3;
const SKY_INTENSITY = 0.42;

/** Fits the shadow camera of the sun tightly around the room, so that no shadow texel is wasted outside it. */
function fitShadowCamera(sun: THREE.DirectionalLight): void {
  sun.updateMatrixWorld(true);
  sun.target.updateMatrixWorld(true);
  const view = new THREE.Matrix4().lookAt(sun.position, sun.target.position, THREE.Object3D.DEFAULT_UP);
  view.setPosition(sun.position).invert();
  const bounds = new THREE.Box3();
  const corner = new THREE.Vector3();
  for (const x of [-HALF_WIDTH, HALF_WIDTH + WALL_THICKNESS]) {
    for (const y of [0, ROOM_SIZE.height]) {
      for (const z of [-HALF_DEPTH, HALF_DEPTH]) bounds.expandByPoint(corner.set(x, y, z).applyMatrix4(view));
    }
  }
  const camera = sun.shadow.camera;
  camera.left = bounds.min.x - SHADOW_MARGIN;
  camera.right = bounds.max.x + SHADOW_MARGIN;
  camera.bottom = bounds.min.y - SHADOW_MARGIN;
  camera.top = bounds.max.y + SHADOW_MARGIN;
  camera.near = Math.max(0.1, -bounds.max.z - SHADOW_MARGIN);
  camera.far = -bounds.min.z + SHADOW_MARGIN;
  camera.updateProjectionMatrix();
}

/** The sun: one directional light that casts the shadows of the window grilles across the room. */
export function createSun(quality: 'low' | 'high'): THREE.DirectionalLight {
  const sun = new THREE.DirectionalLight(PALETTE.sun, SUN_INTENSITY);
  const [dx, dy, dz] = sunTravelDirection();
  sun.target.position.set(0, ROOM_SIZE.height / 2, 0);
  sun.position.set(-dx * SUN_DISTANCE, ROOM_SIZE.height / 2 - dy * SUN_DISTANCE, -dz * SUN_DISTANCE);
  sun.castShadow = true;
  const mapSize = quality === 'high' ? SHADOW_MAP_HIGH : SHADOW_MAP_LOW;
  sun.shadow.mapSize.set(mapSize, mapSize);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.012;
  sun.shadow.radius = 1.1;
  fitShadowCamera(sun);
  return sun;
}

/**
 * Light without shadows that stands in for everything the sun does after its first bounce: the cool sky through
 * the windows, the warm glow thrown up by the sunlit carpet and a little light for the dark end of the room.
 */
export function createFillLights(): THREE.Object3D[] {
  const sky = new THREE.HemisphereLight('#cfdcf2', '#6e4a30', SKY_INTENSITY);
  const windowGlow = new THREE.PointLight('#dfe6f5', 4, 9, 1.6);
  windowGlow.position.set(HALF_WIDTH - 0.9, 2.3, 0);
  const carpetBounce = new THREE.PointLight('#ffb070', 3.2, 8, 1.6);
  carpetBounce.position.set(-0.9, 1.1, -1.4);
  const entranceFill = new THREE.PointLight('#f0d2b0', 2.4, 7, 1.6);
  entranceFill.position.set(-0.6, 2.4, 3.1);
  return [sky, windowGlow, carpetBounce, entranceFill];
}

const BACKDROP_DISTANCE = 6;
const BACKDROP_SIZE = { width: 26, height: 14 } as const;

function paintBackdrop(): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(256, 256);
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, PALETTE.skyTop);
  gradient.addColorStop(0.5, PALETTE.skyHorizon);
  gradient.addColorStop(0.62, '#f3e3bc');
  gradient.addColorStop(0.66, '#93a57c');
  gradient.addColorStop(1, '#5f7354');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return canvas;
}

/** The view outside the east windows: a bright morning sky over hazy garden green, far enough to stay vague. */
export function createBackdrop(): THREE.Mesh {
  const texture = new THREE.CanvasTexture(paintBackdrop());
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, color: '#ffffff' });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(BACKDROP_SIZE.width, BACKDROP_SIZE.height), material);
  backdrop.position.set(HALF_WIDTH + WALL_THICKNESS + BACKDROP_DISTANCE, 2.2, 0);
  backdrop.rotation.y = -Math.PI / 2;
  backdrop.name = 'backdrop';
  return backdrop;
}
