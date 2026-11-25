/**
 * Built-in woodwork and the trim of the wall openings: the double door, the cupboard doors of the west wall, and
 * the mouldings, sills and shelves of the niches.
 */
import * as THREE from 'three';
import { GeometryBatch, metricBox, soupToGeometry, wallMatrix } from './geometryTools';
import { WALLS, type Opening, type WallPlan } from './layout';
import { meshArchBand } from './wallMesher';

const STILE = 0.085;
const LEAF_THICKNESS = 0.05;
const PANEL_RECESS = 0.014;
const LEAF_GAP = 0.006;

interface LeafPlan {
  width: number;
  height: number;
  /** Heights of the cross rails, as shares of the leaf height. */
  rails: readonly number[];
}

/** One door leaf with its frame and star panels, built with its lower left corner at the origin. */
function addLeaf(batch: GeometryBatch, plan: LeafPlan, placement: THREE.Matrix4): void {
  const add = (material: string, geometry: THREE.BufferGeometry): void => batch.add(material, geometry, placement);
  for (const x of [STILE / 2, plan.width - STILE / 2]) {
    add('walnut', metricBox(STILE, plan.height, LEAF_THICKNESS).translate(x, plan.height / 2, 0));
  }
  const railHeights = [STILE / 2, ...plan.rails.map((share) => share * plan.height), plan.height - STILE / 2];
  for (const y of railHeights) {
    add('walnut', metricBox(plan.width - STILE * 2, STILE, LEAF_THICKNESS).translate(plan.width / 2, y, 0));
  }
  const panel = metricBox(plan.width - STILE * 2, plan.height - STILE, LEAF_THICKNESS - PANEL_RECESS * 2);
  add('starPanel', panel.translate(plan.width / 2, plan.height / 2, 0));
}

/** A round brass boss with a ring pull hanging from it. */
function addPull(batch: GeometryBatch, placement: THREE.Matrix4, size: number): void {
  const boss = new THREE.SphereGeometry(size, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2);
  batch.add('brass', boss, placement);
  const ring = new THREE.TorusGeometry(size * 1.1, size * 0.16, 6, 16).translate(0, -size * 1.0, size * 0.5);
  batch.add('brass', ring, placement);
}

function localMatrix(wallTransform: THREE.Matrix4, x: number, y: number, z: number): THREE.Matrix4 {
  return new THREE.Matrix4().multiplyMatrices(wallTransform, new THREE.Matrix4().makeTranslation(x, y, z));
}

/** Two leaves that close an opening up to its spring line, a beam above them and their pulls. */
function addDoubleLeaves(batch: GeometryBatch, opening: Opening, wall: WallPlan, rails: readonly number[], pullSize: number): void {
  const matrix = wallMatrix(wall);
  const left = opening.centre - wall.length / 2 - opening.width / 2;
  const z = -opening.depth + LEAF_THICKNESS / 2 + 0.01;
  const height = opening.spring - opening.sill - 0.05;
  const width = opening.width / 2 - LEAF_GAP;
  for (const side of [0, 1]) {
    const x = left + side * (opening.width / 2 + LEAF_GAP);
    addLeaf(batch, { width, height, rails }, localMatrix(matrix, x, opening.sill, z));
    const pullX = left + opening.width / 2 + (side === 0 ? -1 : 1) * (STILE / 2 + LEAF_GAP);
    addPull(batch, localMatrix(matrix, pullX, opening.sill + height * 0.52, z + LEAF_THICKNESS / 2), pullSize);
  }
  const beam = metricBox(opening.width, 0.06, LEAF_THICKNESS + 0.03).translate(left + opening.width / 2, opening.spring - 0.02, z);
  batch.add('walnut', beam, matrix);
  const astragal = metricBox(0.035, height, 0.02).translate(left + opening.width / 2, opening.sill + height / 2, z + LEAF_THICKNESS / 2 + 0.01);
  batch.add('walnut', astragal, matrix);
}

const TRIM_BY_KIND: Readonly<Partial<Record<Opening['kind'], { material: string; width: number; proud: number }>>> = {
  niche: { material: 'trim', width: 0.07, proud: 0.024 },
  cupboard: { material: 'walnut', width: 0.09, proud: 0.03 },
  door: { material: 'marble', width: 0.16, proud: 0.045 },
  hearth: { material: 'marble', width: 0.12, proud: 0.03 },
};

const SILL = { height: 0.05, proud: 0.07, overhang: 0.09 } as const;
const SHELF_THICKNESS = 0.035;
/** A niche taller than this gets a shelf half way up. */
const TALL_NICHE = 1.1;

function addNicheFittings(batch: GeometryBatch, opening: Opening, wall: WallPlan, matrix: THREE.Matrix4): void {
  const x = opening.centre - wall.length / 2;
  const sill = metricBox(opening.width + SILL.overhang * 2, SILL.height, opening.depth + SILL.proud);
  batch.add('marble', sill.translate(x, opening.sill - SILL.height / 2 + 0.002, (SILL.proud - opening.depth) / 2), matrix);
  if (opening.spring - opening.sill > TALL_NICHE) {
    const shelf = metricBox(opening.width, SHELF_THICKNESS, opening.depth - 0.02);
    batch.add('walnut', shelf.translate(x, opening.sill + (opening.spring - opening.sill) * 0.56, -opening.depth / 2 - 0.01), matrix);
  }
}

/** Height above the sill of the shelf inside a tall niche; null when the niche has no shelf. */
export function nicheShelfHeight(opening: Opening): number | null {
  if (opening.spring - opening.sill <= TALL_NICHE) return null;
  return opening.sill + (opening.spring - opening.sill) * 0.56 + SHELF_THICKNESS / 2;
}

function addOpeningJoinery(batch: GeometryBatch, opening: Opening, wall: WallPlan): void {
  const matrix = wallMatrix(wall);
  const trim = TRIM_BY_KIND[opening.kind];
  if (trim) batch.add(trim.material, soupToGeometry(meshArchBand(opening, wall.length, trim.width, trim.proud)), matrix);
  if (opening.kind === 'niche') addNicheFittings(batch, opening, wall, matrix);
  else if (opening.kind === 'cupboard') {
    addDoubleLeaves(batch, opening, wall, [0.5], 0.022);
    const sill = metricBox(opening.width + 0.2, 0.05, 0.09).translate(opening.centre - wall.length / 2, opening.sill - 0.025, 0.02);
    batch.add('walnut', sill, matrix);
  } else if (opening.kind === 'door') addDoubleLeaves(batch, opening, wall, [0.22, 0.78], 0.035);
}

/** Adds the doors, cupboard fronts and niche trim of all walls to the batch. */
export function addJoinery(batch: GeometryBatch): void {
  for (const wall of WALLS) {
    for (const opening of wall.openings) addOpeningJoinery(batch, opening, wall);
  }
}
