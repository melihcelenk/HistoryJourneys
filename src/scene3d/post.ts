import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/**
 * What is done to the picture after the scene is drawn: bright light blooms a little, the corners darken and the
 * colours are graded warm, the way a game presents an interior.
 */
export interface Picture {
  render(): void;
  setSize(width: number, height: number): void;
}

const BLOOM = { strength: 0.16, radius: 0.6, threshold: 1.0 } as const;
/** Samples per pixel of the picture the scene is drawn into, for smooth edges. */
const SAMPLES = 2;
/** The glow of bright light is soft anyway; it is computed at this share of the size of the picture. */
const BLOOM_SCALE = 0.5;

const GRADE_SHADER = {
  uniforms: { tDiffuse: { value: null }, uVignette: { value: 0.42 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uVignette;
    varying vec2 vUv;
    void main() {
      vec4 colour = texture2D(tDiffuse, vUv);
      // Warm highlights, slightly cool shadows.
      float light = dot(colour.rgb, vec3(0.2126, 0.7152, 0.0722));
      colour.rgb *= mix(vec3(0.96, 0.99, 1.05), vec3(1.05, 1.0, 0.94), smoothstep(0.0, 0.8, light));
      vec2 fromCentre = vUv - 0.5;
      colour.rgb *= 1.0 - uVignette * smoothstep(0.25, 0.95, dot(fromCentre, fromCentre) * 2.0);
      gl_FragColor = colour;
    }
  `,
};

/** Builds the chain of steps that turns the drawn scene into the final picture. */
export function createPicture(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, quality: 'low' | 'high'): Picture {
  if (quality === 'low') {
    return { render: () => renderer.render(scene, camera), setSize: () => undefined };
  }
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: SAMPLES });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(size.clone().multiplyScalar(BLOOM_SCALE), BLOOM.strength, BLOOM.radius, BLOOM.threshold));
  composer.addPass(new ShaderPass(GRADE_SHADER));
  composer.addPass(new OutputPass());
  return {
    render: () => composer.render(),
    setSize: (width, height) => {
      // The picture follows the fineness the renderer draws at, which the scene may lower on a weak graphics card.
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(width, height);
    },
  };
}
