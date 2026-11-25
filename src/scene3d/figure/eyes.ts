import * as THREE from 'three';
import { EYE, EYE_OPENING, EYE_SOCKET, FACE_CENTRE_X } from './headMetrics';
import { EYE_OPENING_GLSL, eyeOpen } from './headShader';

export interface Eyes {
  /** The two balls, in the units and the frame of the head scan; add them to the head. */
  group: THREE.Group;
  /** Turns the eyes towards a point given in the frame of the head scan. */
  lookAt(target: THREE.Vector3): void;
}

/** How far the eyes turn from straight ahead, in radians. */
const MAX_YAW = 0.42;
const MAX_PITCH = 0.3;
const SEGMENTS = 40;

const float = (value: number): string => value.toFixed(4);

const EYE_VERTEX = /* glsl */ `
  vEyeLocal = position;
  vHeadPos = (uToHead * vec4(position, 1.0)).xyz;
`;

/** Paints the white, the iris and the pupil on the ball and the shadow the lids throw on it. */
const EYE_FRAGMENT = /* glsl */ `
  {
    vec3 dir = normalize(vEyeLocal);
    float r = length(dir.xy) * ${float(EYE.radius)};
    float angle = atan(dir.y, dir.x);
    float fibre = eyeNoise(vec2(angle * 14.0, r * 9.0)) * 0.6 + eyeNoise(vec2(angle * 40.0, r * 3.0)) * 0.4;
    vec3 white = mix(vec3(0.78, 0.74, 0.7), vec3(0.62, 0.4, 0.37), smoothstep(0.15, 0.27, r) * 0.6);
    vec3 iris = mix(vec3(0.06, 0.03, 0.015), vec3(0.17, 0.09, 0.035), fibre);
    iris *= mix(1.0, 0.45, smoothstep(${float(EYE.irisRadius * 0.72)}, ${float(EYE.irisRadius)}, r));
    iris = mix(vec3(0.2, 0.11, 0.045), iris, smoothstep(${float(EYE.pupilRadius)}, ${float(EYE.pupilRadius * 1.9)}, r));
    vec3 colour = mix(iris, white, smoothstep(${float(EYE.irisRadius * 0.94)}, ${float(EYE.irisRadius * 1.06)}, r));
    colour = mix(vec3(0.01), colour, smoothstep(${float(EYE.pupilRadius * 0.9)}, ${float(EYE.pupilRadius * 1.1)}, r));
    if (dir.z < 0.0) colour = white;
    // The lids shade the ball: strongly under the upper lid, a little along the lower one and in the corners.
    float opening = eyeOpening(vHeadPos);
    // The ball never shows outside the opening, even where it stands out a little from the lids.
    if (opening < -0.012) discard;
    float t = eyeSpan(vHeadPos);
    float fromUpper = eyeLine(t) + ${float(EYE_OPENING.up)} - vHeadPos.y;
    float shade = smoothstep(0.0, 0.085, fromUpper) * 0.75 + 0.25;
    shade *= (smoothstep(-0.01, 0.05, opening) * 0.55 + 0.45) * 0.8;
    diffuseColor.rgb = (uSocket > 0.5 ? vec3(0.2, 0.07, 0.06) : colour) * shade;
  }
`;

function createEyeMaterial(toHead: { value: THREE.Matrix4 }, socket: boolean): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({ roughness: socket ? 0.7 : 0.45, metalness: 0, specularIntensity: 0.2, clearcoat: socket ? 0 : 0.15, clearcoatRoughness: 0.15, envMapIntensity: 0.05 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uToHead = toHead;
    shader.uniforms.uEyeOpen = eyeOpen;
    shader.uniforms.uSocket = { value: socket ? 1 : 0 };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vEyeLocal;\nvarying vec3 vHeadPos;\nuniform mat4 uToHead;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${EYE_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vEyeLocal;
        varying vec3 vHeadPos;
        uniform float uSocket;
        float eyeHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float eyeNoise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(eyeHash(i), eyeHash(i + vec2(1.0, 0.0)), f.x), mix(eyeHash(i + vec2(0.0, 1.0)), eyeHash(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        ${EYE_OPENING_GLSL}`,
      )
      .replace('#include <map_fragment>', `#include <map_fragment>\n${EYE_FRAGMENT}`);
  };
  return material;
}

/** Builds the two eyes that show through the openings cut into the lids of the scan. */
export function createEyes(): Eyes {
  const geometry = new THREE.SphereGeometry(EYE.radius, SEGMENTS, SEGMENTS);
  // The pole of the sphere would sit in the middle of the pupil; turn it so that the pupil looks along +z.
  geometry.rotateX(Math.PI / 2);
  const group = new THREE.Group();
  const balls = [-1, 1].map((side) => {
    const toHead = { value: new THREE.Matrix4() };
    const ball = new THREE.Mesh(geometry, createEyeMaterial(toHead, false));
    ball.position.set(FACE_CENTRE_X + side * EYE.offsetX, EYE.y, EYE.z);
    ball.updateMatrix();
    toHead.value.copy(ball.matrix);
    const socketToHead = { value: new THREE.Matrix4() };
    const socket = new THREE.Mesh(geometry, createEyeMaterial(socketToHead, true));
    socket.position.set(ball.position.x, EYE.y, EYE_SOCKET.z);
    socket.scale.set(EYE_SOCKET.radiusX / EYE.radius, EYE_SOCKET.radiusY / EYE.radius, EYE_SOCKET.radiusZ / EYE.radius);
    socket.updateMatrix();
    socketToHead.value.copy(socket.matrix);
    group.add(ball, socket);
    return { ball, toHead };
  });

  const direction = new THREE.Vector3();
  function lookAt(target: THREE.Vector3): void {
    for (const { ball, toHead } of balls) {
      direction.copy(target).sub(ball.position);
      const yaw = THREE.MathUtils.clamp(Math.atan2(direction.x, direction.z), -MAX_YAW, MAX_YAW);
      const pitch = THREE.MathUtils.clamp(Math.atan2(direction.y, Math.hypot(direction.x, direction.z)), -MAX_PITCH, MAX_PITCH);
      ball.rotation.set(-pitch, yaw, 0, 'YXZ');
      ball.updateMatrix();
      toHead.value.copy(ball.matrix);
    }
  }
  return { group, lookAt };
}
