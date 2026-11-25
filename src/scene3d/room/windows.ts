/**
 * The windows of the east wall. Lower tier: marble casings, wrought iron grilles and wooden shutters folded back
 * into the reveals. Upper tier: plaster grilles with coloured glass.
 */
import * as THREE from 'three';
import { GeometryBatch, metricBox, soupToGeometry, wallMatrix } from './geometryTools';
import { WALLS, wallPlan, type Opening, type WallPlan } from './layout';
import type { ArchShape } from './patterns';
import { meshArchBand, meshOpeningPanel, openingTop, type TriangleSoup } from './wallMesher';

const CASING_WIDTH = 0.1;
const CASING_PROUD = 0.035;
const SILL_HEIGHT = 0.07;
const SILL_PROUD = 0.09;

const GRILLE_INSET = 0.13;
const GRILLE_BAR = 0.03;
const GRILLE_SPACING = 0.2;
const GRILLE_KNUCKLE = 0.06;

const SHUTTER_THICKNESS = 0.035;
const SHUTTER_WIDTH = 0.43;
const SHUTTER_STILE = 0.06;

const TRACERY_INSET = 0.1;
const GLASS_GAP = 0.02;
const UPPER_BAND_WIDTH = 0.075;
const UPPER_BAND_PROUD = 0.022;

/** Evenly spread positions between two limits, about `spacing` apart, not touching the limits. */
function spread(from: number, to: number, spacing: number): number[] {
  const count = Math.max(1, Math.round((to - from) / spacing) - 1);
  const step = (to - from) / (count + 1);
  return Array.from({ length: count }, (_, index) => from + step * (index + 1));
}

function addCasing(batch: GeometryBatch, opening: Opening, wall: WallPlan, matrix: THREE.Matrix4): void {
  const x = opening.centre - wall.length / 2;
  const height = opening.spring - opening.sill;
  const outerWidth = opening.width + CASING_WIDTH * 2;
  const place = (geometry: THREE.BufferGeometry, px: number, py: number, pz: number): void => {
    batch.add('marble', geometry.translate(px, py, pz).applyMatrix4(matrix));
  };
  for (const side of [-1, 1]) {
    place(metricBox(CASING_WIDTH, height, CASING_PROUD), x + side * (opening.width / 2 + CASING_WIDTH / 2), opening.sill + height / 2, CASING_PROUD / 2);
  }
  place(metricBox(outerWidth + 0.06, CASING_WIDTH * 1.2, CASING_PROUD * 1.4), x, opening.spring + CASING_WIDTH * 0.6, CASING_PROUD * 0.7);
  place(metricBox(outerWidth + 0.08, SILL_HEIGHT, SILL_PROUD + 0.1), x, opening.sill - SILL_HEIGHT / 2, (SILL_PROUD - 0.1) / 2);
}

/** A wrought iron grille: square bars set on edge, with a forged knuckle at every crossing. */
function addGrille(batch: GeometryBatch, opening: Opening, wall: WallPlan, matrix: THREE.Matrix4): void {
  const x = opening.centre - wall.length / 2;
  const z = -(opening.depth - GRILLE_INSET);
  const height = opening.spring - opening.sill;
  const columns = spread(x - opening.width / 2, x + opening.width / 2, GRILLE_SPACING);
  const rows = spread(opening.sill, opening.spring, GRILLE_SPACING);
  const quarterTurn = Math.PI / 4;
  for (const column of columns) {
    const bar = new THREE.BoxGeometry(GRILLE_BAR, height, GRILLE_BAR).rotateY(quarterTurn).translate(column, opening.sill + height / 2, z);
    batch.add('iron', bar, matrix);
  }
  for (const row of rows) {
    const bar = new THREE.BoxGeometry(opening.width, GRILLE_BAR, GRILLE_BAR).rotateX(quarterTurn).translate(x, row, z);
    batch.add('iron', bar, matrix);
    for (const column of columns) {
      const knuckle = new THREE.BoxGeometry(GRILLE_KNUCKLE, GRILLE_KNUCKLE, GRILLE_KNUCKLE).rotateZ(quarterTurn).translate(column, row, z);
      batch.add('iron', knuckle, matrix);
    }
  }
}

