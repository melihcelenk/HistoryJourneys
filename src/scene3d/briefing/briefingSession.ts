import * as THREE from 'three';
import type { Shot } from '../shots';
import { createBriefingPanel, type BriefingPanel } from './briefingPanel';
import type { Briefing } from './briefingSchema';
import { createMapBoard } from './mapBoard';
import { marksCentre, otherScript, pebblePoints, type MapDefinition, type Script } from './mapDefinition';
import { back, begin, forward, isRunning, type Narration } from './narration';
import { createBriefingTable } from './table';
import { mapPointOnTable } from './tableLayout';

/**
 * A briefing in the scene: the table with its map, the panel the words are read from, the button that turns the
 * writing of the map from one script to the other, and the camera that goes to the table while the figure speaks
 * and returns to the player afterwards. It is driven by data alone: a briefing (the words) and a map (what they
 * point at).
 */
export interface BriefingSession {
  /** The table and the map; add it to the scene. */
  table: THREE.Group;
  /** Starts the briefing at its first step, or shows one step at once (for a still picture). */
  start(): void;
  preview(step: number): void;
  /** Advances the camera and the marks; returns where the figure should look, or null to look at the visitor. */
  update(seconds: number): THREE.Vector3 | null;
  dispose(): void;
}

export interface BriefingSessionOptions {
  root: HTMLElement;
  camera: THREE.PerspectiveCamera;
  briefing: Briefing;
  map: MapDefinition;
  /** Where the camera stands while the briefing is told. */
  view: Shot;
  /** The script the map is written in at the start. */
  script: Script;
  speaker: string;
  speakerNote: string;
  /** Called when the briefing takes the screen and when it gives it back. */
  onActiveChange(active: boolean): void;
}

/** How long the camera takes to go to the table and to come back, in seconds. */
const TRAVEL_SECONDS = 1.1;
const KEYS = { forward: ['ArrowRight', 'Enter', 'Space'], back: ['ArrowLeft'], close: ['Escape'], script: ['KeyT'] } as const;
/** What the button offers, by the script the map is in now. */
const SCRIPT_OFFERS: Readonly<Record<Script, string>> = { ottoman: 'Çeviri: Latin harfleri  ·  T', latin: 'Osmanlıca yazıya dön  ·  T' };

const ease = (t: number): number => t * t * (3 - 2 * t);
const isKey = (keys: readonly string[], code: string): boolean => keys.includes(code);

function createScriptButton(root: HTMLElement, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'script-toggle';
  button.dataset.testid = 'script-toggle';
  button.addEventListener('click', onClick);
  root.append(button);
  return button;
}

export async function createBriefingSession(options: BriefingSessionOptions): Promise<BriefingSession> {
  const { camera, briefing, map, view } = options;
  const board = await createMapBoard(map);
  const table = createBriefingTable(board);
  let narration: Narration = null;
  let script = options.script;
  /** 0 with the player, 1 at the table; moves towards where the narration needs the camera. */
  let travel = 0;
  let active = false;
  /** Set when what the sheet shows has changed and it must be painted again. */
  let stale = true;
  const home = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), fov: camera.fov };
  const probe = new THREE.PerspectiveCamera();
  probe.position.set(...view.position);
  probe.lookAt(...view.target);
  const atTable = { position: probe.position.clone(), quaternion: probe.quaternion.clone() };
  const lookTarget = new THREE.Vector3();

  const marks = (): readonly string[] => (isRunning(narration) ? (briefing.steps[narration.step]?.marks ?? []) : []);

  function setNarration(next: Narration): void {
    narration = next;
    stale = true;
    table.setPebbles(pebblePoints(map, marks()));
    if (isRunning(next)) panel.show(next.step);
    else panel.hide();
  }
  const panel: BriefingPanel = createBriefingPanel(options.root, {
    briefing,
    speaker: options.speaker,
    speakerNote: options.speakerNote,
    onForward: () => setNarration(forward(narration, briefing.steps.length)),
    onBack: () => setNarration(back(narration)),
    onClose: () => setNarration(null),
  });

  function setScript(next: Script): void {
    script = next;
    stale = true;
    scriptButton.textContent = SCRIPT_OFFERS[next];
    scriptButton.dataset.script = next;
  }
  const scriptButton = createScriptButton(options.root, () => setScript(otherScript(script)));
  setScript(script);

  function onNarrationKey(code: string): boolean {
    if (!isRunning(narration)) return false;
    if (isKey(KEYS.forward, code)) setNarration(forward(narration, briefing.steps.length));
    else if (isKey(KEYS.back, code)) setNarration(back(narration));
    else if (isKey(KEYS.close, code)) setNarration(null);
    else return false;
    return true;
  }
  const onKey = (event: KeyboardEvent): void => {
    if (isKey(KEYS.script, event.code)) setScript(otherScript(script));
    else if (!onNarrationKey(event.code)) return;
    event.preventDefault();
  };
  window.addEventListener('keydown', onKey);

  function setActive(next: boolean): void {
    if (active === next) return;
    active = next;
    options.onActiveChange(next);
  }

  function start(): void {
    if (active) return;
    home.position.copy(camera.position);
    home.quaternion.copy(camera.quaternion);
    home.fov = camera.fov;
    setActive(true);
    setNarration(begin());
  }

  function preview(step: number): void {
    travel = 1;
    setNarration({ step: Math.min(briefing.steps.length - 1, Math.max(0, step)) });
  }

  function moveCamera(seconds: number): void {
    const goal = isRunning(narration) ? 1 : 0;
    if (travel === goal) return;
    const step = seconds / TRAVEL_SECONDS;
    travel = goal > travel ? Math.min(goal, travel + step) : Math.max(goal, travel - step);
    const t = ease(travel);
    camera.position.lerpVectors(home.position, atTable.position, t);
    camera.quaternion.slerpQuaternions(home.quaternion, atTable.quaternion, t);
    camera.fov = THREE.MathUtils.lerp(home.fov, view.fov, t);
    camera.updateProjectionMatrix();
    // The player has the camera back only when it has returned all the way.
    if (travel === 0) setActive(false);
  }

  function update(seconds: number): THREE.Vector3 | null {
    if (active) moveCamera(seconds);
    const current = marks();
    // The sheet is painted, and sent to the graphics card, only when what it shows has changed.
    if (stale) board.show(current, script);
    stale = false;
    if (current.length === 0) return null;
    return lookTarget.set(...mapPointOnTable(marksCentre(map, current)));
  }

  function dispose(): void {
    window.removeEventListener('keydown', onKey);
    panel.dispose();
    scriptButton.remove();
    board.texture.dispose();
  }

  return { table: table.group, start, preview, update, dispose };
}
