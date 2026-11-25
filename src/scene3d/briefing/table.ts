import * as THREE from 'three';
import type { MapBoard } from './mapBoard';
import type { MapPoint } from './mapDefinition';
import { TABLE, mapPointOnTable } from './tableLayout';

/**
 * The map table: a low, wide stand of dark wood, as furniture of an Ottoman room was low. Its sides are panels
 * with pointed arches cut through them, inlaid with a pattern of small light lozenges, and a light band runs
 * around its top. A chart on vellum lies on it, its edges lifting a little; glass pebbles are set on it to show
 * what is being spoken of.
 */
export interface BriefingTable {
  group: THREE.Group;
  /** Sets glass pebbles on the given points of the map and takes the others off. */
  setPebbles(points: readonly MapPoint[]): void;
}

const TOP = { thickness: 0.07, overhang: 0.05, bandWidth: 0.018, bandLift: 0.002 } as const;
const PANEL = { thickness: 0.04, post: 0.09 } as const;
/** The arches cut through a side panel: how many on a long and on a short side, and their shape. */
const ARCHES = { long: 3, short: 2, widthShare: 0.62, footShare: 0.12, springShare: 0.5, riseShare: 0.3 } as const;
/** The vellum: how finely it is divided, how far its edges lift and how far it lies above the table. */
const SHEET = { columns: 40, rows: 26, curl: 0.016, lift: 0.004 } as const;
const PEBBLE = { radius: 0.017, flatten: 0.5, count: 14 } as const;
const INLAY_TILE = 256;

/** Dark walnut with small lozenges of bone set into it, the look of inlaid Ottoman woodwork. */
function createInlayTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = INLAY_TILE;
  canvas.height = INLAY_TILE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A 2D canvas is needed to draw the inlay of the table.');
  context.fillStyle = '#4a2c17';
  context.fillRect(0, 0, INLAY_TILE, INLAY_TILE);
  // Grain of the wood.
  for (let y = 0; y < INLAY_TILE; y += 3) {
    context.fillStyle = `rgba(20, 10, 4, ${0.08 + 0.1 * Math.abs(Math.sin(y * 0.37) * Math.sin(y * 0.11))})`;
    context.fillRect(0, y, INLAY_TILE, 2);
  }
  const step = INLAY_TILE / 4;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const x = (column + 0.5) * step + (row % 2 === 0 ? 0 : step / 2);
      const y = (row + 0.5) * step;
      for (const wrap of [0, -INLAY_TILE]) {
        context.fillStyle = (row + column) % 2 === 0 ? '#e9dcc0' : '#b98a3e';
        context.beginPath();
        context.moveTo(x + wrap, y - 13);
        context.lineTo(x + wrap + 9, y);
        context.lineTo(x + wrap, y + 13);
        context.lineTo(x + wrap - 9, y);
        context.closePath();
        context.fill();
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** One side of the table: a board with pointed arches cut through it, standing on the floor. */
function createPanelGeometry(length: number, height: number, arches: number): THREE.ExtrudeGeometry {
  const board = new THREE.Shape();
  board.moveTo(-length / 2, 0);
  board.lineTo(length / 2, 0);
  board.lineTo(length / 2, height);
  board.lineTo(-length / 2, height);
  board.closePath();
  const bay = length / arches;
  const half = (bay * ARCHES.widthShare) / 2;
  const foot = height * ARCHES.footShare;
  const spring = height * ARCHES.springShare;
  const peak = spring + height * ARCHES.riseShare;
  for (let i = 0; i < arches; i += 1) {
    const centre = -length / 2 + bay * (i + 0.5);
    const arch = new THREE.Path();
    arch.moveTo(centre - half, foot);
    arch.lineTo(centre + half, foot);
    arch.lineTo(centre + half, spring);
    arch.quadraticCurveTo(centre + half, peak - (peak - spring) * 0.35, centre, peak);
    arch.quadraticCurveTo(centre - half, peak - (peak - spring) * 0.35, centre - half, spring);
    arch.closePath();
    board.holes.push(arch);
  }
  const geometry = new THREE.ExtrudeGeometry(board, { depth: PANEL.thickness, bevelEnabled: false, curveSegments: 10 });
  geometry.translate(0, 0, -PANEL.thickness / 2);
  return geometry;
}

function box(size: readonly [number, number, number], at: readonly [number, number, number], material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...at);
  return mesh;
}

