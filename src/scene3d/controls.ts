import type * as THREE from 'three';
import { walk, type Point, type WalkSpace } from './walk';

/**
 * First-person controls: the keyboard or a touch stick walks, the mouse looks around. A click on the scene takes
 * hold of the mouse, as games do, and from then on moving it turns the view; Esc lets it go. Where the mouse
 * cannot be held, and on touch screens, dragging looks around instead. The player's eyes stay at one height; the
 * floor plan decides where the player may go.
 */
export interface WalkControls {
  /** Moves the camera for the time that has passed, in seconds. */
  update(seconds: number): void;
  /** Stops or resumes listening to the player; while stopped the camera is left to someone else. */
  setEnabled(enabled: boolean): void;
  dispose(): void;
}

export interface WalkControlsOptions {
  space: WalkSpace;
  start: Point;
  eyeHeight: number;
  /** Direction the player looks at the start: a turn around the vertical, in radians (0 looks along -z). */
  yaw: number;
}

const WALK_SPEED = 1.7;
const RUN_SPEED = 3;
const LOOK_SPEED = 0.0032;
/** Looking with a held mouse turns a little slower than dragging: the hand moves further. */
const HELD_LOOK_SPEED = 0.0022;
const MAX_PITCH = 1.1;
/** The longest step taken in one frame, so that a stalled frame cannot carry the player through a wall. */
const MAX_STEP_SECONDS = 0.05;
/** A touch that starts in this left part of the screen walks; elsewhere it looks around. */
const STICK_ZONE = 0.4;
/** Distance in pixels a finger travels from where it touched for full walking speed. */
const STICK_REACH = 60;
/** Walking moves the eyes up and down a little: this many radians of the swing per metre, this many metres high. */
const STRIDE = { perMetre: 7.2, lift: 0.016 } as const;

const KEY_AXES: Readonly<Record<string, readonly [number, number]>> = {
  KeyW: [0, 1],
  ArrowUp: [0, 1],
  KeyS: [0, -1],
  ArrowDown: [0, -1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

interface Drag {
  kind: 'look' | 'stick';
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
}

export function createWalkControls(element: HTMLElement, camera: THREE.PerspectiveCamera, options: WalkControlsOptions): WalkControls {
  const pressed = new Set<string>();
  const drags = new Map<number, Drag>();
  const stick = { x: 0, y: 0 };
  let position: Point = { ...options.start };
  let yaw = options.yaw;
  let pitch = 0;
  let travelled = 0;
  let enabled = true;

  const holdsMouse = (): boolean => document.pointerLockElement === element;

  function turn(dx: number, dy: number, speed: number): void {
    yaw -= dx * speed;
    pitch = Math.min(MAX_PITCH, Math.max(-MAX_PITCH, pitch - dy * speed));
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    if (enabled) pressed.add(event.code);
  };
  const onKeyUp = (event: KeyboardEvent): void => {
    pressed.delete(event.code);
  };
  const onBlur = (): void => pressed.clear();

  const onPointerDown = (event: PointerEvent): void => {
    if (!enabled) return;
    if (event.pointerType === 'mouse' && !holdsMouse()) {
      // Taking hold of the mouse can be refused (no permission, an embedded page); dragging then still works.
      void Promise.resolve(element.requestPointerLock()).catch(() => undefined);
    }
    const isStick = event.pointerType === 'touch' && event.clientX < element.clientWidth * STICK_ZONE;
    drags.set(event.pointerId, { kind: isStick ? 'stick' : 'look', startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY });
    element.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent): void => {
    if (!enabled) return;
    if (holdsMouse()) {
      turn(event.movementX, event.movementY, HELD_LOOK_SPEED);
      return;
    }
    const drag = drags.get(event.pointerId);
    if (!drag) return;
    if (drag.kind === 'look') turn(event.clientX - drag.lastX, event.clientY - drag.lastY, LOOK_SPEED);
    else {
      stick.x = Math.min(1, Math.max(-1, (event.clientX - drag.startX) / STICK_REACH));
      stick.y = Math.min(1, Math.max(-1, (drag.startY - event.clientY) / STICK_REACH));
    }
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
  };
  const onPointerUp = (event: PointerEvent): void => {
    if (drags.get(event.pointerId)?.kind === 'stick') {
      stick.x = 0;
      stick.y = 0;
    }
    drags.delete(event.pointerId);
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('pointermove', onPointerMove);
  element.addEventListener('pointerup', onPointerUp);
  element.addEventListener('pointercancel', onPointerUp);

  /** Where the player wants to go: x to the right, y forwards, at most one unit long. */
  function wish(): { x: number; y: number } {
    let x = stick.x;
    let y = stick.y;
    for (const code of pressed) {
      const axis = KEY_AXES[code];
      if (axis) {
        x += axis[0];
        y += axis[1];
      }
    }
    const length = Math.hypot(x, y);
    return length > 1 ? { x: x / length, y: y / length } : { x, y };
  }

  function update(seconds: number): void {
    if (!enabled) return;
    const time = Math.min(seconds, MAX_STEP_SECONDS);
    const speed = pressed.has('ShiftLeft') || pressed.has('ShiftRight') ? RUN_SPEED : WALK_SPEED;
    const want = wish();
    const forwardX = -Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    const step = {
      x: (forwardX * want.y - forwardZ * want.x) * speed * time,
      z: (forwardZ * want.y + forwardX * want.x) * speed * time,
    };
    const before = position;
    position = walk(position, step, options.space);
    travelled += Math.hypot(position.x - before.x, position.z - before.z);
    camera.position.set(position.x, options.eyeHeight + Math.sin(travelled * STRIDE.perMetre) * STRIDE.lift, position.z);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }

  function setEnabled(next: boolean): void {
    enabled = next;
    if (next) return;
    // Whoever takes the camera also gets the mouse back, to press buttons with.
    pressed.clear();
    drags.clear();
    stick.x = 0;
    stick.y = 0;
    if (holdsMouse()) document.exitPointerLock();
  }

  function dispose(): void {
    setEnabled(false);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    element.removeEventListener('pointerdown', onPointerDown);
    element.removeEventListener('pointermove', onPointerMove);
    element.removeEventListener('pointerup', onPointerUp);
    element.removeEventListener('pointercancel', onPointerUp);
  }

  update(0);
  return { update, setEnabled, dispose };
}
