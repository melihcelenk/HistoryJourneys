/**
 * Measurements of the head scan, in the units of the scan (one unit is about 5 cm; x to the figure's left, y up,
 * z out of the face). They were read from the scan with a measuring grid and are what every part that sits on the
 * head (eyes, beard, turban) is placed with.
 */

/** Metres per unit of the scan: the head is 4.5 units from chin to crown. */
export const HEAD_SCALE = 0.056;

/** The scan is not centred: the middle of the face lies slightly to one side. */
export const FACE_CENTRE_X = -0.09;

export const EYE = {
  /** Distance of the centre of each eye from the middle of the face. */
  offsetX: 0.6,
  y: 1.655,
  /** Centre of the ball of the eye; its front lies just behind the closed lid of the scan. */
  z: 1.655,
  radius: 0.27,
  /** Radius of the iris and of the pupil on the surface of the ball. */
  irisRadius: 0.118,
  pupilRadius: 0.042,
} as const;

/** The opening between the lids, cut out of the closed lid of the scan. */
export const EYE_OPENING = {
  /** Inner and outer corner, as distances from the middle of the face. */
  inner: 0.34,
  outer: 0.89,
  /** How far the upper and the lower lid open from the line on which they meet. */
  up: 0.088,
  down: 0.05,
  /** Height of the line between the corners at the inner corner and how much it rises towards the outer one. */
  y: 1.64,
  rise: 0.02,
} as const;

/** A dark hollow behind each ball, seen in the corners of the eye where the ball does not reach. */
export const EYE_SOCKET = { z: 1.5, radiusX: 0.42, radiusY: 0.26, radiusZ: 0.2 } as const;

/** Height of the eyes above the origin of the scan, in metres. */
export const EYE_HEIGHT_IN_SCAN = EYE.y * HEAD_SCALE;

/** The scan includes the shoulders; below this height the clothes take over and the skin is not drawn. */
export const SKIN_CUT_Y = -1.45;