function createStand(inlaid: THREE.Material, wood: THREE.Material, bone: THREE.Material): THREE.Group {
  const stand = new THREE.Group();
  const bodyHeight = TABLE.height - TOP.thickness;
  const bodyWidth = TABLE.width - 2 * TOP.overhang;
  const bodyDepth = TABLE.depth - 2 * TOP.overhang;
  for (const side of [-1, 1]) {
    const long = new THREE.Mesh(createPanelGeometry(bodyWidth, bodyHeight, ARCHES.long), inlaid);
    long.position.set(0, 0, (side * bodyDepth) / 2);
    const short = new THREE.Mesh(createPanelGeometry(bodyDepth, bodyHeight, ARCHES.short), inlaid);
    short.rotation.y = Math.PI / 2;
    short.position.set((side * bodyWidth) / 2, 0, 0);
    stand.add(long, short);
    for (const sideZ of [-1, 1]) stand.add(box([PANEL.post, bodyHeight, PANEL.post], [(side * bodyWidth) / 2, bodyHeight / 2, (sideZ * bodyDepth) / 2], wood));
  }
  stand.add(box([TABLE.width, TOP.thickness, TABLE.depth], [0, TABLE.height - TOP.thickness / 2, 0], wood));
  // A band of bone set into the top, a hand's breadth in from its edge.
  const bandY = TABLE.height + TOP.bandLift / 2;
  const inset = 0.03;
  for (const side of [-1, 1]) {
    stand.add(box([TABLE.width - 2 * inset, TOP.bandLift, TOP.bandWidth], [0, bandY, side * (TABLE.depth / 2 - inset - TOP.bandWidth / 2)], bone));
    stand.add(box([TOP.bandWidth, TOP.bandLift, TABLE.depth - 2 * inset], [side * (TABLE.width / 2 - inset - TOP.bandWidth / 2), bandY, 0], bone));
  }
  return stand;
}

/** The vellum: a sheet that lies flat in its middle and lifts towards its edges, most at its corners. */
function createSheet(board: MapBoard): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(TABLE.mapWidth, TABLE.mapDepth, SHEET.columns, SHEET.rows);
  // Laid flat, with the top of the picture (north) on the far side of the table.
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    const u = Math.abs(position.getX(i)) / (TABLE.mapWidth / 2);
    const v = Math.abs(position.getZ(i)) / (TABLE.mapDepth / 2);
    const wave = 0.5 + 0.5 * Math.sin(position.getX(i) * 9 + position.getZ(i) * 13);
    position.setY(i, SHEET.curl * (u ** 6 + v ** 6 + 2 * (u * v) ** 5) * (0.6 + 0.4 * wave));
  }
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    map: board.texture,
    alphaTest: 0.5,
    roughness: 0.9,
    side: THREE.DoubleSide,
    // The sheet is what the scene is about: a little light of its own keeps it readable in the shade.
    emissive: 0xffffff,
    emissiveMap: board.texture,
    emissiveIntensity: 0.05,
  });
  const sheet = new THREE.Mesh(geometry, material);
  sheet.position.y = TABLE.height + SHEET.lift;
  sheet.receiveShadow = true;
  return sheet;
}

/** Builds the table with the map on it, standing where the layout says. */
export function createBriefingTable(board: MapBoard): BriefingTable {
  const inlayTexture = createInlayTexture();
  inlayTexture.repeat.set(4, 4);
  const inlaid = new THREE.MeshStandardMaterial({ map: inlayTexture, roughness: 0.55 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x3e2413, roughness: 0.5 });
  const bone = new THREE.MeshStandardMaterial({ color: 0xb9a57a, roughness: 0.45 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x1f4fb0, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, emissive: 0x0a2a70, emissiveIntensity: 0.35 });

  const group = new THREE.Group();
  const stand = createStand(inlaid, wood, bone);
  stand.traverse((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });
  group.add(stand, createSheet(board));
  group.position.set(TABLE.x, 0, TABLE.z);

  const pebbleGeometry = new THREE.SphereGeometry(PEBBLE.radius, 18, 12);
  pebbleGeometry.scale(1, PEBBLE.flatten, 1);
  const pebbles = Array.from({ length: PEBBLE.count }, () => {
    const pebble = new THREE.Mesh(pebbleGeometry, glass);
    pebble.visible = false;
    pebble.castShadow = true;
    group.add(pebble);
    return pebble;
  });

  function setPebbles(points: readonly MapPoint[]): void {
    pebbles.forEach((pebble, index) => {
      const point = points[index];
      pebble.visible = point !== undefined;
      if (!point) return;
      const [x, y, z] = mapPointOnTable(point);
      // The table is the frame of the pebbles; the layout speaks in the frame of the room.
      pebble.position.set(x - TABLE.x, y + PEBBLE.radius * PEBBLE.flatten, z - TABLE.z);
    });
  }
  return { group, setPebbles };
}
