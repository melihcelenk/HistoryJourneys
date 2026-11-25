import { FACE_CENTRE_X } from './headMetrics';
import { smoothstep, type Vec3 } from './hairShape';

/**
 * Brings the face of the head scan closer to the portraits of Mehmed II. The portrait of 1480 and the writers of
 * his time agree on two features: a long, hooked nose whose tip comes down almost to the upper lip, and a long
 * face. The scan has a short, straight nose and a rounder face; this moves its points, in the units of the scan.
 */

/** Landmarks of the nose of the scan. */
const NOSE = {
  tip: [FACE_CENTRE_X, 1.1, 2.59],
  /** Height of the middle of the bridge, where the arch is highest. */
  bridgeY: 1.58,
  /** The depth in front of which a point belongs to the nose, and the depth over which that sets in. */
  frontZ: 1.7,
  frontFade: 0.25,
} as const;

/** The arch of the bridge: how far it stands out and how far it reaches up and down and to the sides. */
const ARCH = { height: 0.24, reachY: 0.55, reachSide: 0.45 } as const;
/** The hook: how far the tip is drawn down and forwards, and how much of the nose around it follows. */
const TIP = { down: 0.38, forward: 0.14, reach: 0.75 } as const;
/**
 * The long face: everything below the base of the nose is drawn down by a share of its distance from there. The
 * neck stays where it is, because the collar meets it, and so does the back of the head.
 */
const LONG = { from: 1, share: 0.12, neckBottom: -1.4, neckTop: -0.9, backZ: 0.2, frontZ: 1 } as const;

/** A bump that is 1 at its middle and exactly 0 from `reach` on, so that what lies beyond is not moved at all. */
function bump(distance: number, reach: number): number {
  const t = Math.abs(distance) / reach;
  return t >= 1 ? 0 : (1 - t * t) ** 2;
}

/** How far a point is drawn down to make the face long. */
function lengthening(y: number, z: number): number {
  if (y >= LONG.from) return 0;
  return LONG.share * (LONG.from - y) * smoothstep(LONG.neckBottom, LONG.neckTop, y) * smoothstep(LONG.backZ, LONG.frontZ, z);
}

/** Where a point of the scan lies on the reshaped face. Points away from the nose and the lower face stay where they are. */
export function reshapeFace([x, y, z]: Vec3): Vec3 {
  const side = x - FACE_CENTRE_X;
  const onNose = smoothstep(NOSE.frontZ, NOSE.frontZ + NOSE.frontFade, z);
  const arch = ARCH.height * bump(y - NOSE.bridgeY, ARCH.reachY) * bump(side, ARCH.reachSide) * onNose;
  const hook = bump(Math.hypot(side, y - NOSE.tip[1], z - NOSE.tip[2]), TIP.reach);
  return [x, y - TIP.down * hook - lengthening(y, z), z + arch + TIP.forward * hook];
}
