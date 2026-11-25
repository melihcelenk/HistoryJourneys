import * as THREE from 'three';
import type { HairGrowth, HairShape, Vec3 } from './hairShape';

/**
 * Hair drawn as shells: the skin under the hair is copied many times, each copy a little further along the hair,
 * and each copy shows only small dots where a strand passes through it. Seen together the dots are strands.
 */
export interface HairOptions {
  shape: HairShape;
  /** Number of copies of the skin; more copies give smoother strands. */
  layers: number;
  /** Strands per unit of the scan, along each axis. */
  cells: number;
  /** Colour of the hair at the root and at the tip. */
  root: THREE.ColorRepresentation;
  tip: THREE.ColorRepresentation;
  /** How much the hair droops under its weight and how much it gathers towards the middle of the face. */
  droop: number;
  gather: number;
  /** How far the first shell floats above the skin, so that it never fights with it for the same depth. */
  lift?: number;
  /** How much of its cell a strand fills at the root: above a half the strands close into a dense coat. */
  fullness?: number;
  /** The share of the length of the hair, from the root, that is drawn as one mass when seen from afar (0 to 1). */
  core?: number;
}

/** Hair below this weight is not grown. */
const MIN_WEIGHT = 0.03;
const DEFAULT_LIFT = 0.012;
/** A strand is never drawn narrower than about this many pixels; below that it would flicker. */
const MIN_STRAND_PIXELS = 2.2;
/** How much of its cell a strand fills at the root, unless the hair says otherwise. */
const DEFAULT_FULLNESS = 0.5;

interface Growing {
  indices: number[];
  growth: Map<number, HairGrowth>;
}

function readVec3(attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, index: number): Vec3 {
  return [attribute.getX(index), attribute.getY(index), attribute.getZ(index)];
}

/** Finds the triangles of the skin on which hair grows and how it grows at each of their corners. */
function findGrowing(skin: THREE.BufferGeometry, shape: HairShape): Growing {
  const position = skin.getAttribute('position');
  const normal = skin.getAttribute('normal');
  const index = skin.getIndex();
  if (!index) throw new Error('The skin under the hair must be an indexed geometry.');
  const growth = new Map<number, HairGrowth>();
  const grow = (vertex: number): HairGrowth => {
    let found = growth.get(vertex);
    if (!found) {
      found = shape(readVec3(position, vertex), readVec3(normal, vertex));
      growth.set(vertex, found);
    }
    return found;
  };
  const indices: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const corners = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    // Every corner is asked, not only the first one that grows hair: the geometry needs all three.
    const weights = corners.map((corner) => grow(corner).weight);
    if (Math.max(...weights) > MIN_WEIGHT) indices.push(...corners);
  }
  return { indices, growth };
}

/** Weight of hair at each vertex of the skin, for darkening the skin under the hair. */
export function hairWeights(skin: THREE.BufferGeometry, shape: HairShape): Float32Array {
  const position = skin.getAttribute('position');
  const normal = skin.getAttribute('normal');
  const weights = new Float32Array(position.count);
  for (let i = 0; i < position.count; i += 1) weights[i] = shape(readVec3(position, i), readVec3(normal, i)).weight;
  return weights;
}

