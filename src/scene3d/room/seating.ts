/**
 * Soft furnishings: the carpets on the floor, the low divan (sedir) under the windows with its mattresses,
 * back cushions and bolsters, and the loose floor cushions.
 */
import * as THREE from 'three';
import { GeometryBatch, metricBox } from './geometryTools';
import { FURNITURE, HALF_DEPTH, HALF_WIDTH, findOpening, wallPlan, wallToWorld, type FloorRect } from './layout';
import { MATTRESS, bolsterGeometry, cushionGeometry, type CushionShape } from './softGoods';
import { FRINGE_METRES } from './textures/textiles';

const CARPET_LIFT = 0.012;

function addCarpet(batch: GeometryBatch, material: string, rect: FloorRect, lift: number): void {
  const plane = new THREE.PlaneGeometry(rect.sizeX, rect.sizeZ).rotateX(-Math.PI / 2);
  batch.add(material, plane.translate(rect.x, lift, rect.z));
}

/** Length of the woven part of a carpet that fills the given floor rectangle together with its fringes. */
export function wovenLength(rect: FloorRect): number {
  return rect.sizeZ - FRINGE_METRES * 2;
}

/** Height of the top of the sedir's wooden base and of its mattress. */
export const SEDIR = { baseHeight: 0.2, mattress: 0.16, backHeight: 0.5, backThickness: 0.17 } as const;
const SEAT_TOP = SEDIR.baseHeight + SEDIR.mattress;
const BACK_CLOTHS = ['velvet', 'brocadeBlue', 'velvet', 'brocadeGreen'] as const;
const BACK_LEAN = 0.2;

function addCushion(batch: GeometryBatch, material: string, size: readonly [number, number, number], placement: THREE.Matrix4, shape?: CushionShape): void {
  for (const half of cushionGeometry(size[0], size[1], size[2], 1, shape)) batch.add(material, half, placement);
}

/** The placement of a cushion that stands on its long edge against the east wall and leans back a little. */
function leaningAgainstEastWall(x: number, y: number, z: number, lean: number): THREE.Matrix4 {
  const upright = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, -1, 0));
  const tilt = new THREE.Matrix4().makeRotationZ(-lean);
  return new THREE.Matrix4().makeTranslation(x, y, z).multiply(tilt).multiply(upright);
}

function addSedirBase(batch: GeometryBatch, rect: FloorRect): void {
  const front = rect.x - rect.sizeX / 2;
  batch.add('walnut', metricBox(rect.sizeX, SEDIR.baseHeight - 0.03, rect.sizeZ).translate(rect.x, (SEDIR.baseHeight - 0.03) / 2, rect.z));
  batch.add('walnut', metricBox(rect.sizeX + 0.03, 0.03, rect.sizeZ + 0.015).translate(rect.x - 0.015, SEDIR.baseHeight - 0.015, rect.z));
  const apron = metricBox(0.012, SEDIR.baseHeight - 0.09, rect.sizeZ - 0.2).translate(front - 0.004, (SEDIR.baseHeight - 0.03) / 2, rect.z);
  batch.add('starPanel', apron);
}

function addSedirCushions(batch: GeometryBatch, rect: FloorRect): void {
  const start = rect.z - rect.sizeZ / 2;
  const mattresses = 4;
  const mattressLength = rect.sizeZ / mattresses;
  for (let index = 0; index < mattresses; index += 1) {
    const placement = new THREE.Matrix4().makeTranslation(rect.x - 0.01, SEDIR.baseHeight + SEDIR.mattress / 2, start + mattressLength * (index + 0.5));
    addCushion(batch, 'stripeSilk', [rect.sizeX - 0.02, SEDIR.mattress, mattressLength - 0.01], placement, MATTRESS);
  }
  const backs = 8;
  const backWidth = (rect.sizeZ - 0.5) / backs;
  for (let index = 0; index < backs; index += 1) {
    const z = start + 0.3 + backWidth * (index + 0.5);
    const cloth = BACK_CLOTHS[index % BACK_CLOTHS.length] ?? 'velvet';
    const placement = leaningAgainstEastWall(HALF_WIDTH - SEDIR.backThickness / 2 - 0.05, SEAT_TOP + SEDIR.backHeight / 2 - 0.02, z, BACK_LEAN);
    addCushion(batch, cloth, [backWidth - 0.03, SEDIR.backThickness, SEDIR.backHeight], placement);
  }
}

