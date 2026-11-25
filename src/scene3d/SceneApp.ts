import * as THREE from 'three';
import { measureAmbience } from './audio/ambience';
import { createSoundStage, type SoundStage } from './audio/soundStage';
import { createBriefingSession, type BriefingSession } from './briefing/briefingSession';
import type { Script } from './briefing/mapDefinition';
import { tableBox } from './briefing/tableLayout';
import { buildCharacter, type Character } from './character';
import { createWalkControls, type WalkControls } from './controls';
import { RESOLUTION_LIMITS, createFrameMeter, nextPixelRatio } from './dynamicResolution';
import { createHud, type Hud } from './hud';
import { createPicture } from './post';
import { ROOM_SIZE, buildRoom, type Room } from './room';
import { FURNITURE } from './room/layout';
import { loadSceneContent } from './sceneContent';
import { FIGURE_SPOT, SHOTS, type Shot, type ShotName } from './shots';
import { boxAround, type WalkSpace } from './walk';

export interface SceneOptions {
  /** A fixed camera to render one still frame from; null starts the game. */
  shot: ShotName | null;
  /** The moment, in seconds, at which a still frame is rendered. */
  time: number;
  /** The step of the briefing a still frame shows; null shows the scene without the briefing running. */
  step: number | null;
  /** The script the map on the table is written in when the scene opens. */
  script: Script;
  quality: 'low' | 'high';
  /** Review aid: build only one part of the scene ("figure" or "room"). */
  only: string | null;
}

/** What the tests read from the page: how much the renderer had to draw for one frame and where the player is. */
export interface SceneInfo {
  calls: number;
  triangles: number;
  player: { x: number; z: number };
  /** How finely the picture is drawn, as a share of the pixels of the page. */
  pixelRatio: number;
}

const FRAMES_BEFORE_READY = 3;
/** Height of the player's eyes and half the width of the player, in metres. */
const PLAYER = { eyeHeight: 1.62, radius: 0.3 } as const;
/** Where the player enters: just inside the door, looking into the room. */
const START = { x: -0.9, z: 3.6, yaw: -0.2 } as const;
/** Room the figure takes on the floor and how near the player must come to meet him. */
const FIGURE_HALF_SIZE = 0.42;
const MEETING_DISTANCE = 2.3;
/** The room is reflected in shiny things from about eye height in its middle. */
const REFLECTION_POINT = new THREE.Vector3(0, 1.6, 0);
const REFLECTION_BLUR = 0.03;
const LOADING = 'Saray odası hazırlanıyor…';
/** Where the fire burns: the sound of the room comes from here. */
const HEARTH = FURNITURE.hearthSlab;
const LOW_QUALITY_PIXEL_RATIO = 0.6;
/** The speed of frames is read over this many frames at a time, after the frames of loading. */
const FRAME_METER = { window: 45, skip: 90 } as const;
/** A screen with very fine pixels is not drawn at its full fineness: the cost grows with the square of it. */
const MAX_PIXEL_RATIO = 1.5;
/** How quickly the gaze of the figure moves to a new target; larger is quicker. */
const GAZE_SPEED = 4;
const NOTICE = 'Bu cihazda üç boyutlu sahne açılamadı. Harita ve kartlar çalışmaya devam ediyor.';

/** Plain light for looking at the figure alone, without the room. */
function studioLights(): THREE.Group {
  const group = new THREE.Group();
  group.add(new THREE.HemisphereLight(0xdfe8ff, 0x6b5440, 0.9));
  const key = new THREE.DirectionalLight(0xffe2b8, 3.2);
  key.position.set(5, 5, 2);
  group.add(key);
  return group;
}