function buildGeometry(skin: THREE.BufferGeometry, options: HairOptions): THREE.BufferGeometry {
  const { indices, growth } = findGrowing(skin, options.shape);
  const used = [...new Set(indices)];
  const slot = new Map(used.map((vertex, i) => [vertex, i]));
  const skinPosition = skin.getAttribute('position');
  const skinNormal = skin.getAttribute('normal');
  const perLayer = used.length;
  const count = perLayer * options.layers;
  const position = new Float32Array(count * 3);
  const normal = new Float32Array(count * 3);
  const root = new Float32Array(count * 3);
  const shell = new Float32Array(count * 2);
  const index: number[] = [];
  const lift = options.lift ?? DEFAULT_LIFT;

  for (let layer = 0; layer < options.layers; layer += 1) {
    const height = layer / (options.layers - 1);
    used.forEach((vertex, i) => {
      const at = layer * perLayer + i;
      const [x, y, z] = readVec3(skinPosition, vertex);
      const [nx, ny, nz] = readVec3(skinNormal, vertex);
      const hair = growth.get(vertex) as HairGrowth;
      const reach = hair.length * height;
      const [dx, dy, dz] = hair.direction;
      const gather = 1 - options.gather * height * hair.length;
      position[at * 3] = (x + nx * lift + dx * reach) * gather;
      position[at * 3 + 1] = y + ny * lift + dy * reach - options.droop * reach * height;
      position[at * 3 + 2] = z + nz * lift + dz * reach;
      normal.set([nx, ny, nz], at * 3);
      root.set([x, y, z], at * 3);
      shell[at * 2] = height;
      shell[at * 2 + 1] = hair.weight;
    });
    for (const vertex of indices) index.push(layer * perLayer + (slot.get(vertex) as number));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  geometry.setAttribute('aRoot', new THREE.BufferAttribute(root, 3));
  geometry.setAttribute('aShell', new THREE.BufferAttribute(shell, 2));
  geometry.setIndex(index);
  return geometry;
}

/**
 * One level of detail of the strands: a grid of cells over the roots, one strand through each cell. Returns how
 * much of the pixel the strand covers (0 where there is none) and writes the random number of its cell.
 */
const STRAND_FUNCTIONS = /* glsl */ `
  uniform float uFullness;
  uniform float uCore;
  float hairHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float strandCover(vec3 q, float height, float weight, out float pick) {
    vec3 cell = floor(q);
    pick = hairHash(cell);
    // Thinner hair where the weight is low, strands of uneven length, each strand narrowing to its tip.
    if (pick > weight * 1.35) return 0.0;
    if (height > weight * 1.5 * (0.55 + 0.45 * hairHash(cell + 7.9))) return 0.0;
    vec3 jitter = (vec3(hairHash(cell + 1.3), hairHash(cell + 2.7), hairHash(cell + 4.1)) - 0.5) * 0.9;
    float radius = uFullness * (1.0 - 0.75 * height);
    return 1.0 - smoothstep(radius * 0.6, radius, length(fract(q) - 0.5 - jitter));
  }
`;

const STRAND_FRAGMENT = /* glsl */ `
  {
    const float EDGE_FEATHER = 0.55;
    const float STREAK_LENGTH = 0.14;
    // The grid of strands is turned away from the axes, so that its rows never line up with the picture.
    vec3 q = mat3(0.36, 0.48, -0.8, -0.8, 0.6, 0.0, 0.48, 0.64, 0.6) * vRoot * uCells;
    // A strand smaller than a pixel flickers with every small movement. The grid is therefore coarsened with
    // distance, so that a strand always spans a few pixels: from afar the hair is drawn as fewer, thicker locks.
    float pixelsPerStrand = 1.0 / max(length(fwidth(q)), 0.0001);
    float level = log2(max(1.0, ${MIN_STRAND_PIXELS.toFixed(1)} / pixelsPerStrand));
    float fine = exp2(floor(level));
    float pickFine;
    float pickCoarse;
    // The weight of the hair is known only at the corners of the skin's triangles; between them it would end in
    // straight steps. A little noise, strand by strand, feathers the edge of the hair instead.
    float weight = vShell.y + (hairHash(floor(q / fine) + 3.1) - 0.5) * EDGE_FEATHER * (1.0 - vShell.y);
    float coverFine = strandCover(q / fine, vShell.x, weight, pickFine);
    float coverCoarse = strandCover(q / (fine * 2.0), vShell.x, weight, pickCoarse);
    float blend = fract(level);
    float cover = mix(coverFine, coverCoarse, blend);
    // From afar the inner part of dense hair is one mass; only its outer shells still show separate locks.
    cover = mix(cover, 1.0, min(level, 1.0) * step(vShell.x, uCore * weight) * step(0.35, weight));
    if (cover < 0.5) discard;
    float pick = mix(pickFine, pickCoarse, blend);
    // Where the hair is drawn as one mass it still has a grain: long streaks that run the way hair hangs.
    vec3 along = vRoot * uCells / fine * vec3(1.0, STREAK_LENGTH, 1.0);
    float streak = mix(hairHash(floor(along)), hairHash(floor(along * 0.5) + 9.7), 0.4);
    vec3 strand = mix(uRootColour, uTipColour, vShell.x) * (0.75 + 0.5 * pick) * (0.62 + 0.76 * streak);
    diffuseColor.rgb = strand * mix(0.6, 1.0, vShell.x);
  }
`;

/** Builds the hair that grows on `skin` where `options.shape` says so; add the result next to the skin. */
export function createHairShells(skin: THREE.BufferGeometry, options: HairOptions): THREE.Mesh {
  const material = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0, side: THREE.DoubleSide });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCells = { value: options.cells };
    shader.uniforms.uFullness = { value: options.fullness ?? DEFAULT_FULLNESS };
    shader.uniforms.uCore = { value: options.core ?? 0 };
    shader.uniforms.uRootColour = { value: new THREE.Color(options.root) };
    shader.uniforms.uTipColour = { value: new THREE.Color(options.tip) };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aRoot;\nattribute vec2 aShell;\nvarying vec3 vRoot;\nvarying vec2 vShell;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRoot = aRoot;\nvShell = aShell;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vRoot;
        varying vec2 vShell;
        uniform float uCells;
        uniform vec3 uRootColour;
        uniform vec3 uTipColour;
        ${STRAND_FUNCTIONS}`,
      )
      .replace('#include <map_fragment>', `#include <map_fragment>\n${STRAND_FRAGMENT}`);
  };
  const mesh = new THREE.Mesh(buildGeometry(skin, options), material);
  mesh.receiveShadow = true;
  return mesh;
}
