import { FACE_CENTRE_X } from './headMetrics';
import { smoothstep, type Vec3 } from './hairShape';

/**
 * The lower jaw of the head scan. The scan has no skeleton; to let the figure speak, the points of its lower jaw
 * are moved down by a share of the opening of the mouth. This tells that share for each point of the scan as it
 * was scanned, in the units of the scan: 1 at the chin and the lower lip, falling to 0 towards the hinge of the
 * jaw in front of the ear, and 0 on the upper lip, the neck and everything above and behind.
 */

/** The line where the lips meet, and how far below it the lower lip takes up the full movement. */
const LIPS = { seamY: 0.475, fullY: 0.425 } as const;
/** The jaw hinges in front of the ear: nothing moves behind `hingeZ`, everything in front of `frontZ`. */
const HINGE = { hingeZ: 0.6, frontZ: 1.7 } as const;
/** Below the chin the movement fades out, so that the neck stays in the collar. */
const NECK = { stillY: -1.2, movingY: -0.7 } as const;
/** Far out on the cheek the skin is held by the cheekbone and moves less. */
const CHEEK = { stillSide: 1.7, movingSide: 0.6 } as const;

/** How far a point of the scan follows the lower jaw, from 0 (not at all) to 1 (fully). */
export function jawWeight([x, y, z]: Vec3): number {
  const belowLips = smoothstep(LIPS.seamY, LIPS.fullY, y);
  if (belowLips === 0) return 0;
  const fromHinge = smoothstep(HINGE.hingeZ, HINGE.frontZ, z);
  const aboveNeck = smoothstep(NECK.stillY, NECK.movingY, y);
  const onCheek = smoothstep(CHEEK.stillSide, CHEEK.movingSide, Math.abs(x - FACE_CENTRE_X));
  return belowLips * fromHinge * aboveNeck * onCheek;
}

/** How far the chin drops when the mouth is fully open, in the units of the scan (about seven millimetres). */
export const JAW_DROP = 0.13;
/** Name of the attribute that carries the share of each point, on the skin and on the hair that grows on it. */
export const JAW_ATTRIBUTE = 'aJaw';
/** How far the mouth is open, 0 (shut) to 1; shared by the skin and the beard, so that both move together. */
export const mouthOpen = { value: 0 };

/** GLSL for a vertex shader: declares the attribute and the uniform, and moves a point with the jaw. */
export const JAW_GLSL = {
  declare: /* glsl */ `attribute float ${JAW_ATTRIBUTE};\nuniform float uMouthOpen;`,
  // The chin swings down and a little back, as a jaw does around its hinge.
  move: /* glsl */ `transformed.y -= uMouthOpen * ${JAW_DROP.toFixed(3)} * ${JAW_ATTRIBUTE};\ntransformed.z -= uMouthOpen * ${(JAW_DROP * 0.3).toFixed(3)} * ${JAW_ATTRIBUTE};`,
} as const;
