/**
 * Reflections for the glossy materials of the room (glazed tiles, brass, gilding). A rough stand-in of the room —
 * dim walls, bright windows on the east side, the glow of the hearth — is rendered once into a small
 * environment map; it is given to the materials that need it and not to the scene.
 */
import * as THREE from 'three';
import { HALF_DEPTH, HALF_WIDTH, ROOM_SIZE, wallPlan, wallToWorld } from './layout';
import type { RoomMaterials } from './materials';

const WINDOW_GLOW = 4;
const HEARTH_GLOW = 5;

function glowPanel(width: number, height: number, colour: THREE.Color): THREE.Mesh {
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ color: colour, side: THREE.DoubleSide }));
}

function standInRoom(): THREE.Scene {
  const scene = new THREE.Scene();
  const shell = new THREE.BoxGeometry(ROOM_SIZE.width, ROOM_SIZE.height, ROOM_SIZE.depth);
  const sides = ['#5d4a3c', '#6b5a4a', '#2a120c', '#4a1c14', '#6a5a4c', '#6a5a4c'].map(
    (colour) => new THREE.MeshBasicMaterial({ color: colour, side: THREE.BackSide }),
  );
  const box = new THREE.Mesh(shell, sides);
  box.position.y = ROOM_SIZE.height / 2;
  scene.add(box);
  const east = wallPlan('east');
  for (const opening of east.openings) {
    const top = opening.spring + opening.rise;
    const upper = opening.kind === 'upperWindow';
    const colour = new THREE.Color(upper ? '#b9a6d8' : '#fff0d2').multiplyScalar(upper ? WINDOW_GLOW * 0.35 : WINDOW_GLOW);
    const panel = glowPanel(opening.width, top - opening.sill, colour);
    const [x, y, z] = wallToWorld(east, opening.centre, (opening.sill + top) / 2, -0.02);
    panel.position.set(x, y, z);
    panel.rotation.y = Math.PI / 2;
    scene.add(panel);
  }
  const fire = glowPanel(0.7, 0.6, new THREE.Color('#ff7a22').multiplyScalar(HEARTH_GLOW));
  fire.position.set(0, 0.55, -HALF_DEPTH + 0.02);
  scene.add(fire);
  const sunPatch = glowPanel(1.6, 3.2, new THREE.Color('#ff9a50').multiplyScalar(1.6));
  sunPatch.rotation.x = Math.PI / 2;
  sunPatch.position.set(-HALF_WIDTH * 0.3, 0.02, -1);
  scene.add(sunPatch);
  return scene;
}

/** How strongly each glossy material mirrors the room. */
const REFLECTIVE: Readonly<Record<string, number>> = {
  tileField: 0.9,
  tileBorder: 0.8,
  brass: 1.2,
  gilt: 1.1,
  iron: 0.6,
  ceramic: 0.9,
  marble: 0.35,
  starPanel: 0.3,
  walnut: 0.18,
};

/** Renders the environment map of the room and hands it to the glossy materials. */
export function applyReflections(renderer: THREE.WebGLRenderer, materials: RoomMaterials): void {
  const generator = new THREE.PMREMGenerator(renderer);
  const scene = standInRoom();
  const environment = generator.fromScene(scene, 0.03).texture;
  generator.dispose();
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) object.geometry.dispose();
  });
  for (const [name, intensity] of Object.entries(REFLECTIVE)) {
    const material = materials[name];
    if (!(material instanceof THREE.MeshStandardMaterial)) continue;
    material.envMap = environment;
    material.envMapIntensity = intensity;
  }
}