/** The corner of the sedir by the hearth, made up as the seat of honour: a gold cloth, a bolster and pillows. */
function addSeatOfHonour(batch: GeometryBatch, rect: FloorRect): void {
  const north = rect.z - rect.sizeZ / 2;
  const seat = new THREE.Matrix4().makeTranslation(rect.x - 0.02, SEAT_TOP + 0.045, north + 0.62);
  addCushion(batch, 'brocadeGold', [rect.sizeX - 0.12, 0.11, 1.0], seat);
  const bolster = bolsterGeometry(0.74, 0.25, 1).rotateY(0.06).translate(rect.x, SEAT_TOP + 0.125, north + 0.17);
  batch.add('velvet', bolster);
  const pillow = new THREE.Matrix4()
    .makeTranslation(rect.x + 0.1, SEAT_TOP + 0.3, north + 1.35)
    .multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.5, 0.5, -1.05)));
  addCushion(batch, 'brocadeGold', [0.46, 0.14, 0.46], pillow);
  const southBolster = bolsterGeometry(0.74, 0.24, 1).rotateY(-0.05).translate(rect.x, SEAT_TOP + 0.12, rect.z + rect.sizeZ / 2 - 0.17);
  batch.add('brocadeBlue', southBolster);
}

function addFloorCushions(batch: GeometryBatch): void {
  const rect = FURNITURE.floorCushions;
  addCushion(batch, 'brocadeGreen', [0.82, 0.16, 0.86], new THREE.Matrix4().makeTranslation(rect.x, 0.09, rect.z + 0.26).multiply(new THREE.Matrix4().makeRotationY(0.08)));
  addCushion(batch, 'velvet', [0.78, 0.15, 0.8], new THREE.Matrix4().makeTranslation(rect.x + 0.02, 0.235, rect.z + 0.24).multiply(new THREE.Matrix4().makeRotationY(-0.12)));
  const leaning = new THREE.Matrix4()
    .makeTranslation(rect.x - 0.26, 0.3, rect.z - 0.42)
    .multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.15, 0.3, 1.15)));
  addCushion(batch, 'brocadeBlue', [0.56, 0.15, 0.56], leaning);
  const reading = FURNITURE.readingCushion;
  addCushion(batch, 'velvet', [reading.sizeX, 0.13, reading.sizeZ], new THREE.Matrix4().makeTranslation(reading.x, 0.075, reading.z).multiply(new THREE.Matrix4().makeRotationY(0.05)));
}

const CURTAIN = { width: 0.62, cloth: 1.0, folds: 5, depth: 0.06, clearance: 0.03, rodLift: 0.24, rodRadius: 0.016 } as const;

/** A hanging cloth gathered into folds; it hangs in the x-y plane from y = 0 down to -height. */
function pleatedCloth(height: number): THREE.BufferGeometry {
  const cloth = new THREE.PlaneGeometry(CURTAIN.width, height, CURTAIN.folds * 8, 6).translate(0, -height / 2, 0);
  const position = cloth.getAttribute('position');
  const uv = cloth.getAttribute('uv');
  for (let index = 0; index < position.count; index += 1) {
    const across = uv.getX(index);
    const down = 1 - uv.getY(index);
    const fold = Math.sin(across * Math.PI * 2 * CURTAIN.folds);
    position.setZ(index, fold * CURTAIN.depth * (0.55 + 0.45 * down));
    position.setX(index, position.getX(index) * (1 + 0.12 * down));
    uv.setXY(index, across * CURTAIN.cloth, uv.getY(index) * height);
  }
  cloth.computeVertexNormals();
  return cloth;
}

/** The door curtain: a velvet hanging on a brass rod over the door, drawn aside and gathered at one jamb. */
function addDoorCurtain(batch: GeometryBatch): void {
  const south = wallPlan('south');
  const door = findOpening('south', 'door');
  const top = door.spring + door.rise + CURTAIN.rodLift;
  const [doorX] = wallToWorld(south, door.centre, 0);
  const wallZ = HALF_DEPTH - 0.1;
  const rodLength = door.width + 0.9;
  const rod = new THREE.CylinderGeometry(CURTAIN.rodRadius, CURTAIN.rodRadius, rodLength, 8).rotateZ(Math.PI / 2);
  batch.add('brass', rod.translate(doorX, top, wallZ));
  for (const side of [-1, 1]) {
    batch.add('brass', new THREE.SphereGeometry(0.035, 10, 8).translate(doorX + (side * rodLength) / 2, top, wallZ));
    batch.add('brass', new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6).rotateX(Math.PI / 2).translate(doorX + side * (rodLength / 2 - 0.08), top, wallZ + 0.05));
  }
  const cloth = pleatedCloth(top - CURTAIN.clearance - 0.02).rotateY(Math.PI);
  batch.add('velvet', cloth.translate(doorX + door.width / 2 + 0.16, top - 0.02, wallZ));
}

/** Adds the carpets, the sedir and all cushions to the batch. */
export function addSeating(batch: GeometryBatch): void {
  addCarpet(batch, 'mainCarpet', FURNITURE.mainCarpet, CARPET_LIFT);
  addCarpet(batch, 'entryCarpet', FURNITURE.entryCarpet, CARPET_LIFT + 0.002);
  addSedirBase(batch, FURNITURE.sedir);
  addSedirCushions(batch, FURNITURE.sedir);
  addSeatOfHonour(batch, FURNITURE.sedir);
  addFloorCushions(batch);
  addDoorCurtain(batch);
}
