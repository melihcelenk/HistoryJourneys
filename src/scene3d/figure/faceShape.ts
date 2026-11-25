import { FACE_CENTRE_X } from './headMetrics';
import type { Vec3 } from './hairShape';

/**
 * Brings the face of the head scan closer to the portraits of Mehmed II. The portrait of 1480 and the writers of
 * his time agree on one feature above all: a long, arched nose whose tip comes down towards the upper lip. The
 * scan has a short, straight nose; this moves the points of its nose, in the units of the scan.
 */

/** Landmarks of the nose of the scan. */
const NOSE = {
  tip: [FACE_CENTRE_X, 1.1, 2.59],
  /** Height of the middle of the bridge, where the arch is highest. */
  bridgeY: 1.58,
  /** Half-width of the nose and the depth in front of which a point belongs to it. */
  halfWidth: 0.24,
  frontZ: 1.95,
} as const;

/** How far the bridge is raised into an arch and how far the tip is drawn down and forwards. */
const ARCH = { height: 0.15, spread: 0.3 } as const;
const TIP = { down: 0.13, forward: 0.06, reach: 0.34 } as const;

const bell = (distance: number, width: number): number => Math.exp(-((distance / width) ** 2));

/** Where a point of the scan lies on the reshaped face. Points away from the nose stay where they are. */
export function reshapeFace([x, y, z]: Vec3): Vec3 {
  if (z < NOSE.frontZ - 0.25) return [x, y, z];
  const side = x - FACE_CENTRE_X;
  const front = Math.min(1, Math.max(0, (z - (NOSE.frontZ - 0.25)) / 0.25));
  const arch = ARCH.height * bell(y - NOSE.bridgeY, ARCH.spread) * bell(side, NOSE.halfWidth) * front;
  const toTip = Math.hypot(side, y - NOSE.tip[1], z - NOSE.tip[2]);
  const tip = bell(toTip, TIP.reach);
  return [x, y - TIP.down * tip, z + arch + TIP.forward * tip];
}
