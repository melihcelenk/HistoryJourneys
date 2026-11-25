/**
 * Loose objects of the room: the reading stand with its book, the brazier, the tray with ewer and bowls, the
 * chest, the tall candlesticks by the hearth, the things on the niche shelves and the lamp under the ceiling.
 */
import * as THREE from 'three';
import { GeometryBatch, metricBox, wallMatrix } from './geometryTools';
import { nicheShelfHeight } from './joinery';
import { FURNITURE, ROOM_SIZE, findOpening, wallPlan, type FloorRect, type WallId } from './layout';

/** Plain colours of small things; they all share one vertex-coloured material. */
const TINT = {
  wax: '#e9dfc4',
  ash: '#8d877c',
  paper: '#e6dbbd',
  leatherRed: '#6a1d1a',
  leatherGreen: '#1f3d2c',
  leatherBrown: '#4a2d18',
  fruitRed: '#9c2a1e',
  fruitYellow: '#d2a534',
} as const;

type Profile = readonly (readonly [number, number])[];

const LATHE_SEGMENTS = 20;

/** Turns a profile of [radius, height] pairs around the vertical axis. */
function lathe(profile: Profile, segments = LATHE_SEGMENTS): THREE.BufferGeometry {
  return new THREE.LatheGeometry(profile.map(([radius, height]) => new THREE.Vector2(radius, height)), segments);
}

function tube(points: readonly (readonly [number, number, number])[], radius: number): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  return new THREE.TubeGeometry(curve, 12, radius, 6, false);
}

const CANDLESTICK: Profile = [
  [0, 0], [0.17, 0], [0.175, 0.025], [0.15, 0.05], [0.125, 0.3], [0.135, 0.33], [0.04, 0.36], [0.036, 0.5],
  [0.062, 0.52], [0.062, 0.56], [0.036, 0.58], [0.034, 0.64], [0.1, 0.66], [0.105, 0.685], [0.04, 0.69], [0.04, 0.72], [0, 0.72],
];
const CANDLE = { radius: 0.03, height: 0.46 } as const;

function addCandlestick(batch: GeometryBatch, rect: FloorRect, baseY: number, scale = 1): void {
  const place = new THREE.Matrix4().makeTranslation(rect.x, baseY, rect.z).multiply(new THREE.Matrix4().makeScale(scale, scale, scale));
  batch.add('brass', lathe(CANDLESTICK), place);
  const candle = new THREE.CylinderGeometry(CANDLE.radius * 0.92, CANDLE.radius, CANDLE.height, 10).translate(0, 0.72 + CANDLE.height / 2, 0);
  batch.add(TINT.wax, candle, place);
  batch.add('charredWood', new THREE.CylinderGeometry(0.003, 0.003, 0.03, 4).translate(0, 0.72 + CANDLE.height + 0.012, 0), place);
}

const BRAZIER_BODY: Profile = [
  [0, 0.14], [0.13, 0.14], [0.1, 0.16], [0.09, 0.2], [0.22, 0.25], [0.35, 0.33], [0.4, 0.42], [0.42, 0.425],
  [0.415, 0.445], [0.385, 0.44], [0.33, 0.37], [0.2, 0.32], [0, 0.31],
];
const BRAZIER_TRAY: Profile = [[0, 0.1], [0.3, 0.1], [0.34, 0.115], [0.36, 0.15], [0.345, 0.15], [0.325, 0.125], [0.29, 0.115], [0, 0.115]];

