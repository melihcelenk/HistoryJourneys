import type { Insets } from '../MapView';
import type { WorldPoint } from './projection';

export interface CameraState {
  /** World point shown at the centre of the view. */
  x: number;
  y: number;
  /** Screen pixels per world pixel. */
  scale: number;
}

const MAX_SCALE = 3.2;
/** The camera does not zoom in further than this when framing a journey. */
const MAX_FRAME_SCALE = 1.5;
const FRAME_MARGIN_PX = 70;

/** Starts fast and settles gently; used for camera flights and gliding markers. */
export function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

interface Tween {
  from: CameraState;
  to: CameraState;
  startedAt: number;
  durationMs: number;
}

/**
 * Pan and zoom over the painted map. The camera keeps the view inside the
 * world, so the player never sees past the edge of the map.
 */
export class Camera {
  private state: CameraState = { x: 0, y: 0, scale: 1 };
  private tween: Tween | null = null;
  private viewWidth = 1;
  private viewHeight = 1;

  constructor(
    private readonly worldWidth: number,
    private readonly worldHeight: number,
  ) {}

  get current(): Readonly<CameraState> {
    return this.state;
  }

  /** The smallest scale at which the world still covers the whole view. */
  private get minScale(): number {
    return Math.max(this.viewWidth / this.worldWidth, this.viewHeight / this.worldHeight);
  }

  private clamp(state: CameraState): CameraState {
    const scale = Math.min(Math.max(state.scale, this.minScale), MAX_SCALE);
    const halfWidth = this.viewWidth / 2 / scale;
    const halfHeight = this.viewHeight / 2 / scale;
    return {
      scale,
      x: Math.min(Math.max(state.x, halfWidth), this.worldWidth - halfWidth),
      y: Math.min(Math.max(state.y, halfHeight), this.worldHeight - halfHeight),
    };
  }

  /** Tells the camera the size of the view; returns whether the size changed. */
  resize(width: number, height: number): boolean {
    const nextWidth = Math.max(width, 1);
    const nextHeight = Math.max(height, 1);
    if (nextWidth === this.viewWidth && nextHeight === this.viewHeight) return false;
    this.viewWidth = nextWidth;
    this.viewHeight = nextHeight;
    this.state = this.clamp(this.state);
    return true;
  }

  jumpTo(state: CameraState): void {
    this.tween = null;
    this.state = this.clamp(state);
  }

  flyTo(state: CameraState, durationMs: number, now: number): void {
    this.tween = { from: this.state, to: this.clamp(state), startedAt: now, durationMs };
  }

  /** Advances a running flight; returns whether the camera moved. */
  update(now: number): boolean {
    if (!this.tween) return false;
    const { from, to, startedAt, durationMs } = this.tween;
    const progress = Math.min((now - startedAt) / durationMs, 1);
    const eased = easeOutCubic(progress);
    this.state = {
      x: from.x + (to.x - from.x) * eased,
      y: from.y + (to.y - from.y) * eased,
      scale: from.scale + (to.scale - from.scale) * eased,
    };
    if (progress >= 1) this.tween = null;
    return true;
  }

  panByScreen(dx: number, dy: number): void {
    this.jumpTo({ ...this.state, x: this.state.x - dx / this.state.scale, y: this.state.y - dy / this.state.scale });
  }

  /** Zooms by a factor while keeping the world point under the given screen point fixed. */
  zoomAt(screenX: number, screenY: number, factor: number): void {
    const anchor = this.toWorld(screenX, screenY);
    const scale = Math.min(Math.max(this.state.scale * factor, this.minScale), MAX_SCALE);
    this.jumpTo({
      scale,
      x: anchor.x - (screenX - this.viewWidth / 2) / scale,
      y: anchor.y - (screenY - this.viewHeight / 2) / scale,
    });
  }

  toScreen(point: WorldPoint): WorldPoint {
    return {
      x: this.viewWidth / 2 + (point.x - this.state.x) * this.state.scale,
      y: this.viewHeight / 2 + (point.y - this.state.y) * this.state.scale,
    };
  }

  toWorld(screenX: number, screenY: number): WorldPoint {
    return {
      x: this.state.x + (screenX - this.viewWidth / 2) / this.state.scale,
      y: this.state.y + (screenY - this.viewHeight / 2) / this.state.scale,
    };
  }

  /** The camera state that shows all points inside the part of the view not covered by panels. */
  framing(points: WorldPoint[], insets: Insets): CameraState | null {
    if (points.length === 0) return null;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const boxWidth = Math.max(...xs) - left;
    const boxHeight = Math.max(...ys) - top;
    const freeWidth = Math.max(this.viewWidth - insets.left - insets.right - 2 * FRAME_MARGIN_PX, 1);
    const freeHeight = Math.max(this.viewHeight - insets.top - insets.bottom - 2 * FRAME_MARGIN_PX, 1);
    const fit = Math.min(freeWidth / Math.max(boxWidth, 1), freeHeight / Math.max(boxHeight, 1));
    const scale = Math.min(Math.max(fit, this.minScale), MAX_FRAME_SCALE);
    // Centre of the free area, measured from the centre of the view.
    const offsetX = (insets.left - insets.right) / 2;
    const offsetY = (insets.top - insets.bottom) / 2;
    return {
      scale,
      x: left + boxWidth / 2 - offsetX / scale,
      y: top + boxHeight / 2 - offsetY / scale,
    };
  }
}