function createRenderer(root: HTMLElement, still: boolean, quality: SceneOptions['quality']): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: still, powerPreference: 'high-performance' });
  // Low quality draws fewer pixels: that is what a weak device, and a test browser without a graphics card, lack most.
  renderer.setPixelRatio(quality === 'low' ? LOW_QUALITY_PIXEL_RATIO : still ? 1 : Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setSize(root.clientWidth, root.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  // One frame is drawn in several steps; the counts of all of them are added up and reset once per frame.
  renderer.info.autoReset = false;
  root.append(renderer.domElement);
  return renderer;
}

/** Covers the page while the room and the figure are being built; a game does not show a half-built scene. */
function showLoading(root: HTMLElement): HTMLElement {
  const veil = document.createElement('p');
  veil.className = 'scene-loading';
  veil.dataset.testid = 'scene-loading';
  veil.textContent = LOADING;
  root.append(veil);
  return veil;
}

function showNotice(root: HTMLElement, reason: unknown): void {
  console.error('The 3D scene could not start.', reason);
  const notice = document.createElement('p');
  notice.className = 'scene-notice';
  notice.dataset.testid = 'scene-notice';
  notice.textContent = NOTICE;
  root.append(notice);
  document.documentElement.dataset.sceneReady = 'failed';
}

function placeCamera(camera: THREE.PerspectiveCamera, shot: Shot): void {
  camera.position.set(...shot.position);
  camera.fov = shot.fov;
  camera.lookAt(...shot.target);
  camera.updateProjectionMatrix();
}

interface Parts {
  room: Room | null;
  character: Character | null;
}

async function buildParts(scene: THREE.Scene, renderer: THREE.WebGLRenderer, options: SceneOptions): Promise<Parts> {
  let room: Room | null = null;
  let character: Character | null = null;
  if (options.only === 'figure') scene.add(studioLights());
  else {
    room = await buildRoom({ renderer, quality: options.quality });
    scene.add(room.group);
    // What shines (silk, gold thread, brass, glazed tiles) reflects the room itself.
    const reflections = new THREE.PMREMGenerator(renderer);
    scene.environment = reflections.fromScene(scene, REFLECTION_BLUR, 0.1, 40, { position: REFLECTION_POINT }).texture;
    scene.environmentIntensity = 0.55;
    reflections.dispose();
  }
  if (options.only !== 'room') {
    character = await buildCharacter(renderer);
    scene.add(character.root);
  }
  return { room, character };
}

function walkSpace(room: Room | null): WalkSpace {
  const halfWidth = ROOM_SIZE.width / 2;
  const halfDepth = ROOM_SIZE.depth / 2;
  return {
    bounds: { minX: -halfWidth, maxX: halfWidth, minZ: -halfDepth, maxZ: halfDepth },
    obstacles: [...(room?.colliders ?? []), boxAround(FIGURE_SPOT, FIGURE_HALF_SIZE), tableBox()],
    radius: PLAYER.radius,
  };
}

/** Frees what the scene holds on the graphics card: every geometry, material and texture under `scene`. */
function disposeScene(scene: THREE.Scene): void {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line)) return;
    (object.geometry as THREE.BufferGeometry).dispose();
    const materials = (Array.isArray(object.material) ? object.material : [object.material]) as THREE.Material[];
    for (const material of materials) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
      material.dispose();
    }
  });
  scene.environment?.dispose();
}

/** A running scene; `stop` ends it and frees everything it holds. */
export interface RunningScene {
  stop(): void;
}