function addBrazier(batch: GeometryBatch): void {
  const rect = FURNITURE.brazier;
  const place = new THREE.Matrix4().makeTranslation(rect.x, 0.012, rect.z);
  batch.add('brass', lathe(BRAZIER_BODY, 28), place);
  batch.add('brass', lathe(BRAZIER_TRAY, 28), place);
  for (let leg = 0; leg < 3; leg += 1) {
    const angle = (leg * Math.PI * 2) / 3 + 0.4;
    const foot = lathe([[0, 0], [0.035, 0], [0.045, 0.03], [0.025, 0.06], [0.03, 0.1], [0, 0.1]], 8);
    batch.add('brass', foot.translate(Math.cos(angle) * 0.3, 0, Math.sin(angle) * 0.3), place);
    const handle = new THREE.TorusGeometry(0.05, 0.009, 6, 12).rotateY(-angle).translate(Math.cos(angle + 1) * 0.43, 0.39, Math.sin(angle + 1) * 0.43);
    batch.add('brass', handle, place);
  }
  batch.add('ember', new THREE.SphereGeometry(0.37, 18, 5, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.2, 1).translate(0, 0.385, 0), place);
  batch.add(TINT.ash, lathe([[0.385, 0.435], [0.3, 0.41], [0.36, 0.4]], 16), place);
}

const RAHLE = { board: 0.03, length: 0.66, spread: 0.52 } as const;

/** The folding reading stand: two boards crossed like scissors, with the open book lying in the fork. */
function addRahle(batch: GeometryBatch): void {
  const rect = FURNITURE.rahle;
  const place = new THREE.Matrix4().makeTranslation(rect.x, 0.012, rect.z).multiply(new THREE.Matrix4().makeRotationY(0.12));
  const lean = Math.asin(RAHLE.spread / 2 / (RAHLE.length / 2));
  const height = Math.cos(lean) * RAHLE.length;
  for (const side of [-1, 1]) {
    const tilt = new THREE.Matrix4().makeTranslation(0, height / 2, 0).multiply(new THREE.Matrix4().makeRotationX(side * lean));
    const matrix = new THREE.Matrix4().multiplyMatrices(place, tilt);
    batch.add('walnut', metricBox(rect.sizeX, RAHLE.length, RAHLE.board), matrix);
    batch.add('starPanel', metricBox(rect.sizeX - 0.1, RAHLE.length * 0.38, RAHLE.board + 0.006).translate(0, RAHLE.length * 0.26, 0), matrix);
  }
  const bookY = height / 2 + 0.03;
  const openAngle = Math.PI / 2 - lean;
  for (const side of [-1, 1]) {
    const leaf = new THREE.Matrix4()
      .makeTranslation(0, bookY, 0)
      .multiply(new THREE.Matrix4().makeRotationX(-side * openAngle))
      .multiply(new THREE.Matrix4().makeTranslation(0, 0.022, side * 0.115));
    const matrix = new THREE.Matrix4().multiplyMatrices(place, leaf);
    batch.add(TINT.leatherRed, metricBox(0.3, 0.012, 0.215).translate(0, -0.006, 0), matrix);
    batch.add(TINT.paper, metricBox(0.28, 0.026, 0.2).translate(0, 0.013, 0), matrix);
    const page = new THREE.PlaneGeometry(0.2, 0.28).rotateX(-Math.PI / 2).rotateY(Math.PI / 2);
    const uv = page.getAttribute('uv');
    for (let index = 0; index < uv.count; index += 1) uv.setX(index, (uv.getX(index) + (side === 1 ? 1 : 0)) / 2);
    batch.add('bookPages', page.translate(0, 0.0275, 0), matrix);
  }
}

const EWER_BODY: Profile = [
  [0, 0], [0.05, 0], [0.068, 0.012], [0.045, 0.03], [0.095, 0.1], [0.112, 0.17], [0.09, 0.25], [0.042, 0.31],
  [0.034, 0.38], [0.052, 0.42], [0.048, 0.43], [0.02, 0.45], [0.026, 0.475], [0, 0.49],
];

function addEwer(batch: GeometryBatch, place: THREE.Matrix4, material = 'brass'): void {
  batch.add(material, lathe(EWER_BODY, 16), place);
  batch.add(material, tube([[0.09, 0.12, 0], [0.17, 0.2, 0], [0.16, 0.33, 0], [0.2, 0.41, 0]], 0.014), place);
  batch.add(material, tube([[-0.04, 0.4, 0], [-0.15, 0.4, 0], [-0.17, 0.25, 0], [-0.1, 0.16, 0]], 0.011), place);
}

