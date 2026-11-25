import type * as THREE from 'three';
import { EYE_OPENING, FACE_CENTRE_X, SKIN_CUT_Y } from './headMetrics';

export interface HeadShaderOptions {
  /** Review aid: draws a measuring grid in the units of the scan over the head. */
  grid: boolean;
}

const VARYING = 'varying vec3 vHeadPos;\nvarying float vHair;';

const float = (value: number): string => value.toFixed(4);

/** How far the lids are open, 0 (closed) to 1; shared by the skin and the eyes, so that both blink together. */
export const eyeOpen = { value: 1 };

/**
 * GLSL shared by the skin and the eyes: how far a point of the head lies inside the opening between the lids.
 * Positive inside the opening, negative outside; the value is a distance in the units of the scan.
 */
export const EYE_OPENING_GLSL = /* glsl */ `
  uniform float uEyeOpen;
  float eyeLine(float t) { return ${float(EYE_OPENING.y)} + ${float(EYE_OPENING.rise)} * t; }
  float eyeSpan(vec3 p) { return (abs(p.x - (${float(FACE_CENTRE_X)})) - ${float(EYE_OPENING.inner)}) / ${float(EYE_OPENING.outer - EYE_OPENING.inner)}; }
  float eyeOpening(vec3 p) {
    float t = eyeSpan(p);
    if (p.z < 1.0) return -1.0;
    float arch = pow(max(sin(3.14159265 * clamp(t, 0.0, 1.0)), 0.0), 0.7);
    float line = eyeLine(t);
    float vertical = min(line + ${float(EYE_OPENING.up)} * uEyeOpen * arch - p.y, p.y - (line - ${float(EYE_OPENING.down)} * uEyeOpen * arch));
    float horizontal = min(t, 1.0 - t) * ${float(EYE_OPENING.outer - EYE_OPENING.inner)};
    return min(vertical, horizontal);
  }
`;

const GRID_FRAGMENT = /* glsl */ `
  {
    vec3 half_ = abs(fract(vHeadPos * 2.0 + 0.5) - 0.5) / fwidth(vHeadPos * 2.0);
    vec3 unit_ = abs(fract(vHeadPos + 0.5) - 0.5) / fwidth(vHeadPos);
    if (half_.x < 0.6 || half_.y < 0.6) gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.0, 0.9, 1.0), 0.6);
    if (unit_.x < 1.0 || unit_.y < 1.0) gl_FragColor.rgb = vec3(1.0, 1.0, 0.0);
    if (abs(vHeadPos.x) / fwidth(vHeadPos.x) < 1.5 || abs(vHeadPos.y) / fwidth(vHeadPos.y) < 1.5) gl_FragColor.rgb = vec3(1.0, 0.0, 0.0);
  }
`;

/** Darkens the skin along the edges of the lids: the lashes above, the moist rim below. */
const LID_EDGE_FRAGMENT = /* glsl */ `
  {
    float opening = eyeOpening(vHeadPos);
    float t = eyeSpan(vHeadPos);
    if (t > -0.2 && t < 1.2 && vHeadPos.z > 1.0) {
      bool upper = vHeadPos.y > eyeLine(t);
      float rim = smoothstep(upper ? -0.03 : -0.014, 0.0, opening);
      vec3 edge = upper ? vec3(0.05, 0.03, 0.02) : diffuseColor.rgb * vec3(0.82, 0.62, 0.6);
      diffuseColor.rgb = mix(diffuseColor.rgb, edge, rim * (upper ? 0.9 : 0.6));
    }
  }
`;

/** The skin under the beard is dark, so that no bare skin shows between the strands. */
const UNDER_HAIR_FRAGMENT = /* glsl */ `
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.03, 0.022), smoothstep(0.15, 0.75, vHair) * 0.9);
  // The lips of the scan are redder than a man's lips in a portrait of the time; they are toned towards the skin.
  vec2 fromMouth = (vHeadPos.xy - vec2(${float(FACE_CENTRE_X)}, 0.45)) / vec2(0.52, 0.2);
  float lips = (1.0 - smoothstep(0.7, 1.1, length(fromMouth))) * step(1.5, vHeadPos.z);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.4, 0.4, 0.2))) * vec3(1.0, 0.72, 0.62), lips * 0.45);
  // The scan is shaven; what shows of the scalp under the turban, behind the temples, is dark cropped hair.
  float scalp = smoothstep(0.75, 0.35, vHeadPos.z) * smoothstep(0.75, 1.15, vHeadPos.y);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.06, 0.04, 0.03), scalp * 0.9);
`;

/**
 * Extends the skin material of the head scan with what the scan lacks: the eyes of the scan are closed, so the
 * opening between the lids is cut out and its edges are shaded. The geometry must carry the attribute `aHair`,
 * the weight of the hair that grows on each vertex.
 */
export function patchHeadMaterial(material: THREE.Material, options: HeadShaderOptions): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uEyeOpen = eyeOpen;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float aHair;\n${VARYING}`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHeadPos = position;\nvHair = aHair;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${VARYING}\n${EYE_OPENING_GLSL}`)
      .replace('#include <map_fragment>', `#include <map_fragment>\nif (eyeOpening(vHeadPos) > 0.0 || vHeadPos.y < ${float(SKIN_CUT_Y)}) discard;\n${LID_EDGE_FRAGMENT}\n${UNDER_HAIR_FRAGMENT}`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>\n${options.grid ? GRID_FRAGMENT : ''}`);
  };
}
