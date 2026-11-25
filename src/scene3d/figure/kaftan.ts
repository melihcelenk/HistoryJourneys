import * as THREE from 'three';
import { createClothTextures } from './clothTextures';
import { createCintamaniSilk, createFurTexture } from './fabricTextures';
import { createHairShells } from './hairShells';
import { loft, sweepBand, sweepTube, through, type BandPoint, type Loft, type Section } from './loft';

/**
 * The clothes of the figure, after the portraits of Mehmed II made in his lifetime: a long inner kaftan of
 * patterned silk with narrow sleeves, a white sash, and over them an open crimson kaftan with short wide sleeves,
 * trimmed with fur along its edges. Distances are in metres; the figure stands on the origin and faces +z.
 */

/** The body is centred a little behind the face, as in the head scan. */
const BODY_Z = -0.04;

const INNER: readonly Section[] = [
  { y: 1.488, rx: 0.076, rz: 0.084, cz: -0.016 },
  { y: 1.466, rx: 0.122, rz: 0.09, cz: -0.025 },
  { y: 1.448, rx: 0.165, rz: 0.097, cz: BODY_Z },
  { y: 1.425, rx: 0.198, rz: 0.102, cz: BODY_Z },
  { y: 1.38, rx: 0.214, rz: 0.116, cz: BODY_Z },
  { y: 1.28, rx: 0.212, rz: 0.14, cz: -0.03 },
  { y: 1.12, rx: 0.21, rz: 0.156, cz: -0.015 },
  { y: 0.98, rx: 0.21, rz: 0.16, cz: -0.015 },
  { y: 0.7, rx: 0.23, rz: 0.175, cz: -0.02 },
  { y: 0.4, rx: 0.26, rz: 0.2, cz: -0.02 },
  { y: 0.05, rx: 0.305, rz: 0.235, cz: -0.02 },
];

export const OUTER: readonly Section[] = [
  // The outer collar lies lower than the inner one, so that the red collar shows between the beard and the fur.
  { y: 1.468, rx: 0.1, rz: 0.104, cz: -0.02 },
  { y: 1.455, rx: 0.135, rz: 0.108, cz: -0.03 },
  { y: 1.44, rx: 0.18, rz: 0.113, cz: BODY_Z },
  { y: 1.42, rx: 0.214, rz: 0.117, cz: BODY_Z },
  { y: 1.36, rx: 0.232, rz: 0.134, cz: BODY_Z },
  { y: 1.27, rx: 0.232, rz: 0.162, cz: -0.03 },
  { y: 1.11, rx: 0.244, rz: 0.19, cz: -0.015 },
  { y: 0.97, rx: 0.25, rz: 0.194, cz: -0.015 },
  { y: 0.7, rx: 0.268, rz: 0.204, cz: -0.02 },
  { y: 0.4, rx: 0.298, rz: 0.228, cz: -0.02 },
  { y: 0.08, rx: 0.338, rz: 0.262, cz: -0.02 },
];

/** Half of the opening of the outer kaftan at each of its sections, as an angle: wide at the neck, a V on the chest. */
const OUTER_OPENING = [0.85, 0.62, 0.4, 0.33, 0.3, 0.29, 0.2, 0.18, 0.2, 0.23, 0.26];

const SASH: readonly Section[] = [
  { y: 1.115, rx: 0.212, rz: 0.158, cz: -0.015 },
  { y: 1.09, rx: 0.226, rz: 0.172, cz: -0.015 },
  { y: 1.05, rx: 0.229, rz: 0.176, cz: -0.015 },
  { y: 1.01, rx: 0.226, rz: 0.173, cz: -0.015 },
  { y: 0.985, rx: 0.211, rz: 0.161, cz: -0.015 },
];

