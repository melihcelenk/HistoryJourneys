import * as THREE from 'three';
import { FACE_CENTRE_X } from './headMetrics';
import { createClothTextures } from './clothTextures';

/**
 * The turban of the 1480 portrait: a very large white cloth wound around a red ribbed cap whose top shows.
 * Built in the units and the frame of the head scan.
 */

/** Where the turban sits and how large it is. */
const TURBAN = {
  centreY: 3.44,
  centreZ: 0.05,
  /** Largest half-width, half-depth and half-height of the wound cloth. */
  radiusX: 2.75,
  radiusZ: 3.1,
  radiusY: 2.0,
  /** The profile runs from the top to this angle, where the cloth meets the head. */
  rimAngle: 0.82 * Math.PI,
  /** Extra depth at the rim: a head is longer from front to back than from side to side. */
  rimDepth: 0.42,
  /** Extra width at the rim, so that the cloth passes over the tops of the ears. */
  rimWidth: 0.24,
  /** The cloth sits lower at the nape than on the forehead. */
  tilt: -0.2,
  /** Number of windings of the cloth between the top and the rim and how deep the folds between them are. */
  windings: 4.6,
  foldDepth: 0.065,
} as const;

const CAP = { radius: 1.05, height: 0.9, baseY: 5.12, gores: 14, ribDepth: 0.07 } as const;

const AROUND = 160;
const ALONG = 96;

/** Height of the cloth above its smooth shape: rolls of cloth with sharp creases between them. */
function fold(along: number, around: number): number {
  const first = TURBAN.windings * along + 1.25 * Math.sin(around + 0.8) + 0.3 * Math.sin(2 * around - 0.5);
  const second = TURBAN.windings * along - 1.4 * Math.sin(around + 0.9) + 0.3;
  // Each winding lies over the one below it: the cloth swells slowly and ends in an edge.
  const roll = (value: number): number => {
    const within = value - Math.floor(value);
    return within ** 0.55 * (1 - THREE.MathUtils.smoothstep(within, 0.72, 1));
  };
  // The windings cross on the forehead (+z), as in the portrait.
  const crossing = THREE.MathUtils.smoothstep(Math.cos(around - Math.PI / 2), 0.2, 0.9);
  return THREE.MathUtils.lerp(roll(first), roll(second), crossing);
}

function createClothGeometry(): THREE.BufferGeometry {
  const position: number[] = [];
  const colour: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= ALONG; i += 1) {
    const along = i / ALONG;
    const angle = along * TURBAN.rimAngle;
    const spread = Math.sin(angle) ** 0.8;
    const fade = THREE.MathUtils.smoothstep(along, 0.06, 0.2);
    for (let j = 0; j <= AROUND; j += 1) {
      const around = (j / AROUND) * Math.PI * 2;
      const height = fold(along, around);
      const swell = 1 + (TURBAN.foldDepth * (height - 0.5) * fade) / Math.max(spread, 0.3);
      const atRim = THREE.MathUtils.smoothstep(along, 0.6, 1);
      const rim = TURBAN.rimDepth * atRim;
      const x = Math.cos(around) * (TURBAN.radiusX * spread + TURBAN.rimWidth * atRim) * swell;
      const z = Math.sin(around) * (TURBAN.radiusZ * spread + rim) * swell;
      const y = Math.cos(angle) * TURBAN.radiusY * (1 + TURBAN.foldDepth * 0.5 * (height - 0.5) * fade);
      position.push(x, y, z);
      // Creases are darker than the rolls: light does not reach into them.
      const shade = THREE.MathUtils.lerp(0.8, 1, Math.min(1, height * 1.3) ** 0.7) * (0.9 + 0.1 * fade);
      colour.push(shade, shade, shade);
      uv.push((j / AROUND) * 14, along * 8);
    }
  }
  const row = AROUND + 1;
  for (let i = 0; i < ALONG; i += 1) {
    for (let j = 0; j < AROUND; j += 1) {
      const a = i * row + j;
      index.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colour, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

function createCapGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(1, CAP.gores * 8, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const around = Math.atan2(z, x);
    // Gores: the cap is sewn from wedges, each swelling a little between its seams.
    const rib = 1 - CAP.ribDepth * (1 - Math.abs(Math.sin((around * CAP.gores) / 2))) * (1 - y * y);
    position.setXYZ(i, x * CAP.radius * rib, y ** 0.8 * CAP.height, z * CAP.radius * rib);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Builds the turban; add it to the head, in the units of the scan. */
export function createTurban(): THREE.Group {
  const textures = createClothTextures({ seed: 11, weave: 220, wrinkles: 0.5 });
  const cloth = new THREE.Mesh(
    createClothGeometry(),
    new THREE.MeshPhysicalMaterial({
      color: 0xdcd5c7,
      vertexColors: true,
      roughness: 0.9,
      normalMap: textures.normal,
      normalScale: new THREE.Vector2(0.55, 0.55),
      sheen: 0.5,
      sheenColor: new THREE.Color(0xfff6e6),
      sheenRoughness: 0.6,
      side: THREE.DoubleSide,
    }),
  );
  const cap = new THREE.Mesh(
    createCapGeometry(),
    new THREE.MeshPhysicalMaterial({ color: 0x9c1414, roughness: 0.75, sheen: 1, sheenColor: new THREE.Color(0xff5a48), sheenRoughness: 0.4, normalMap: textures.normal, normalScale: new THREE.Vector2(0.3, 0.3) }),
  );
  cap.position.y = CAP.baseY - TURBAN.centreY;

  const group = new THREE.Group();
  group.position.set(FACE_CENTRE_X, TURBAN.centreY, TURBAN.centreZ);
  group.rotation.x = TURBAN.tilt;
  group.add(cloth, cap);
  group.traverse((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });
  return group;
}