const BOWL: Profile = [[0, 0], [0.035, 0], [0.04, 0.012], [0.075, 0.04], [0.095, 0.075], [0.09, 0.075], [0.07, 0.042], [0, 0.02]];
const JAR: Profile = [[0, 0], [0.06, 0], [0.065, 0.01], [0.11, 0.1], [0.115, 0.17], [0.08, 0.25], [0.05, 0.28], [0.06, 0.31], [0.05, 0.31], [0, 0.27]];

function at(x: number, y: number, z: number, turn = 0, scale = 1): THREE.Matrix4 {
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), turn), new THREE.Vector3(scale, scale, scale));
}

function addFruit(batch: GeometryBatch, x: number, y: number, z: number): void {
  const spots: readonly (readonly [number, number, number, string])[] = [
    [0, 0.03, 0, TINT.fruitRed], [0.062, 0.028, 0.02, TINT.fruitYellow], [-0.05, 0.028, 0.04, TINT.fruitRed], [0.01, 0.028, -0.062, TINT.fruitYellow], [0.02, 0.085, 0, TINT.fruitRed],
  ];
  for (const [dx, dy, dz, material] of spots) {
    batch.add(material, new THREE.SphereGeometry(0.038, 10, 8).translate(x + dx, y + dy + 0.045, z + dz));
  }
}

/** The low table: a six-sided wooden stand carrying a broad brass tray set with a ewer, bowls and fruit. */
function addTrayTable(batch: GeometryBatch): void {
  const rect = FURNITURE.trayTable;
  const standHeight = 0.3;
  const stand = new THREE.CylinderGeometry(0.2, 0.24, standHeight, 6, 1, true);
  const uv = stand.getAttribute('uv');
  for (let index = 0; index < uv.count; index += 1) uv.setXY(index, uv.getX(index) * 1.4, uv.getY(index) * standHeight);
  batch.add('starPanel', stand.translate(rect.x, 0.012 + standHeight / 2, rect.z));
  batch.add('walnut', new THREE.CylinderGeometry(0.22, 0.22, 0.02, 6).translate(rect.x, 0.012 + standHeight, rect.z));
  const top = 0.012 + standHeight + 0.01;
  batch.add('brass', lathe([[0, 0], [0.35, 0], [0.385, 0.02], [0.39, 0.035], [0.375, 0.035], [0.345, 0.014], [0, 0.014]], 32).translate(rect.x, top, rect.z));
  addEwer(batch, at(rect.x - 0.12, top + 0.014, rect.z - 0.1, 0.7));
  batch.add('ceramic', lathe(BOWL, 14), at(rect.x + 0.16, top + 0.014, rect.z - 0.08, 0, 1.25));
  addFruit(batch, rect.x + 0.16, top + 0.014, rect.z - 0.08);
  batch.add('ceramic', lathe(BOWL, 14), at(rect.x + 0.02, top + 0.014, rect.z + 0.2, 0, 0.8));
  batch.add('ceramic', lathe(BOWL, 14), at(rect.x - 0.2, top + 0.014, rect.z + 0.14, 0, 0.8));
}

const CHEST = { height: 0.46, lid: 0.1, strap: 0.045 } as const;

