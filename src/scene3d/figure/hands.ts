import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * The hands: the generic hand models of the WebXR input profiles (MIT licence), used in the relaxed pose they are
 * modelled in, which is the pose of a hand hanging at the side.
 */

const HAND_URLS = { left: 'models/hands/left.glb', right: 'models/hands/right.glb' } as const;
const WRIST_JOINT = 'wrist';

export interface HandPlacement {
  /** Where the wrist is, in the frame of the figure. */
  wrist: THREE.Vector3;
  /** Turn of the hand around the vertical, in radians. */
  turn: number;
}

async function loadHand(url: string, material: THREE.Material): Promise<THREE.Group> {
  const gltf = await new GLTFLoader().loadAsync(url);
  let source: THREE.Mesh | null = null;
  gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) source = child;
  });
  const wrist = gltf.scene.getObjectByName(WRIST_JOINT);
  if (!source || !wrist) throw new Error(`The hand model ${url} has no mesh or no wrist joint.`);
  // The model is used as it was modelled: a plain mesh in its rest pose, moved so that the wrist is the origin.
  const geometry = (source as THREE.Mesh).geometry.clone();
  geometry.deleteAttribute('skinIndex');
  geometry.deleteAttribute('skinWeight');
  geometry.translate(-wrist.position.x, -wrist.position.y, -wrist.position.z);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const hand = new THREE.Group();
  hand.add(mesh);
  return hand;
}

/** Loads the two hands and places them at the wrists; `left` is the figure's left hand. */
export async function createHands(left: HandPlacement, right: HandPlacement): Promise<THREE.Group> {
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xc08a6a, roughness: 0.55, sheen: 0.3, sheenColor: new THREE.Color(0xff9a7a), sheenRoughness: 0.5 });
  const [leftHand, rightHand] = await Promise.all([loadHand(HAND_URLS.left, skin), loadHand(HAND_URLS.right, skin)]);
  leftHand.position.copy(left.wrist);
  leftHand.rotation.y = left.turn;
  rightHand.position.copy(right.wrist);
  rightHand.rotation.y = right.turn;
  const group = new THREE.Group();
  group.add(leftHand, rightHand);
  return group;
}