/** Joints of the figure's left arm; the right arm is its mirror image. */
export const ARM = {
  shoulder: new THREE.Vector3(0.18, 1.4, BODY_Z),
  upper: new THREE.Vector3(0.246, 1.3, -0.045),
  elbow: new THREE.Vector3(0.286, 1.12, -0.05),
  // The forearm and the hand hang clear of the skirt of the outer kaftan, which is widest here.
  forearm: new THREE.Vector3(0.302, 0.99, -0.005),
  wrist: new THREE.Vector3(0.31, 0.875, 0.045),
} as const;

/** Vertical folds of a long garment: none above the waist, deepest at the hem. */
function skirtFolds(depth: number, seed: number): (angle: number, along: number) => number {
  return (angle, along) => {
    const low = THREE.MathUtils.smoothstep(along, 0.5, 1);
    return depth * low * (Math.sin(angle * 9 + seed) * 0.6 + Math.sin(angle * 15 + seed * 2.3 + along * 2) * 0.4);
  };
}

function mirrored(point: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(-point.x, point.y, point.z);
}

interface Materials {
  silk: THREE.Material;
  velvet: THREE.Material;
  sash: THREE.Material;
  fur: THREE.Material;
  leather: THREE.Material;
}

function createMaterials(): Materials {
  const weave = createClothTextures({ seed: 3, weave: 180, wrinkles: 0.35 }).normal;
  const silkTextures = createCintamaniSilk('#8f1d1a', '#c9a24a', '#7a1513');
  const silk = new THREE.MeshPhysicalMaterial({
    map: silkTextures.colour,
    metalnessMap: silkTextures.gold,
    metalness: 0.75,
    roughness: 0.5,
    normalMap: weave,
    normalScale: new THREE.Vector2(0.35, 0.35),
    sheen: 0.6,
    sheenColor: new THREE.Color(0xff7a5a),
    sheenRoughness: 0.35,
    side: THREE.DoubleSide,
  });
  const velvet = new THREE.MeshPhysicalMaterial({
    color: 0x5a0d16,
    roughness: 0.95,
    normalMap: weave,
    normalScale: new THREE.Vector2(0.5, 0.5),
    sheen: 1,
    sheenColor: new THREE.Color(0xd2485a),
    sheenRoughness: 0.45,
    side: THREE.DoubleSide,
  });
  const sash = new THREE.MeshPhysicalMaterial({ color: 0xe9e1cf, roughness: 0.85, normalMap: weave, normalScale: new THREE.Vector2(0.6, 0.6), sheen: 0.4, sheenColor: new THREE.Color(0xfff3dd) });
  const fur = new THREE.MeshStandardMaterial({ map: createFurTexture(5), roughness: 0.95 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x9c7a2e, roughness: 0.55 });
  return { silk, velvet, sash, fur, leather };
}

function createInner(materials: Materials): THREE.Mesh {
  const { geometry } = loft(INNER, { around: 96, rowsPerSection: 8, displace: skirtFolds(0.012, 1.7), repeat: [7, 8] });
  return new THREE.Mesh(geometry, materials.silk);
}

/** Where the sash is knotted: at the front, a little to the figure's left. */
const KNOT = new THREE.Vector3(0.035, 1.05, 0.172);

/** One end of the sash, hanging from the knot. */
function createSashEnd(lean: number, length: number, materials: Materials): THREE.Mesh {
  const points = [KNOT.clone(), new THREE.Vector3(KNOT.x + lean * 0.5, KNOT.y - length * 0.45, KNOT.z + 0.012), new THREE.Vector3(KNOT.x + lean, KNOT.y - length, KNOT.z + 0.004)];
  const geometry = sweepTube(points, {
    rings: 24,
    around: 16,
    // A flat strip of cloth that widens towards its end.
    radius: (along, angle) => (0.012 + 0.016 * along) * (1 + 0.9 * Math.abs(Math.cos(angle))) * (1 + 0.08 * Math.sin(angle * 5 + along * 9)),
    repeat: [2, 3],
  });
  return new THREE.Mesh(geometry, materials.sash);
}