function addChest(batch: GeometryBatch): void {
  const rect = FURNITURE.chest;
  const place = new THREE.Matrix4().makeTranslation(rect.x, 0, rect.z);
  batch.add('walnut', metricBox(rect.sizeX, CHEST.height, rect.sizeZ).translate(0, CHEST.height / 2 + 0.04, 0), place);
  batch.add('starPanel', metricBox(rect.sizeX - 0.16, CHEST.height - 0.14, 0.012).translate(0, CHEST.height / 2 + 0.04, -rect.sizeZ / 2 - 0.004), place);
  const lid = new THREE.CylinderGeometry(rect.sizeZ / 2 + 0.01, rect.sizeZ / 2 + 0.01, rect.sizeX + 0.03, 20).rotateZ(Math.PI / 2);
  batch.add('walnut', lid.scale(1, (CHEST.lid * 2) / rect.sizeZ, 1).translate(0, CHEST.height + 0.04, 0), place);
  for (const x of [-rect.sizeX * 0.32, rect.sizeX * 0.32]) {
    batch.add('iron', metricBox(CHEST.strap, CHEST.height + 0.01, rect.sizeZ + 0.012).translate(x, CHEST.height / 2 + 0.04, 0), place);
    batch.add('iron', metricBox(CHEST.strap + 0.03, 0.04, rect.sizeZ + 0.02).translate(x, 0.02, 0), place);
    batch.add('iron', metricBox(CHEST.strap, 0.012, rect.sizeZ * 0.9).translate(x, CHEST.height + 0.04 + CHEST.lid - 0.004, 0), place);
  }
  batch.add('brass', metricBox(0.09, 0.12, 0.016).translate(0, CHEST.height - 0.02, -rect.sizeZ / 2 - 0.012), place);
}

