/**
 * The painted wooden ceiling: a field of coffers divided by laths, a painted border, a stepped cornice and the
 * large rosette (gobek) in the middle with its gilded boss.
 */
import * as THREE from 'three';
import { GeometryBatch, metricBox } from './geometryTools';
import { ROOM_SIZE } from './layout';
import { CEILING_BORDER_METRES, COFFER_METRES } from './textures/joinery';

const BORDER_WIDTH = CEILING_BORDER_METRES.width;
const FIELD = { width: ROOM_SIZE.width - BORDER_WIDTH * 2, depth: ROOM_SIZE.depth - BORDER_WIDTH * 2 } as const;
const LATH = { width: 0.05, drop: 0.035 } as const;
const FRAME = { width: 0.11, drop: 0.07 } as const;
const CORNICE_STEPS = [
  { reach: 0.07, drop: 0.14, material: 'walnut' },
  { reach: 0.15, drop: 0.07, material: 'gilt' },
  { reach: 0.24, drop: 0.035, material: 'walnut' },
] as const;

/** Radius of the outer ring of the rosette. */
export const ROSETTE_RADIUS = 1.2;
const ROSETTE_SIDES = 12;
const ROSETTE_STEPS = [
  { radius: ROSETTE_RADIUS, drop: 0.07, material: 'walnut' },
  { radius: ROSETTE_RADIUS * 0.94, drop: 0.11, material: 'gilt' },
] as const;
const ROSETTE_DISC = { radius: ROSETTE_RADIUS * 0.9, drop: 0.125 } as const;
const HEIGHT = ROOM_SIZE.height;

/** A horizontal rectangle that looks down, with texture coordinates in metres from its centre. */
function downPlane(width: number, depth: number): THREE.BufferGeometry {
  const plane = new THREE.PlaneGeometry(width, depth);
  const uv = plane.getAttribute('uv');
  for (let index = 0; index < uv.count; index += 1) uv.setXY(index, (uv.getX(index) - 0.5) * width, (uv.getY(index) - 0.5) * depth);
  return plane.rotateX(Math.PI / 2);
}

function addField(batch: GeometryBatch): void {
  batch.add('coffer', downPlane(FIELD.width, FIELD.depth).translate(0, HEIGHT, 0));
  const columns = Math.round(FIELD.width / COFFER_METRES);
  const rows = Math.round(FIELD.depth / COFFER_METRES);
  for (let column = 1; column < columns; column += 1) {
    const x = -FIELD.width / 2 + column * COFFER_METRES;
    batch.add('walnut', metricBox(LATH.width, LATH.drop, FIELD.depth).translate(x, HEIGHT - LATH.drop / 2, 0));
  }
  for (let row = 1; row < rows; row += 1) {
    const z = -FIELD.depth / 2 + row * COFFER_METRES;
    batch.add('walnut', metricBox(FIELD.width, LATH.drop * 0.98, LATH.width).translate(0, HEIGHT - LATH.drop / 2, z));
  }
}

function addBorder(batch: GeometryBatch): void {
  const long = ROOM_SIZE.depth;
  const short = FIELD.width;
  for (const side of [-1, 1]) {
    const x = side * (ROOM_SIZE.width / 2 - BORDER_WIDTH / 2);
    batch.add('ceilingBorder', downPlane(long, BORDER_WIDTH).rotateY(Math.PI / 2).translate(x, HEIGHT - 0.004, 0));
    const z = side * (ROOM_SIZE.depth / 2 - BORDER_WIDTH / 2);
    batch.add('ceilingBorder', downPlane(short, BORDER_WIDTH).translate(0, HEIGHT - 0.004, z));
    batch.add('gilt', metricBox(FRAME.width, FRAME.drop, FIELD.depth + FRAME.width).translate(side * (FIELD.width / 2), HEIGHT - FRAME.drop / 2, 0));
    batch.add('gilt', metricBox(FIELD.width + FRAME.width, FRAME.drop * 0.98, FRAME.width).translate(0, HEIGHT - FRAME.drop / 2, side * (FIELD.depth / 2)));
  }
}

function addCornice(batch: GeometryBatch): void {
  for (const step of CORNICE_STEPS) {
    const y = HEIGHT - step.drop / 2;
    for (const side of [-1, 1]) {
      batch.add(step.material, metricBox(step.reach, step.drop, ROOM_SIZE.depth).translate(side * (ROOM_SIZE.width / 2 - step.reach / 2), y, 0));
      batch.add(step.material, metricBox(ROOM_SIZE.width, step.drop, step.reach).translate(0, y, side * (ROOM_SIZE.depth / 2 - step.reach / 2)));
    }
  }
}

/** A disc that looks down, with the texture stretched once over it. */
function downDisc(radius: number, segments: number): THREE.BufferGeometry {
  return new THREE.CircleGeometry(radius, segments).rotateX(Math.PI / 2);
}

function addRosette(batch: GeometryBatch): void {
  for (const step of ROSETTE_STEPS) {
    const ring = new THREE.CylinderGeometry(step.radius, step.radius, step.drop, ROSETTE_SIDES * 2, 1, false);
    batch.add(step.material, ring.translate(0, HEIGHT - step.drop / 2, 0));
  }
  batch.add('rosette', downDisc(ROSETTE_DISC.radius, ROSETTE_SIDES * 4).translate(0, HEIGHT - ROSETTE_DISC.drop, 0));
  const profile = [
    [0.16, 0],
    [0.17, 0.03],
    [0.12, 0.07],
    [0.13, 0.11],
    [0.07, 0.17],
    [0.045, 0.23],
    [0, 0.26],
  ].map(([radius, drop]) => new THREE.Vector2(radius, -(drop ?? 0)));
  batch.add('gilt', new THREE.LatheGeometry(profile, 16).translate(0, HEIGHT - ROSETTE_DISC.drop, 0));
}

/** Adds the whole ceiling to the batch. */
export function addCeiling(batch: GeometryBatch): void {
  addField(batch);
  addBorder(batch);
  addCornice(batch);
  addRosette(batch);
}
