/** Shapes of stuffed things: cushions, mattresses and bolsters. */
import * as THREE from 'three';

const CUSHION_SEGMENTS = 14;

/** How strongly a cushion swells: sharpness of its edge and how far the corners are pulled in. */
export interface CushionShape {
  /** Higher values give a flatter top and a quicker fall towards the seam. */
  edge: number;
  /** Share of the size by which the middle of each side is pulled in, as on a stuffed pillow. */
  pinch: number;
}

const PILLOW: CushionShape = { edge: 2.2, pinch: 0.045 };

function swell(u: number, v: number, edge: number): number {
  const profile = (t: number): number => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), edge * 1.6)), 1 / edge);
  return profile(u) * profile(v);
}

function cushionHalf(width: number, thickness: number, depth: number, shape: CushionShape, side: 1 | -1, uvMetres: number): THREE.BufferGeometry {
  const plane = new THREE.PlaneGeometry(1, 1, CUSHION_SEGMENTS, CUSHION_SEGMENTS).rotateX(-Math.PI / 2);
  const position = plane.getAttribute('position');
  const uv = plane.getAttribute('uv');
  for (let index = 0; index < position.count; index += 1) {
    const u = position.getX(index) * 2;
    const v = position.getZ(index) * 2;
    const x = ((u * width) / 2) * (1 - shape.pinch * (1 - v * v) * u * u);
    const z = ((v * depth) / 2) * (1 - shape.pinch * (1 - u * u) * v * v);
    position.setXYZ(index, x, side * (thickness / 2) * swell(u, v, shape.edge), z);
    uv.setXY(index, (x + width / 2) / uvMetres, (side * z + depth / 2) / uvMetres);
  }
  plane.computeVertexNormals();
  return plane;
}

/**
 * A stuffed cushion lying flat, centred on the origin: `width` along x, `depth` along z, `thickness` at its
 * middle. The cloth pattern repeats every `uvMetres`.
 */
export function cushionGeometry(width: number, thickness: number, depth: number, uvMetres: number, shape: CushionShape = PILLOW): THREE.BufferGeometry[] {
  const top = cushionHalf(width, thickness, depth, shape, 1, uvMetres);
  const bottom = cushionHalf(width, thickness, depth, shape, -1, uvMetres);
  // The lower half is the same sheet bent downwards, so its triangles have to be turned to face down.
  const index = bottom.getIndex();
  if (index) {
    for (let triangle = 0; triangle < index.count; triangle += 3) {
      const second = index.getX(triangle + 1);
      index.setX(triangle + 1, index.getX(triangle + 2));
      index.setX(triangle + 2, second);
    }
  }
  bottom.computeVertexNormals();
  return [top, bottom];
}

/** A mattress: a cushion with a flat top and a firm, nearly square edge. */
export const MATTRESS: CushionShape = { edge: 5, pinch: 0.01 };

const BOLSTER_PROFILE: readonly [number, number][] = [
  [0, -0.5],
  [0.05, -0.497],
  [0.07, -0.47],
  [0.035, -0.455],
  [0.09, -0.44],
  [0.44, -0.4],
  [0.5, -0.3],
  [0.5, 0.3],
  [0.44, 0.4],
  [0.09, 0.44],
  [0.035, 0.455],
  [0.07, 0.47],
  [0.05, 0.497],
  [0, 0.5],
];

/** A round bolster lying along the x axis, gathered and tasselled at both ends. */
export function bolsterGeometry(length: number, diameter: number, uvMetres: number): THREE.BufferGeometry {
  const points = BOLSTER_PROFILE.map(([radius, along]) => new THREE.Vector2(radius * diameter, along * length));
  const lathe = new THREE.LatheGeometry(points, 16);
  const uv = lathe.getAttribute('uv');
  for (let index = 0; index < uv.count; index += 1) {
    uv.setXY(index, (uv.getX(index) * Math.PI * diameter) / uvMetres, (uv.getY(index) * length) / uvMetres);
  }
  return lathe.rotateZ(Math.PI / 2);
}
