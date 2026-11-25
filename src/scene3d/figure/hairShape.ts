import { FACE_CENTRE_X } from './headMetrics';

/**
 * Where hair grows on the head scan and how: pure functions of a point of the scan, in the units of the scan.
 * The beard follows the portrait of Mehmed II painted in 1480: trimmed close on the jaw, long and pointed at the
 * chin, joined to a moustache, with the lips and the cheeks left free and a narrow sideburn in front of the ear.
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

/**
 * Landmarks of the lower face, on the scan as it was scanned. The face is reshaped afterwards (faceShape.ts), and
 * the hair moves with the skin it grows on; deciding the growth here keeps it off the nose, which the reshaping
 * brings down to the height of the lip.
 */
const MOUTH = { y: 0.45, halfWidth: 0.44, halfHeight: 0.15 } as const;
const CHIN_Y = -0.45;

/**
 * The upper edge of the beard, seen in profile (z runs from the ear to the front of the face). In the portrait
 * it leaves the sideburn high in front of the ear, falls steeply at first and then runs gently along the jaw to
 * the corner of the mouth, so that the cheek stays bare.
 */
const EDGE = { atMouth: 0.63, rise: 0.85, flatFromZ: 1.7, span: 0.75, soft: 0.12 } as const;
/** The sideburn: a narrow strip in front of the ear, from the jaw up into the hair under the turban. */
const SIDEBURN = { backZ: 0.5, frontZ: 0.95, soft: 0.07, topY: 2.3 } as const;

/** The back edge of the beard: below this height it moves forwards by this much for each unit it goes down. */
const BACK_EDGE = { fromY: 0.6, slant: 0.45 } as const;

function beardEdge(z: number): number {
  const t = Math.min(1, Math.max(0, (EDGE.flatFromZ - z) / EDGE.span));
  return EDGE.atMouth + EDGE.rise * t * t;
}

function sideburn(y: number, z: number): number {
  const behind = smoothstep(SIDEBURN.backZ - SIDEBURN.soft, SIDEBURN.backZ + SIDEBURN.soft, z);
  const before = smoothstep(SIDEBURN.frontZ + SIDEBURN.soft, SIDEBURN.frontZ - SIDEBURN.soft, z);
  return behind * before * smoothstep(SIDEBURN.topY, SIDEBURN.topY - 0.2, y);
}

/**
 * How far back the beard reaches. Its back edge starts at the ear and slants forwards as it goes down, as in the
 * portrait, so that the neck under the ear stays bare.
 */
function backLimit(y: number, z: number): number {
  const back = SIDEBURN.backZ + Math.max(0, BACK_EDGE.fromY - y) * BACK_EDGE.slant;
  return smoothstep(back - SIDEBURN.soft, back + SIDEBURN.soft, z);
}

function beardWeight(y: number, z: number): number {
  const underEdge = smoothstep(0, EDGE.soft, beardEdge(z) - y);
  const neck = smoothstep(-0.9, -0.62, y);
  return Math.max(underEdge, sideburn(y, z)) * backLimit(y, z) * neck;
}

/**
 * The moustache of the portrait: a thin line on the upper lip whose ends fall in a curve past the corners of the
 * mouth, where they run into the beard. It lies under the hooked nose and never on it.
 */
const MOUSTACHE = { centreY: 0.76, fall: 0.45, halfThickness: 0.085, reach: 0.78, length: 0.045 } as const;
/** A surface that faces down this much is the underside of the nose, not the lip. */
const FACING_DOWN = -0.45;

/** Height of the middle of the moustache at a distance from the middle of the face. */
function moustacheLine(side: number): number {
  return MOUSTACHE.centreY - MOUSTACHE.fall * side * side;
}

function moustacheWeight(side: number, y: number, normal: Vec3): number {
  if (normal[1] < FACING_DOWN) return 0;
  const onLine = smoothstep(MOUSTACHE.halfThickness, MOUSTACHE.halfThickness * 0.45, Math.abs(y - moustacheLine(side)));
  const beforeEnd = smoothstep(MOUSTACHE.reach, MOUSTACHE.reach - 0.15, side);
  // Thinner in the groove under the nose, as a moustache is.
  const groove = 0.55 + 0.45 * smoothstep(0.04, 0.2, side);
  return onLine * beforeEnd * groove;
}

/** The lips, and a little of the skin around them, stay free of hair; the corners of the mouth do not. */
function lipClearance(side: number, y: number): number {
  const distance = Math.hypot(side / MOUTH.halfWidth, (y - MOUTH.y) / MOUTH.halfHeight);
  return smoothstep(0.95, 1.1, distance);
}

/** How long the hair is: trimmed short on the jaw and the cheek, long at the chin, where it comes to a point. */
const LENGTH = { trimmed: 0.08, point: 0.6 } as const;
/** The point of the beard: how far to the side of the chin it still reaches. */
const POINT_HALF_WIDTH = 0.65;

/** The beard and the moustache. */
export const beardShape: HairShape = ([x, y, z], normal) => {
  const signed = x - FACE_CENTRE_X;
  const side = Math.abs(signed);
  const moustache = moustacheWeight(side, y, normal);
  const weight = Math.max(beardWeight(y, z), moustache) * lipClearance(side, y);
  if (weight < 0.01) return NONE;

  const chin = smoothstep(0.3, CHIN_Y, y) * smoothstep(POINT_HALF_WIDTH, 0.1, side);
  const length = (LENGTH.trimmed + LENGTH.point * chin) * (1 - moustache) + MOUSTACHE.length * moustache;
  const sideways = Math.sign(signed);
  const direction: Vec3 =
    moustache > 0.5
      ? // Combed down along the lip and out towards the corner of the mouth, lying flat against the face.
        [sideways * 0.5, -0.82, 0.25]
      : // At the chin the hair is drawn together and well forwards: the point of the beard juts out more than it hangs.
        [normal[0] * 0.5 - sideways * 0.3 * chin, normal[1] * 0.5 - 0.55, normal[2] * 0.5 + chin];
  return { weight, length, direction: normalize(direction) };
};

const BROW = { y: 2.0, inner: 0.2, outer: 1.2, arch: 0.07, thickness: 0.06 } as const;

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
