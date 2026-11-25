/**
 * Small helpers for building static geometry: turning triangle soups into buffer geometries, placing parts and
 * merging everything that shares a material into one mesh.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { WallPlan } from './layout';
import type { TriangleSoup } from './wallMesher';

/** Turns flat triangle data into a geometry. */
export function soupToGeometry(soup: TriangleSoup): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(soup.positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(soup.normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(soup.uvs, 2));
  return geometry;
}

/** The transform that carries wall-local coordinates (see `wallMesher`) into the room. */
export function wallMatrix(wall: WallPlan): THREE.Matrix4 {
  return new THREE.Matrix4().makeRotationY(wall.rotationY).setPosition(wall.origin[0], 0, wall.origin[1]);
}

/** Name of the material that shows the colour painted on each vertex. */
export const TINTED = 'tinted';

function paint(geometry: THREE.BufferGeometry, colour: string): void {
  const value = new THREE.Color(colour);
  const count = geometry.getAttribute('position').count;
  const colours = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) value.toArray(colours, index * 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
}

/** Collects geometries per material name and merges each pile into a single mesh. */
export class GeometryBatch {
  private readonly piles = new Map<string, THREE.BufferGeometry[]>();

  /**
   * Adds a geometry to the pile of a material; an optional transform is baked into it. A material name that is a
   * colour ("#rrggbb") puts the geometry, painted in that colour, into the shared pile of plain-coloured things.
   */
  add(material: string, geometry: THREE.BufferGeometry, transform?: THREE.Matrix4): void {
    const prepared = geometry.index ? geometry.toNonIndexed() : geometry;
    if (transform) prepared.applyMatrix4(transform);
    for (const name of Object.keys(prepared.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') prepared.deleteAttribute(name);
    }
    const pileName = material.startsWith('#') ? TINTED : material;
    if (pileName === TINTED) paint(prepared, material);
    const pile = this.piles.get(pileName);
    if (pile) pile.push(prepared);
    else this.piles.set(pileName, [prepared]);
  }

  /** Adds a geometry placed by position, rotation (Euler angles) and scale. */
  addAt(material: string, geometry: THREE.BufferGeometry, position: readonly [number, number, number], rotation: readonly [number, number, number] = [0, 0, 0], scale: readonly [number, number, number] = [1, 1, 1]): void {
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      new THREE.Vector3(...scale),
    );
    this.add(material, geometry, matrix);
  }

  /** Names of the materials that have geometry. */
  materials(): string[] {
    return [...this.piles.keys()];
  }

  /** Merges the pile of a material into one geometry; null when the pile is empty. */
  merged(material: string): THREE.BufferGeometry | null {
    const pile = this.piles.get(material);
    if (!pile || pile.length === 0) return null;
    return mergeGeometries(pile, false);
  }
}

export interface MeshOptions {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** Builds one mesh per material of the batch and adds them to the group. */
export function batchToMeshes(batch: GeometryBatch, materials: Readonly<Record<string, THREE.Material>>, group: THREE.Group, options: Readonly<Record<string, MeshOptions>> = {}): void {
  for (const name of batch.materials()) {
    const geometry = batch.merged(name);
    const material = materials[name];
    if (!geometry || !material) throw new Error(`No geometry or material for "${name}".`);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = options[name]?.castShadow ?? true;
    mesh.receiveShadow = options[name]?.receiveShadow ?? true;
    group.add(mesh);
  }
}

/** A box whose texture coordinates are in metres, so that a tiling texture keeps its scale on every face. */
export function metricBox(width: number, height: number, depth: number): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(width, height, depth).toNonIndexed();
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    if (Math.abs(normal.getX(index)) > 0.5) uv.setXY(index, z, y);
    else if (Math.abs(normal.getY(index)) > 0.5) uv.setXY(index, x, z);
    else uv.setXY(index, x, y);
  }
  return geometry;
}