/** The sash: cloth wound around the waist, knotted at the front, with its two ends hanging. */
function createSash(materials: Materials): THREE.Group {
  const twist = (angle: number, along: number): number => 0.006 * Math.sin(angle * 5 + along * 22) + 0.004 * Math.sin(angle * 11 - along * 15) + 0.003 * Math.sin(along * 19);
  const { geometry } = loft(SASH, { around: 96, rowsPerSection: 6, displace: twist, repeat: [10, 1] });
  const knot = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), materials.sash);
  knot.scale.set(0.034, 0.03, 0.024);
  knot.position.copy(KNOT);
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geometry, materials.sash), knot, createSashEnd(-0.02, 0.24, materials), createSashEnd(0.035, 0.19, materials));
  return group;
}

function createOuter(): Loft {
  return loft(OUTER, {
    around: 110,
    rowsPerSection: 8,
    opening: (along) => through(OUTER_OPENING, along * (OUTER_OPENING.length - 1)),
    displace: skirtFolds(0.016, 4.1),
    repeat: [8, 9],
  });
}

/** Name of the mesh that holds the shells of the fur, so that it can be found among the clothes. */
const FUR_HAIRS = 'fur-hairs';

/** How many rows below the neck the fur still turns the corner from the collar to the front edge. */
const COLLAR_ROWS = 10;

/** The path of the fur: up one front edge, around the back of the neck and down the other front edge. */
function furPath(outer: Loft): BandPoint[] {
  const position = outer.geometry.getAttribute('position');
  const normal = outer.geometry.getAttribute('normal');
  const at = (row: number, column: number): THREE.Vector3 => new THREE.Vector3().fromBufferAttribute(position, row * outer.rowLength + column);
  const normalAt = (row: number, column: number): THREE.Vector3 => new THREE.Vector3().fromBufferAttribute(normal, row * outer.rowLength + column);
  const last = outer.rowLength - 1;
  const down = (row: number, column: number): THREE.Vector3 => at(Math.min(outer.rows - 1, row + 3), column).sub(at(row, column)).normalize();

  const edge = (row: number, column: number, inward: number): BandPoint => {
    const across = at(row, column + inward * 3).sub(at(row, column)).normalize();
    // Near the neck the band turns from lying across the edge to hanging down from the collar.
    const turning = 1 - THREE.MathUtils.smoothstep(row, 0, COLLAR_ROWS);
    across.lerp(down(row, column), turning * 0.85).normalize();
    return { position: at(row, column), normal: normalAt(row, column), across };
  };

  const path: BandPoint[] = [];
  for (let row = outer.rows - 1; row >= 0; row -= 1) path.push(edge(row, last, -1));
  for (let column = last - 1; column >= 1; column -= 1) path.push({ position: at(0, column), normal: normalAt(0, column), across: down(0, column) });
  for (let row = 0; row < outer.rows; row += 1) path.push(edge(row, 0, 1));
  return path;
}

function createFur(outer: Loft, materials: Materials): THREE.Group {
  const path = furPath(outer);
  const heightAt = (along: number): number => (path[Math.round(along * (path.length - 1))] as BandPoint).position.y;
  // Broad on the collar and the chest, as in the portrait; a narrow edging below the waist.
  const broad = (along: number): number => THREE.MathUtils.smoothstep(heightAt(along), 0.95, 1.32);
  const band = sweepBand(path, {
    width: (along) => THREE.MathUtils.lerp(0.05, 0.15, broad(along)),
    thickness: (along) => THREE.MathUtils.lerp(0.014, 0.028, broad(along)),
    across: 10,
    repeat: [1.2, 40],
  });
  const group = new THREE.Group();
  const base = new THREE.Mesh(band, materials.fur);
  const hairs = createHairShells(band, {
    shape: (_point, normal) => ({ weight: 1, length: 0.024, direction: [normal[0] * 0.6, normal[1] * 0.6 - 0.8, normal[2] * 0.6] }),
    layers: 10,
    cells: 330,
    // Light, tawny fur: it must read as fur beside the dark beard that hangs over it.
    root: 0x4a3320,
    tip: 0x9a7a4e,
    droop: 0.3,
    gather: 0,
    fullness: 0.58,
    core: 0.35,
    lift: 0.001,
  });
  hairs.name = FUR_HAIRS;
  group.add(base, hairs);
  return group;
}