/** One shutter leaf, built flat in the x-y plane with its hinge edge at x = 0. */
function shutterLeaf(batch: GeometryBatch, height: number, placement: THREE.Matrix4): void {
  const add = (material: string, geometry: THREE.BufferGeometry): void => batch.add(material, geometry, placement);
  const panelWidth = SHUTTER_WIDTH - SHUTTER_STILE * 2;
  for (const stileX of [SHUTTER_STILE / 2, SHUTTER_WIDTH - SHUTTER_STILE / 2]) {
    add('walnut', metricBox(SHUTTER_STILE, height, SHUTTER_THICKNESS).translate(stileX, height / 2, 0));
  }
  const rails = [SHUTTER_STILE / 2, height * 0.3, height * 0.7, height - SHUTTER_STILE / 2];
  for (const railY of rails) {
    add('walnut', metricBox(panelWidth, SHUTTER_STILE, SHUTTER_THICKNESS).translate(SHUTTER_WIDTH / 2, railY, 0));
  }
  add('starPanel', metricBox(panelWidth, height - SHUTTER_STILE, SHUTTER_THICKNESS * 0.5).translate(SHUTTER_WIDTH / 2, height / 2, 0));
}

/** Two shutter leaves, opened into the room and folded back against the sides of the reveal. */
function addShutters(batch: GeometryBatch, opening: Opening, wall: WallPlan, matrix: THREE.Matrix4): void {
  const x = opening.centre - wall.length / 2;
  const height = opening.spring - opening.sill - 0.02;
  for (const side of [-1, 1]) {
    // The leaf starts just behind the wall face and runs into the reveal, lying against the jamb.
    const local = new THREE.Matrix4()
      .makeRotationY(Math.PI / 2)
      .setPosition(x + side * (opening.width / 2 - SHUTTER_THICKNESS / 2 - 0.004), opening.sill + 0.01, -0.03);
    shutterLeaf(batch, height, new THREE.Matrix4().multiplyMatrices(matrix, local));
  }
}

/** Rewrites the texture coordinates of an opening panel to run from 0 to 1 across the opening. */
function normaliseUvs(soup: TriangleSoup, opening: Opening): TriangleSoup {
  const left = opening.centre - opening.width / 2;
  const height = openingTop(opening, opening.centre) - opening.sill;
  for (let index = 0; index + 1 < soup.uvs.length; index += 2) {
    soup.uvs[index] = ((soup.uvs[index] ?? 0) - left) / opening.width;
    soup.uvs[index + 1] = ((soup.uvs[index + 1] ?? 0) - opening.sill) / height;
  }
  return soup;
}

function addUpperWindow(batch: GeometryBatch, opening: Opening, wall: WallPlan, matrix: THREE.Matrix4): void {
  batch.add('tracery', soupToGeometry(normaliseUvs(meshOpeningPanel(opening, wall.length, TRACERY_INSET), opening)), matrix);
  batch.add('glass', soupToGeometry(normaliseUvs(meshOpeningPanel(opening, wall.length, TRACERY_INSET + GLASS_GAP), opening)), matrix);
  batch.add('trim', soupToGeometry(meshArchBand(opening, wall.length, UPPER_BAND_WIDTH, UPPER_BAND_PROUD)), matrix);
  const sill = metricBox(opening.width + UPPER_BAND_WIDTH * 2 + 0.04, 0.05, 0.08).translate(opening.centre - wall.length / 2, opening.sill - 0.025, 0.02);
  batch.add('trim', sill, matrix);
}

/** The shape shared by all upper windows, for painting their grille and glass. */
export function upperWindowShape(): ArchShape {
  const sample = wallPlan('east').openings.find((opening) => opening.kind === 'upperWindow');
  if (!sample) throw new Error('The east wall has no upper window.');
  return { width: sample.width, straight: sample.spring - sample.sill, rise: sample.rise };
}

function addWallWindows(batch: GeometryBatch, wall: WallPlan): void {
  const matrix = wallMatrix(wall);
  for (const opening of wall.openings) {
    if (opening.kind === 'window') {
      addCasing(batch, opening, wall, matrix);
      addGrille(batch, opening, wall, matrix);
      addShutters(batch, opening, wall, matrix);
    } else if (opening.kind === 'upperWindow') {
      addUpperWindow(batch, opening, wall, matrix);
    }
  }
}

/** Adds the furnishings of every window of the room to the batch. */
export function addWindows(batch: GeometryBatch): void {
  for (const wall of WALLS) addWallWindows(batch, wall);
}