/** Things left on the lid of the chest: rolled charts and a small brass casket. */
function addChestTop(batch: GeometryBatch): void {
  const rect = FURNITURE.chest;
  const top = CHEST.height + 0.04 + CHEST.lid;
  const rolls: readonly (readonly [number, number, number, number])[] = [[-0.3, 0.02, 0.2, 0.42], [-0.22, -0.07, -0.25, 0.36], [-0.27, -0.02, 0.05, 0.4]];
  rolls.forEach(([dx, dz, turn, length], index) => {
    const roll = new THREE.CylinderGeometry(0.022, 0.022, length, 10).rotateZ(Math.PI / 2).rotateY(turn);
    batch.add(TINT.paper, roll.translate(rect.x + dx, top + 0.012 + (index === 2 ? 0.036 : 0), rect.z + dz));
  });
  batch.add('brass', metricBox(0.2, 0.09, 0.13).rotateY(0.3).translate(rect.x + 0.3, top + 0.035, rect.z));
  batch.add('brass', new THREE.CylinderGeometry(0.065, 0.065, 0.2, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(0.3).translate(rect.x + 0.3, top + 0.08, rect.z));
}

const BOOK_COVERS = [TINT.leatherRed, TINT.leatherGreen, TINT.leatherBrown] as const;

/** A pile of closed books lying flat, each a little askew. */
function addBookPile(batch: GeometryBatch, place: THREE.Matrix4, count: number): void {
  let y = 0;
  for (let index = 0; index < count; index += 1) {
    const thickness = 0.035 + (index % 3) * 0.008;
    const turn = new THREE.Matrix4().makeRotationY((index % 2 === 0 ? 1 : -1) * 0.08 * (index + 1));
    const matrix = new THREE.Matrix4().multiplyMatrices(place, turn);
    const cover = BOOK_COVERS[index % BOOK_COVERS.length] ?? TINT.leatherRed;
    batch.add(cover, metricBox(0.2 - index * 0.012, thickness, 0.28 - index * 0.014).translate(0, y + thickness / 2, 0), matrix);
    batch.add(TINT.paper, metricBox(0.2 - index * 0.012 + 0.002, thickness - 0.012, 0.26 - index * 0.014).translate(0.004, y + thickness / 2, 0), matrix);
    y += thickness;
  }
}

/** The matrix that puts something on the sill or the shelf of a niche; `offset` runs along the wall. */
function inNiche(wall: WallId, id: string, offset: number, onShelf: boolean, turn = 0, scale = 1): THREE.Matrix4 {
  const plan = wallPlan(wall);
  const opening = findOpening(wall, id);
  const height = onShelf ? (nicheShelfHeight(opening) ?? opening.sill) : opening.sill;
  const local = at(opening.centre - plan.length / 2 + offset, height + 0.003, -opening.depth * 0.5, turn, scale);
  return new THREE.Matrix4().multiplyMatrices(wallMatrix(plan), local);
}

function addNicheObjects(batch: GeometryBatch): void {
  addBookPile(batch, inNiche('north', 'niche-north-left', -0.12, false, 0.3), 3);
  batch.add('ceramic', lathe(JAR, 16), inNiche('north', 'niche-north-left', 0.24, false));
  addEwer(batch, inNiche('north', 'niche-north-right', -0.08, false, -0.5, 0.95), 'brass');
  batch.add('ceramic', lathe(BOWL, 14), inNiche('north', 'niche-north-right', 0.24, false, 0, 1.2));
  addBookPile(batch, inNiche('west', 'niche-west', -0.26, false, -0.2), 4);
  batch.add('ceramic', lathe(JAR, 16), inNiche('west', 'niche-west', 0.2, false, 0, 1.25));
  batch.add('brass', lathe(CANDLESTICK), inNiche('west', 'niche-west', -0.28, true, 0, 0.42));
  batch.add('ceramic', lathe(BOWL, 14), inNiche('west', 'niche-west', 0.02, true, 0, 1.5));
  addBookPile(batch, inNiche('west', 'niche-west', 0.32, true, 0.25), 2);
  batch.add('ceramic', lathe(JAR, 16), inNiche('south', 'niche-south', -0.12, false, 0, 1.1));
  batch.add('brass', lathe(BOWL, 14), inNiche('south', 'niche-south', 0.18, false, 0, 1.3));
}

const LAMP_BODY: Profile = [
  [0, 0], [0.05, 0.01], [0.075, 0.05], [0.16, 0.12], [0.19, 0.2], [0.165, 0.29], [0.1, 0.34], [0.09, 0.4], [0.17, 0.5], [0.175, 0.515], [0.08, 0.42],
];
const LAMP_DROP = 1.25;

/** A brass lamp hanging on chains from the boss of the ceiling rosette. */
function addHangingLamp(batch: GeometryBatch): void {
  const top = ROOM_SIZE.height - 0.36;
  const lampTop = top - LAMP_DROP;
  batch.add('brass', new THREE.CylinderGeometry(0.006, 0.006, LAMP_DROP * 0.55, 5).translate(0, top - LAMP_DROP * 0.275, 0));
  batch.add('brass', new THREE.SphereGeometry(0.035, 10, 8).translate(0, top - LAMP_DROP * 0.55, 0));
  for (let chain = 0; chain < 3; chain += 1) {
    const angle = (chain * Math.PI * 2) / 3;
    const from: [number, number, number] = [0, top - LAMP_DROP * 0.55, 0];
    const to: [number, number, number] = [Math.cos(angle) * 0.165, lampTop, Math.sin(angle) * 0.165];
    batch.add('brass', tube([from, to], 0.005));
  }
  batch.add('brass', lathe(LAMP_BODY, 20).translate(0, lampTop - 0.5, 0));
  // Raised bands where the parts of the lamp are joined.
  for (const [radius, lift] of [[0.192, 0.2], [0.094, 0.37], [0.176, 0.507]] as const) {
    batch.add('gilt', new THREE.TorusGeometry(radius, 0.008, 6, 24).rotateX(Math.PI / 2).translate(0, lampTop - 0.5 + lift, 0));
  }
  batch.add('gilt', lathe([[0, 0], [0.03, 0.02], [0.012, 0.05], [0, 0.11]], 8).rotateX(Math.PI).translate(0, lampTop - 0.5, 0));
}

/** Adds every loose object of the room to the batch. */
export function addProps(batch: GeometryBatch): void {
  addCandlestick(batch, FURNITURE.candlestickLeft, 0);
  addCandlestick(batch, FURNITURE.candlestickRight, 0);
  addBrazier(batch);
  addRahle(batch);
  addTrayTable(batch);
  addChest(batch);
  addChestTop(batch);
  addNicheObjects(batch);
  addHangingLamp(batch);
}
