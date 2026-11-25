import { FACE_CENTRE_X } from './headMetrics';

/**
 * Where hair grows on the head scan and how: pure functions of a point of the scan, in the units of the scan.
 * The beard follows the portrait of Mehmed II painted in 1480: a full, trimmed beard that comes to a point at the
 * chin, joined to a moustache, with the lips left free.
 */

export type Vec3 = readonly [number, number, number];

/** How hair grows at one point: how densely (0 to 1), how long and in which direction. */
export interface HairGrowth {
  weight: number;
  length: number;
  direction: Vec3;
}

export type HairShape = (point: Vec3, normal: Vec3) => HairGrowth;

const NONE: HairGrowth = { weight: 0, length: 0, direction: [0, -1, 0] };

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function normalize([x, y, z]: Vec3): Vec3 {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

/** Landmarks of the lower face, read from the scan. */
const MOUTH = { y: 0.45, halfWidth: 0.5, halfHeight: 0.19 } as const;
const NOSE_BASE_Y = 0.97;
const CHIN_Y = -0.45;

/** The upper edge of the beard on the cheek: low beside the mouth, rising to the ear. */
function cheekLine(side: number): number {
  return 0.8 + Math.max(0, side - 0.5) * 0.52;
}

function beardWeight(side: number, y: number, z: number): number {
  const cheek = smoothstep(0, 0.3, cheekLine(side) - y);
  const front = smoothstep(-0.35, 0.25, z);
  const neck = smoothstep(-0.95, -0.6, y);
  // The ear and what lies behind it stay free.
  const beforeEar = smoothstep(1.62, 1.46, side);
  return cheek * front * neck * beforeEar;
}

function moustacheWeight(side: number, y: number): number {
  // Thinner in the groove under the nose, as a moustache is.
  const groove = 0.55 + 0.45 * smoothstep(0.04, 0.2, side);
  return smoothstep(NOSE_BASE_Y, NOSE_BASE_Y - 0.09, y) * smoothstep(0.52, 0.62, y) * smoothstep(0.78, 0.6, side) * groove;
}

/** The lips, and a little of the skin around them, stay free of hair. */
function lipClearance(side: number, y: number): number {
  const distance = Math.hypot(side / MOUTH.halfWidth, (y - MOUTH.y) / MOUTH.halfHeight);
  return smoothstep(0.92, 1.2, distance);
}

/** The beard and the moustache. */
export const beardShape: HairShape = ([x, y, z], normal) => {
  const signed = x - FACE_CENTRE_X;
  const side = Math.abs(signed);
  const moustache = moustacheWeight(side, y);
  const weight = Math.max(beardWeight(side, y, z), moustache) * lipClearance(side, y);
  if (weight < 0.01) return NONE;

  // Longest at the chin, where the beard comes to a point; short on the cheeks and above the lip.
  const chin = smoothstep(0.35, CHIN_Y, y) * smoothstep(1.15, 0.25, side);
  const onLip = y > MOUTH.y + MOUTH.halfHeight * 0.6 ? moustache : 0;
  const length = (0.085 + 0.25 * chin) * (1 - 0.55 * onLip);
  const sideways = Math.sign(signed);
  const direction: Vec3 =
    onLip > 0.5
      ? // Combed down over the lip and a little to the side, not standing out from the face.
        [sideways * 0.38, -0.88, 0.25]
      : [normal[0] * 0.75 - sideways * 0.25 * chin, normal[1] * 0.75 - 0.6, normal[2] * 0.75 + 0.45 * chin];
  return { weight, length, direction: normalize(direction) };
};

const BROW = { y: 2.0, inner: 0.2, outer: 1.2, arch: 0.07, thickness: 0.09 } as const;

/** The eyebrows: a low arch above each eye, thinning towards the temple. */
export const browShape: HairShape = ([x, y, z]) => {
  const signed = x - FACE_CENTRE_X;
  const side = Math.abs(signed);
  const along = (side - BROW.inner) / (BROW.outer - BROW.inner);
  if (along <= 0 || along >= 1 || z < 1) return NONE;
  const centre = BROW.y + BROW.arch * Math.sin(Math.PI * Math.min(1, along * 1.25)) - 0.16 * Math.max(0, along - 0.6);
  const thickness = BROW.thickness * (1 - 0.55 * along);
  const weight = smoothstep(thickness, thickness * 0.35, Math.abs(y - centre)) * smoothstep(0, 0.12, along) * smoothstep(1, 0.8, along);
  if (weight < 0.01) return NONE;
  return { weight, length: 0.05, direction: normalize([Math.sign(signed) * 0.8, 0.25, 0.45]) };
};
