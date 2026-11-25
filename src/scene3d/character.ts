import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createEyes } from './figure/eyes';
import { reshapeFace } from './figure/faceShape';
import { createHands } from './figure/hands';
import { BREATH, HEAD_TURN, lidOpening, mouthOpening } from './figure/idle';
import { JAW_ATTRIBUTE, jawWeight, mouthOpen } from './figure/jaw';
import { beardShape, browShape } from './figure/hairShape';
import { REST_POSITION, createHairShells, hairWeights } from './figure/hairShells';
import { EYE_HEIGHT_IN_SCAN, HEAD_SCALE } from './figure/headMetrics';
import { eyeOpen, patchHeadMaterial } from './figure/headShader';
import { createKaftan } from './figure/kaftan';
import { createTurban } from './figure/turban';
import { FIGURE_SPOT } from './shots';

export interface Character {
  root: THREE.Group;
  /**
   * Advances the small movements of the figure. `lookAt` is what he looks at, in the frame of the scene: the
   * visitor, or what he is pointing out. `seconds` is the time since the last call; while `speaking` his mouth moves.
   */
  update(time: number, lookAt: THREE.Vector3, seconds?: number, speaking?: boolean): void;
}

/** Review aid: `?grid` draws a measuring grid over the head and hides the beard. */
const MEASURING = new URLSearchParams(window.location.search).has('grid');
/** Review aid: `?mouth=0.8` holds the mouth open by that much, to look at it in a still picture. */
const MOUTH_PREVIEW = new URLSearchParams(window.location.search).has('mouth') ? Number(new URLSearchParams(window.location.search).get('mouth')) || 0 : null;
/** How quickly the mouth follows the syllables; larger is quicker. */
const MOUTH_SPEED = 28;
const HEAD_URL = 'models/head/head.glb';
const HEAD_MESH_NAME = 'LeePerrySmith';

