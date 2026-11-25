/** A fixed camera: where it stands, what it looks at and how wide it sees. Distances are in metres. */
export interface Shot {
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  /** Vertical field of view in degrees. */
  fov: number;
}

/** Where the figure stands on the floor, the height of his eyes and the direction he faces (radians around the vertical). */
export const FIGURE_SPOT = { x: 0.35, z: -1.55, eyeHeight: 1.64, facing: 0.12 } as const;

const EYE: readonly [number, number, number] = [FIGURE_SPOT.x, FIGURE_SPOT.eyeHeight, FIGURE_SPOT.z];
/** The middle of the head with its turban. */
const HEAD: readonly [number, number, number] = [FIGURE_SPOT.x, FIGURE_SPOT.eyeHeight + 0.04, FIGURE_SPOT.z];

/**
 * The fixed cameras of the scene. Screenshots for review and the golden images of the visual tests are taken from
 * these, so that two versions of the scene are always compared from the same angle.
 */
export const SHOTS = {
  entrance: { position: [-0.9, 1.62, 4.0], target: [0.3, 1.45, -2.5], fov: 62 },
  hearth: { position: [-1.9, 1.5, 1.4], target: [0.6, 1.5, -4.4], fov: 55 },
  windows: { position: [-3.0, 1.7, 1.6], target: [3.6, 1.7, -1.2], fov: 62 },
  back: { position: [1.6, 1.9, -3.6], target: [-0.8, 1.2, 3.5], fov: 68 },
  ceiling: { position: [-0.4, 1.2, 2.6], target: [0.2, 4.6, -0.6], fov: 70 },
  figure: { position: [FIGURE_SPOT.x - 0.5, 1.45, FIGURE_SPOT.z + 3.3], target: [FIGURE_SPOT.x, 1.0, FIGURE_SPOT.z], fov: 38 },
  'figure-side': { position: [FIGURE_SPOT.x + 3.1, 1.3, FIGURE_SPOT.z + 0.5], target: [FIGURE_SPOT.x, 1.0, FIGURE_SPOT.z], fov: 38 },
  'figure-back': { position: [FIGURE_SPOT.x + 0.9, 1.4, FIGURE_SPOT.z - 2.6], target: [FIGURE_SPOT.x, 1.0, FIGURE_SPOT.z], fov: 38 },
  bust: { position: [FIGURE_SPOT.x - 0.45, 1.5, FIGURE_SPOT.z + 1.35], target: [FIGURE_SPOT.x, 1.42, FIGURE_SPOT.z], fov: 36 },
  portrait: { position: [FIGURE_SPOT.x + 0.2, 1.66, FIGURE_SPOT.z + 1.15], target: [EYE[0], EYE[1] - 0.04, EYE[2]], fov: 30 },
  // Across the map table from the figure: where the camera stands while he tells his plan.
  // It stands a little to the side, so that the table lies left of the middle and the panel with his words fits beside it.
  briefing: { position: [FIGURE_SPOT.x + 0.42, 2.12, FIGURE_SPOT.z + 2.5], target: [FIGURE_SPOT.x + 0.42, 0.8, FIGURE_SPOT.z + 0.52], fov: 56 },
  'head-front': { position: [HEAD[0] + 0.1, HEAD[1], HEAD[2] + 1.05], target: HEAD, fov: 30 },
  'head-close': { position: [EYE[0] + 0.05, EYE[1] + 0.03, EYE[2] + 0.5], target: [EYE[0], EYE[1] + 0.03, EYE[2]], fov: 22 },
  'head-side': { position: [HEAD[0] + 1.05, HEAD[1], HEAD[2] + 0.12], target: HEAD, fov: 30 },
  'head-quarter': { position: [HEAD[0] - 0.7, HEAD[1] + 0.03, HEAD[2] + 0.78], target: HEAD, fov: 30 },
} as const satisfies Record<string, Shot>;

export type ShotName = keyof typeof SHOTS;

export function isShotName(value: string): value is ShotName {
  return Object.hasOwn(SHOTS, value);
}