async function run(root: HTMLElement, options: SceneOptions, onReady: () => void, cleanups: (() => void)[]): Promise<void> {
  const still = options.shot !== null;
  const renderer = createRenderer(root, still, options.quality);
  const scene = new THREE.Scene();
  cleanups.push(() => {
    renderer.setAnimationLoop(null);
    disposeScene(scene);
    renderer.dispose();
    renderer.domElement.remove();
  });
  scene.background = new THREE.Color(0x2a2622);
  const camera = new THREE.PerspectiveCamera(62, root.clientWidth / root.clientHeight, 0.05, 80);
  const { room, character } = await buildParts(scene, renderer, options);
  const picture = createPicture(renderer, scene, camera, options.quality);

  let controls: WalkControls | null = null;
  let hud: Hud | null = null;
  let briefing: BriefingSession | null = null;
  // A still picture is silent; only the game has sound.
  const sound: SoundStage | null = still ? null : createSoundStage(root);
  if (sound) cleanups.push(() => sound.dispose());
  if (character) {
    const content = loadSceneContent();
    const session = await createBriefingSession({
      root,
      camera,
      briefing: content.briefing,
      map: content.map,
      view: SHOTS.briefing,
      script: options.script,
      speaker: content.name,
      speakerNote: content.note,
      // While the figure speaks the player neither walks nor is invited again.
      onActiveChange: (active) => {
        controls?.setEnabled(!active);
        hud?.setWalking(!active);
      },
      // The figure says the step that is being told and falls silent when the telling stops.
      onLine: (line) => {
        if (line) sound?.narrator.say(line);
        else sound?.narrator.hush();
      },
    });
    briefing = session;
    scene.add(session.table);
    cleanups.push(() => session.dispose());
    if (!still) {
      const game = {
        controls: createWalkControls(renderer.domElement, camera, { space: walkSpace(room), start: START, eyeHeight: PLAYER.eyeHeight, yaw: START.yaw }),
        hud: createHud(root, { title: content.name, backHref: content.cardHref, invitation: content.briefing.invitation, onInvite: () => session.start() }),
      };
      controls = game.controls;
      hud = game.hud;
      cleanups.push(() => {
        game.controls.dispose();
        game.hud.dispose();
      });
    }
  }
  if (options.shot) {
    placeCamera(camera, SHOTS[options.shot]);
    if (options.step !== null) briefing?.preview(options.step);
  }

  const onResize = (): void => {
    renderer.setSize(root.clientWidth, root.clientHeight);
    picture.setSize(root.clientWidth, root.clientHeight);
    camera.aspect = root.clientWidth / root.clientHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  cleanups.push(() => window.removeEventListener('resize', onResize));

  const clock = new THREE.Clock();
  const gaze = camera.position.clone();
  // A player's scene adapts to the graphics card; a still picture and the low quality keep the size they were given.
  const meter = still || options.quality === 'low' ? null : createFrameMeter(FRAME_METER);
  let frames = 0;

  /** Moves everything that moves by the time that has passed. */
  function advance(seconds: number, time: number): void {
    controls?.update(seconds);
    room?.update(time);
    // The figure looks at what he is pointing out on the map, and at the visitor otherwise; his gaze moves over
    // from one to the other instead of jumping.
    const pointedAt = briefing?.update(seconds) ?? null;
    gaze.lerp(pointedAt ?? camera.position, still ? 1 : 1 - Math.exp(-seconds * GAZE_SPEED));
    character?.update(time, gaze, seconds, sound?.narrator.isSpeaking() ?? false);
    hud?.setNear(Math.hypot(camera.position.x - FIGURE_SPOT.x, camera.position.z - FIGURE_SPOT.z) < MEETING_DISTANCE);
    sound?.update({ distanceToHearth: Math.hypot(camera.position.x - HEARTH.x, camera.position.z - HEARTH.z) });
  }

  /** Draws the picture a step coarser when the last frames were too slow for this graphics card. */
  function adapt(seconds: number): void {
    const mean = meter?.add(seconds * 1000) ?? null;
    if (mean === null) return;
    const ratio = nextPixelRatio(renderer.getPixelRatio(), mean, RESOLUTION_LIMITS);
    if (ratio === renderer.getPixelRatio()) return;
    renderer.setPixelRatio(ratio);
    picture.setSize(root.clientWidth, root.clientHeight);
  }

  function markReady(): void {
    // Nothing that throws a shadow moves, so the shadows are drawn once the scene is complete and then kept.
    renderer.shadowMap.autoUpdate = false;
    document.documentElement.dataset.sceneReady = 'true';
    onReady();
    if (still) renderer.setAnimationLoop(null);
  }

  renderer.setAnimationLoop(() => {
    const seconds = clock.getDelta();
    advance(seconds, still ? options.time : clock.elapsedTime);
    renderer.info.reset();
    picture.render();
    frames += 1;
    const info: SceneInfo = {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      player: { x: camera.position.x, z: camera.position.z },
      pixelRatio: renderer.getPixelRatio(),
    };
    Object.assign(window, { sceneInfo: info });
    adapt(seconds);
    if (frames === FRAMES_BEFORE_READY) markReady();
  });
}

/**
 * Starts the scene inside `root`; if it cannot start, says so on the page instead of leaving it empty, and
 * leaves nothing of the half-built scene behind. The returned handle stops the scene.
 */
export async function startScene(root: HTMLElement, options: SceneOptions): Promise<RunningScene> {
  // The tests ask how loud the generated sound of the room is; they cannot listen.
  Object.assign(window, { measureSceneAmbience: measureAmbience });
  const veil = showLoading(root);
  const cleanups: (() => void)[] = [];
  const stop = (): void => {
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  };
  try {
    await run(root, options, () => veil.remove(), cleanups);
  } catch (error) {
    veil.remove();
    stop();
    showNotice(root, error);
  }
  return { stop };
}