async function loadTexture(loader: THREE.TextureLoader, url: string, colour: boolean, anisotropy: number): Promise<THREE.Texture> {
  const texture = await loader.loadAsync(url);
  texture.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

/**
 * Moves the points of the scan to the reshaped face; the shading of the scan is kept, and so are the positions it
 * had before, on which the growth of the hair is decided.
 */
function reshape(geometry: THREE.BufferGeometry): void {
  const position = geometry.getAttribute('position');
  geometry.setAttribute(REST_POSITION, position.clone());
  // Which points belong to the lower jaw is read on the scan as it was scanned, like the growth of the hair.
  const jaw = new Float32Array(position.count);
  for (let i = 0; i < position.count; i += 1) jaw[i] = jawWeight([position.getX(i), position.getY(i), position.getZ(i)]);
  geometry.setAttribute(JAW_ATTRIBUTE, new THREE.BufferAttribute(jaw, 1));
  for (let i = 0; i < position.count; i += 1) {
    const [x, y, z] = reshapeFace([position.getX(i), position.getY(i), position.getZ(i)]);
    position.setXYZ(i, x, y, z);
  }
  position.needsUpdate = true;
  geometry.computeBoundingSphere();
}

async function loadHead(renderer: THREE.WebGLRenderer): Promise<THREE.Mesh> {
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  const textures = new THREE.TextureLoader();
  const [gltf, colour, normal, specular] = await Promise.all([
    new GLTFLoader().loadAsync(HEAD_URL),
    loadTexture(textures, 'models/head/color.jpg', true, anisotropy),
    loadTexture(textures, 'models/head/normal.jpg', false, anisotropy),
    loadTexture(textures, 'models/head/specular.jpg', false, anisotropy),
  ]);
  const source = gltf.scene.getObjectByName(HEAD_MESH_NAME);
  if (!(source instanceof THREE.Mesh)) throw new Error(`The head scan has no mesh named ${HEAD_MESH_NAME}.`);

  const skin = new THREE.MeshPhysicalMaterial({
    map: colour,
    normalMap: normal,
    specularIntensityMap: specular,
    // The scan is of a pale man; the tint brings it to the sallow complexion of the portraits.
    color: 0xf3dcc8,
    roughness: 0.55,
    metalness: 0,
    sheen: 0.1,
    sheenColor: new THREE.Color(0xff9a7a),
    sheenRoughness: 0.5,
    // Light passes a little way through skin and comes back warm; without it skin in the shade looks grey.
    emissiveMap: colour,
    emissive: new THREE.Color(0x3a1a12),
    emissiveIntensity: 0.15,
  });
  patchHeadMaterial(skin, { grid: MEASURING });
  const geometry = source.geometry as THREE.BufferGeometry;
  reshape(geometry);
  geometry.setAttribute('aHair', new THREE.BufferAttribute(hairWeights(geometry, beardShape), 1));
  const head = new THREE.Mesh(geometry, skin);
  head.castShadow = true;
  head.receiveShadow = true;
  return head;
}

export async function buildCharacter(renderer: THREE.WebGLRenderer): Promise<Character> {
  const head = await loadHead(renderer);
  const eyes = createEyes();

  // Everything that sits on the head is built in the units of the scan and scaled with it.
  const scan = new THREE.Group();
  scan.scale.setScalar(HEAD_SCALE);
  const beard = createHairShells(head.geometry, { shape: beardShape, layers: 30, cells: 60, root: 0x1c1009, tip: 0x3a2313, droop: 0.06, gather: 1.1, fullness: 0.74, core: 0.5, taper: 0.4, ragged: 0.12 });
  const brows = createHairShells(head.geometry, { shape: browShape, layers: 6, cells: 52, root: 0x1a0e07, tip: 0x33200f, droop: 0, gather: 0, fullness: 0.62, core: 0.3 });
  // The measuring grid is read on the bare skin.
  beard.visible = !MEASURING;
  scan.add(head, eyes.group, beard, brows, createTurban());

  const headPivot = new THREE.Group();
  const headHeight = FIGURE_SPOT.eyeHeight - EYE_HEIGHT_IN_SCAN;
  headPivot.position.y = headHeight;
  headPivot.add(scan);

  const root = new THREE.Group();
  root.position.set(FIGURE_SPOT.x, 0, FIGURE_SPOT.z);
  root.rotation.y = FIGURE_SPOT.facing;
  const kaftan = createKaftan();
  const rightWrist = kaftan.wrist.clone().setX(-kaftan.wrist.x);
  const hands = await createHands({ wrist: kaftan.wrist, turn: Math.PI }, { wrist: rightWrist, turn: Math.PI });
  root.add(headPivot, kaftan.group, hands);

  const viewerInRoot = new THREE.Vector3();
  const viewerInScan = new THREE.Vector3();
  function update(time: number, viewer: THREE.Vector3, seconds = 0, speaking = false): void {
    // The mouth eases towards where speech wants it, so that it neither snaps open nor shut.
    const wanted = MOUTH_PREVIEW ?? mouthOpening(time, speaking);
    mouthOpen.value += (wanted - mouthOpen.value) * (seconds > 0 ? 1 - Math.exp(-seconds * MOUTH_SPEED) : 1);
    // The chest rises and falls; the head follows the visitor a little and the eyes do the rest.
    const breath = Math.sin((time * Math.PI * 2) / BREATH.seconds);
    kaftan.group.scale.z = 1 + BREATH.depth * breath;
    headPivot.position.y = headHeight + BREATH.lift * breath;
    root.updateWorldMatrix(true, false);
    root.worldToLocal(viewerInRoot.copy(viewer));
    const towards = Math.atan2(viewerInRoot.x, viewerInRoot.z);
    headPivot.rotation.y = THREE.MathUtils.clamp(towards * HEAD_TURN.follow, -HEAD_TURN.max, HEAD_TURN.max);
    // He bows his head to what lies below his eyes (a map on a table) and raises it only a little.
    const below = Math.atan2(FIGURE_SPOT.eyeHeight - viewerInRoot.y, Math.hypot(viewerInRoot.x, viewerInRoot.z));
    headPivot.rotation.x = THREE.MathUtils.clamp(below * HEAD_TURN.follow, -HEAD_TURN.maxRaise, HEAD_TURN.maxBow);
    eyeOpen.value = lidOpening(time);
    root.updateWorldMatrix(true, true);
    eyes.lookAt(scan.worldToLocal(viewerInScan.copy(viewer)));
  }
  return { root, update };
}