/** A sleeve of the inner kaftan: narrow, long and gathered in rings on the forearm, as in the miniature of the sultan. */
function createInnerSleeve(side: 1 | -1, materials: Materials): THREE.Mesh {
  const points = [ARM.shoulder, ARM.upper, ARM.elbow, ARM.forearm, ARM.wrist].map((point) => (side === 1 ? point.clone() : mirrored(point)));
  const geometry = sweepTube(points, {
    rings: 90,
    around: 28,
    radius: (along, angle) => {
      const narrow = THREE.MathUtils.lerp(0.068, 0.04, along ** 0.8);
      const gathered = THREE.MathUtils.smoothstep(along, 0.35, 0.6);
      const rings = 0.035 * Math.sin(along * 120 + Math.sin(angle * 2 + along * 9) * 2.2) + 0.02 * Math.sin(along * 53 + angle);
      return narrow * (1 + gathered * (rings + 0.03 * Math.sin(angle * 3 + along * 40)));
    },
    repeat: [3, 7],
  });
  return new THREE.Mesh(geometry, materials.silk);
}

/** A sleeve of the outer kaftan: short and wide, ending above the elbow. */
function createOuterSleeve(side: 1 | -1, materials: Materials): THREE.Group {
  const end = new THREE.Vector3(0.286, 1.16, -0.05);
  const points = [new THREE.Vector3(0.14, 1.4, BODY_Z), new THREE.Vector3(0.212, 1.368, BODY_Z), new THREE.Vector3(0.264, 1.27, -0.045), end].map((point) =>
    side === 1 ? point : mirrored(point),
  );
  const geometry = sweepTube(points, {
    rings: 40,
    around: 32,
    radius: (along, angle) => THREE.MathUtils.lerp(0.076, 0.09, along) * (1 + 0.035 * Math.sin(angle * 4 + along * 6) * along),
    repeat: [3, 3],
  });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geometry, materials.velvet));
  const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 12, 40), materials.fur);
  cuff.position.copy(points[3] as THREE.Vector3);
  cuff.rotation.set(Math.PI / 2, side * 0.08, 0);
  group.add(cuff);
  return group;
}

function createShoe(side: 1 | -1, materials: Materials): THREE.Mesh {
  const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), materials.leather);
  shoe.scale.set(0.048, 0.036, 0.125);
  shoe.position.set(side * 0.1, 0.032, 0.175);
  shoe.rotation.y = side * 0.14;
  return shoe;
}

export interface Kaftan {
  group: THREE.Group;
  /** Where the hands hang, for placing them: the left wrist; the right one is its mirror image. */
  wrist: THREE.Vector3;
}

/** Builds the clothes of the figure. */
export function createKaftan(): Kaftan {
  const materials = createMaterials();
  const outer = createOuter();
  const group = new THREE.Group();
  group.add(createInner(materials), createSash(materials), new THREE.Mesh(outer.geometry, materials.velvet), createFur(outer, materials));
  for (const side of [1, -1] as const) group.add(createInnerSleeve(side, materials), createOuterSleeve(side, materials), createShoe(side, materials));
  group.traverse((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });
  // The many shells of the fur would each be drawn again into the shadows; the band under them throws the shadow.
  group.getObjectByName(FUR_HAIRS)?.traverse((hair) => {
    hair.castShadow = false;
  });
  return { group, wrist: ARM.wrist.clone() };
}
