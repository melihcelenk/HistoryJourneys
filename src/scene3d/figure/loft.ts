import * as THREE from 'three';

/**
 * Geometry helpers for clothes: a garment is a surface drawn through horizontal sections of the body, a sleeve is
 * a tube swept along an arm and a trimming is a band swept along an edge. Distances are in metres; `angle` runs
 * around the body from the front (0) over the figure's left side to the back (π) and on to the front again.
 */

/** One horizontal section of a garment: an oval at a height. */
export interface Section {
  y: number;
  /** Half-width (x) and half-depth (z) of the oval. */
  rx: number;
  rz: number;
  /** How far the oval is moved forwards. */
  cz?: number;
}

export interface LoftOptions {
  /** Columns around the body and rows between two sections. */
  around: number;
  rowsPerSection: number;
  /** Half of the opening at the front, as an angle, at a height given as 0 (top section) to 1 (bottom). */
  opening?: (along: number) => number;
  /** Folds: how far the cloth stands off its smooth shape at an angle and a height (0 to 1). */
  displace?: (angle: number, along: number) => number;
  /** How many times the texture repeats around the body and from top to bottom. */
  repeat: readonly [number, number];
}

export interface Loft {
  geometry: THREE.BufferGeometry;
  /** Number of vertices in one row; the first and the last vertex of a row lie on the edges of the opening. */
  rowLength: number;
  rows: number;
}

/** A smooth curve through values given at equal steps (Catmull-Rom). */
export function through(values: readonly number[], position: number): number {
  const last = values.length - 1;
  const i = Math.min(last - 1, Math.max(0, Math.floor(position)));
  const t = position - i;
  const p0 = values[Math.max(0, i - 1)] as number;
  const p1 = values[i] as number;
  const p2 = values[i + 1] as number;
  const p3 = values[Math.min(last, i + 2)] as number;
  return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
}

function grid(rows: number, rowLength: number): number[] {
  const index: number[] = [];
  for (let i = 0; i < rows - 1; i += 1) {
    for (let j = 0; j < rowLength - 1; j += 1) {
      const a = i * rowLength + j;
      index.push(a, a + rowLength, a + 1, a + 1, a + rowLength, a + rowLength + 1);
    }
  }
  return index;
}

function finish(position: number[], uv: number[], index: number[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

/** A closed surface has a seam where the first and the last column meet; give both the same normal. */
function closeSeam(geometry: THREE.BufferGeometry, rows: number, rowLength: number): void {
  const normal = geometry.getAttribute('normal');
  const sum = new THREE.Vector3();
  for (let i = 0; i < rows; i += 1) {
    const first = i * rowLength;
    const last = first + rowLength - 1;
    sum.set(normal.getX(first) + normal.getX(last), normal.getY(first) + normal.getY(last), normal.getZ(first) + normal.getZ(last)).normalize();
    normal.setXYZ(first, sum.x, sum.y, sum.z);
    normal.setXYZ(last, sum.x, sum.y, sum.z);
  }
}

/** Draws a garment through the sections of a body, from the top section to the bottom one. */
export function loft(sections: readonly Section[], options: LoftOptions): Loft {
  const rows = (sections.length - 1) * options.rowsPerSection + 1;
  const rowLength = options.around + 1;
  const ys = sections.map((section) => section.y);
  const rxs = sections.map((section) => section.rx);
  const rzs = sections.map((section) => section.rz);
  const czs = sections.map((section) => section.cz ?? 0);
  const position: number[] = [];
  const uv: number[] = [];
  for (let i = 0; i < rows; i += 1) {
    const along = i / (rows - 1);
    const at = i / options.rowsPerSection;
    const gap = options.opening?.(along) ?? 0;
    for (let j = 0; j < rowLength; j += 1) {
      const turn = j / options.around;
      const angle = gap + turn * (Math.PI * 2 - 2 * gap);
      const out = options.displace?.(angle, along) ?? 0;
      position.push(Math.sin(angle) * (through(rxs, at) + out), through(ys, at), Math.cos(angle) * (through(rzs, at) + out) + through(czs, at));
      // The top of the texture is at the top of the garment.
      uv.push((angle / (Math.PI * 2)) * options.repeat[0], (1 - along) * options.repeat[1]);
    }
  }
  const geometry = finish(position, uv, grid(rows, rowLength));
  if (!options.opening) closeSeam(geometry, rows, rowLength);
  return { geometry, rowLength, rows };
}

export interface TubeOptions {
  /** Rings along the path and columns around it. */
  rings: number;
  around: number;
  /** Radius at a position along the path (0 to 1) and around it; lets the tube narrow and wrinkle. */
  radius: (along: number, angle: number) => number;
  repeat: readonly [number, number];
}

/** Sweeps a tube along a smooth curve through `points`; used for sleeves and rolls of cloth. */
export function sweepTube(points: readonly THREE.Vector3[], options: TubeOptions): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3([...points], false, 'centripetal');
  const frames = curve.computeFrenetFrames(options.rings, false);
  const rowLength = options.around + 1;
  const position: number[] = [];
  const uv: number[] = [];
  const point = new THREE.Vector3();
  for (let i = 0; i <= options.rings; i += 1) {
    const along = i / options.rings;
    curve.getPointAt(along, point);
    const normal = frames.normals[i] as THREE.Vector3;
    const binormal = frames.binormals[i] as THREE.Vector3;
    for (let j = 0; j < rowLength; j += 1) {
      const angle = (j / options.around) * Math.PI * 2;
      const radius = options.radius(along, angle);
      const c = Math.cos(angle) * radius;
      const s = Math.sin(angle) * radius;
      position.push(point.x + normal.x * c + binormal.x * s, point.y + normal.y * c + binormal.y * s, point.z + normal.z * c + binormal.z * s);
      uv.push((j / options.around) * options.repeat[0], (1 - along) * options.repeat[1]);
    }
  }
  const geometry = finish(position, uv, grid(options.rings + 1, rowLength));
  closeSeam(geometry, options.rings + 1, rowLength);
  return geometry;
}

/** One point of the path of a band: where it is, which way the cloth under it faces and which way the band is wide. */
export interface BandPoint {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  /** Direction across the band, lying on the cloth; the band starts at `position` and extends this way. */
  across: THREE.Vector3;
}

export interface BandOptions {
  /** Width and thickness of the band at a position along the path (0 to 1). */
  width: (along: number) => number;
  thickness: (along: number) => number;
  /** Columns across the band. */
  across: number;
  repeat: readonly [number, number];
}

/** Sweeps a padded band along a path on a garment; used for the fur along the edges of a kaftan. */
export function sweepBand(path: readonly BandPoint[], options: BandOptions): THREE.BufferGeometry {
  const rowLength = options.across + 1;
  const position: number[] = [];
  const uv: number[] = [];
  path.forEach((point, i) => {
    const along = i / (path.length - 1);
    const width = options.width(along);
    const thickness = options.thickness(along);
    for (let j = 0; j < rowLength; j += 1) {
      const turn = j / options.across;
      // The band wraps a little around the edge of the cloth and lies padded on top of it.
      const reach = -0.18 * width + turn * 1.18 * width;
      const lift = Math.sin(Math.PI * turn) ** 0.6 * thickness - 0.004;
      position.push(
        point.position.x + point.across.x * reach + point.normal.x * lift,
        point.position.y + point.across.y * reach + point.normal.y * lift,
        point.position.z + point.across.z * reach + point.normal.z * lift,
      );
      uv.push(turn * options.repeat[0], along * options.repeat[1]);
    }
  });
  return finish(position, uv, grid(path.length, rowLength));
}
