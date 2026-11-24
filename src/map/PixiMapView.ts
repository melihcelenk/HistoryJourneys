import { Application, Graphics, Sprite, Texture, TilingSprite } from 'pixi.js';
import { MAP_HOME } from './mapRegion';
import {
  createAnchor,
  createCityElement,
  createFigureElement,
  createStopElement,
  MARKER_LAYERS,
  markerOf,
  updateCityElement,
  updateFigureElement,
  updateStopElement,
} from './markerElements';
import {
  EMPTY_SCENE,
  type Insets,
  type LonLat,
  type MapScene,
  type MapView,
  type MapViewEvents,
} from './MapView';
import { Camera, easeOutCubic } from './pixi/Camera';
import { RegionProjection, type WorldPoint } from './pixi/projection';
import { createCloudShadowTexture, loadTerrainData, paintTerrain, type TerrainData } from './pixi/terrainPainter';

/** Width of the painted map in pixels: detailed enough for dense phone screens, about 30 MB as a texture. */
const WORLD_WIDTH = 3072;
const HOME_SCALE = 1.1;
const CAMERA_DURATION_MS = 1200;
const FIGURE_MOVE_DURATION_MS = 700;
const WHEEL_ZOOM_STEP = 1.0015;
/** Cloud shadows drift this many pixels per second. */
const CLOUD_SPEED = { x: 5, y: 2 };
const CLOUD_ALPHA = 0.5;
/** Screen pixels per pixel of the cloud texture at scale 1; larger means bigger, softer clouds. */
const CLOUD_TILE_SCALE = 2;
/** Colour shown for an instant before the terrain is painted: the sea. */
const SEA_BACKGROUND_COLOR = 0x587a82;
/** Rendering above this pixel density costs memory without a visible gain. */
const MAX_DEVICE_PIXEL_RATIO = 2;

interface PathStyle {
  color: number;
  alpha: number;
  width: number;
  /** Lengths of dash and gap in pixels; a solid line when absent. */
  dash?: [number, number];
}

const ROUTE_STYLE: PathStyle = { color: 0x3b2a14, alpha: 0.5, width: 2, dash: [3, 9] };
const AHEAD_STYLE: PathStyle = { color: 0x5a1a14, alpha: 0.45, width: 2.5, dash: [8, 8] };
const REACHED_GLOW_STYLE: PathStyle = { color: 0xf4e2a8, alpha: 0.5, width: 9 };
const REACHED_STYLE: PathStyle = { color: 0x8a1f17, alpha: 1, width: 3.5 };

/** A DOM marker pinned to a place on the map; it glides when its place changes. */
interface Pin {
  anchor: HTMLElement;
  position: WorldPoint;
  from: WorldPoint;
  to: WorldPoint;
  movedAt: number;
}

function drawSegment(graphics: Graphics, a: WorldPoint, b: WorldPoint, style: PathStyle): void {
  if (!style.dash) {
    graphics.moveTo(a.x, a.y).lineTo(b.x, b.y);
    return;
  }
  const [dash, gap] = style.dash;
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const stepX = (b.x - a.x) / length;
  const stepY = (b.y - a.y) / length;
  for (let offset = 0; offset < length; offset += dash + gap) {
    const end = Math.min(offset + dash, length);
    graphics.moveTo(a.x + stepX * offset, a.y + stepY * offset).lineTo(a.x + stepX * end, a.y + stepY * end);
  }
}

function drawPath(graphics: Graphics, points: WorldPoint[], style: PathStyle): void {
  if (points.length < 2) return;
  points.slice(1).forEach((point, index) => drawSegment(graphics, points[index] as WorldPoint, point, style));
  graphics.stroke({ width: style.width, color: style.color, alpha: style.alpha, cap: 'round', join: 'round' });
}

/**
 * The game map as a painted campaign map (FR-30): the terrain is painted once
 * with real relief and drawn by PixiJS as one texture, cloud shadows drift over
 * it, and markers are DOM elements so that their text stays sharp.
 */
export class PixiMapView implements MapView {
  readonly ready: Promise<void>;
  private readonly app = new Application();
  private readonly projection: RegionProjection;
  private readonly camera: Camera;
  private readonly overlay = document.createElement('div');
  private readonly paths = new Graphics();
  private readonly pins = new Map<string, Pin>();
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private terrain: Sprite | null = null;
  private clouds: TilingSprite | null = null;
  private scene: MapScene = EMPTY_SCENE;
  private insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
  private dirty = true;
  private destroyed = false;
  private initialized = false;
  private released = false;
  private readonly removeListeners: (() => void)[] = [];

  constructor(
    private readonly container: HTMLElement,
    private readonly events: MapViewEvents,
  ) {
    this.projection = new RegionProjection(WORLD_WIDTH);
    this.camera = new Camera(this.projection.width, this.projection.height);
    this.overlay.className = 'map-overlay';
    this.ready = this.start();
  }

  private async start(): Promise<void> {
    const dataPromise = loadTerrainData();
    // A failure of the data is handled below, after the renderer has started.
    dataPromise.catch(() => undefined);
    await this.app.init({
      resizeTo: this.container,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO),
      backgroundColor: SEA_BACKGROUND_COLOR,
    });
    this.initialized = true;
    let data: TerrainData;
    try {
      data = await dataPromise;
    } catch (error) {
      this.release();
      throw error;
    }
    // The view may have been destroyed while it was starting; then nothing must stay behind.
    if (this.destroyed) {
      this.release();
      return;
    }

    this.terrain = new Sprite(Texture.from(paintTerrain(this.projection, data)));
    this.clouds = new TilingSprite({ texture: Texture.from(createCloudShadowTexture()), width: 1, height: 1 });
    this.clouds.alpha = CLOUD_ALPHA;
    this.clouds.blendMode = 'multiply';
    this.app.stage.addChild(this.terrain, this.clouds, this.paths);
    this.app.canvas.classList.add('map-canvas');
    this.container.append(this.app.canvas, this.overlay);

    this.camera.resize(this.app.screen.width, this.app.screen.height);
    const home = this.projection.project([MAP_HOME.lon, MAP_HOME.lat]);
    this.camera.jumpTo({ ...home, scale: HOME_SCALE });
    this.listen();
    this.app.ticker.add(() => this.tick());
  }

  setScene(scene: MapScene): void {
    this.scene = scene;
    this.syncPins();
    this.dirty = true;
  }

  setInsets(insets: Insets): void {
    this.insets = insets;
  }

  frame(points: LonLat[]): void {
    const target = this.camera.framing(
      points.map((point) => this.projection.project(point)),
      this.insets,
    );
    if (target) this.camera.flyTo(target, CAMERA_DURATION_MS, performance.now());
  }

  panTo(point: LonLat): void {
    const target = this.projection.project(point);
    this.camera.flyTo({ ...target, scale: this.camera.current.scale }, CAMERA_DURATION_MS / 2, performance.now());
  }

  destroy(): void {
    this.destroyed = true;
    this.removeListeners.forEach((remove) => remove());
    this.overlay.remove();
    this.release();
  }

  /** Frees the renderer (WebGL context, canvas, textures) once; it exists only after its asynchronous start. */
  private release(): void {
    if (!this.initialized || this.released) return;
    this.released = true;
    this.app.destroy(true, { children: true, texture: true });
  }

  /** Called every frame: moves the camera, the clouds and the markers, and redraws what changed. */
  private tick(): void {
    const now = performance.now();
    const { width, height } = this.app.screen;
    // A resized view shifts everything on screen, exactly like a camera move.
    const resized = this.camera.resize(width, height);
    const cameraMoved = this.camera.update(now) || this.dirty || resized;
    const pinsMoved = this.movePins(now);
    this.driftClouds(width, height);
    if (!cameraMoved && !pinsMoved) return;

    const { scale } = this.camera.current;
    const origin = this.camera.toScreen({ x: 0, y: 0 });
    this.terrain?.position.set(origin.x, origin.y);
    this.terrain?.scale.set(scale);
    this.placePins();
    this.drawPaths();
    if (cameraMoved) this.reportViewport(width, height);
    this.dirty = false;
  }

  private driftClouds(width: number, height: number): void {
    if (!this.clouds) return;
    const seconds = performance.now() / 1000;
    const { x, y, scale } = this.camera.current;
    this.clouds.width = width;
    this.clouds.height = height;
    this.clouds.tileScale.set(scale * CLOUD_TILE_SCALE);
    // Clouds are tied to the ground, so they move with the map and drift slowly on their own.
    this.clouds.tilePosition.set(-x * scale + seconds * CLOUD_SPEED.x, -y * scale + seconds * CLOUD_SPEED.y);
  }

  private drawPaths(): void {
    const toScreen = (points: LonLat[]): WorldPoint[] =>
      points.map((point) => this.camera.toScreen(this.projection.project(point)));
    this.paths.clear();
    drawPath(this.paths, toScreen(this.scene.routePath), ROUTE_STYLE);
    drawPath(this.paths, toScreen(this.scene.journeyAhead), AHEAD_STYLE);
    const reached = toScreen(this.scene.journeyReached);
    drawPath(this.paths, reached, REACHED_GLOW_STYLE);
    drawPath(this.paths, reached, REACHED_STYLE);
  }

  private reportViewport(width: number, height: number): void {
    const [west, north] = this.projection.unproject(this.camera.toWorld(0, 0));
    const [east, south] = this.projection.unproject(this.camera.toWorld(width, height));
    this.events.onViewportChange({ west, south, east, north });
  }

  /** Creates, updates and removes the DOM markers so that they match the scene. */
  private syncPins(): void {
    const seen = new Set<string>();
    const sync = (
      key: string,
      lonLat: LonLat,
      layer: number,
      create: () => HTMLElement,
      update?: (element: HTMLElement) => void,
    ): void => {
      seen.add(key);
      const target = this.projection.project(lonLat);
      const pin = this.pins.get(key);
      if (!pin) {
        const anchor = createAnchor(create(), layer);
        this.overlay.append(anchor);
        this.pins.set(key, { anchor, position: target, from: target, to: target, movedAt: 0 });
        return;
      }
      const marker = markerOf(pin.anchor);
      if (marker) update?.(marker);
      if (pin.to.x !== target.x || pin.to.y !== target.y) {
        pin.from = pin.position;
        pin.to = target;
        pin.movedAt = performance.now();
      }
    };
    for (const city of this.scene.cities) sync(
        `city:${city.id}`,
        city.position,
        MARKER_LAYERS.city,
        () => createCityElement(city),
        (element) => updateCityElement(element, city),
      );
    for (const stop of this.scene.stops) {
      sync(
        `stop:${stop.id}`,
        stop.position,
        MARKER_LAYERS.stop,
        () => createStopElement(stop),
        (element) => updateStopElement(element, stop),
      );
    }
    for (const figure of this.scene.figures) {
      sync(
        `figure:${figure.slug}`,
        figure.position,
        MARKER_LAYERS.figure,
        () => createFigureElement(figure, this.events.onFigureClick),
        (element) => updateFigureElement(element, figure),
      );
    }
    for (const [key, pin] of this.pins) {
      if (seen.has(key)) continue;
      pin.anchor.remove();
      this.pins.delete(key);
    }
  }

  /** Glides markers towards their new place; returns whether any is still moving. */
  private movePins(now: number): boolean {
    let moving = false;
    for (const pin of this.pins.values()) {
      if (pin.position === pin.to) continue;
      const progress = Math.min((now - pin.movedAt) / FIGURE_MOVE_DURATION_MS, 1);
      const eased = easeOutCubic(progress);
      pin.position =
        progress >= 1
          ? pin.to
          : { x: pin.from.x + (pin.to.x - pin.from.x) * eased, y: pin.from.y + (pin.to.y - pin.from.y) * eased };
      moving = true;
    }
    return moving;
  }

  private placePins(): void {
    for (const pin of this.pins.values()) {
      const { x, y } = this.camera.toScreen(pin.position);
      pin.anchor.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  }

  /** Drag to pan, wheel or pinch to zoom. */
  private listen(): void {
    const on = <K extends keyof HTMLElementEventMap>(
      type: K,
      handler: (event: HTMLElementEventMap[K]) => void,
      options?: AddEventListenerOptions,
    ): void => {
      this.container.addEventListener(type, handler, options);
      this.removeListeners.push(() => this.container.removeEventListener(type, handler, options));
    };
    const localPoint = (event: MouseEvent): { x: number; y: number } => {
      const box = this.container.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top };
    };

    on('pointerdown', (event) => {
      // Markers handle their own clicks; dragging starts only on the map itself.
      if (event.target instanceof Element && event.target.closest('button')) return;
      this.pointers.set(event.pointerId, localPoint(event));
      this.container.setPointerCapture(event.pointerId);
    });
    on('pointermove', (event) => {
      const previous = this.pointers.get(event.pointerId);
      if (!previous) return;
      const current = localPoint(event);
      const others = [...this.pointers.entries()].filter(([id]) => id !== event.pointerId).map(([, point]) => point);
      const other = others[0];
      if (other) {
        const before = Math.hypot(previous.x - other.x, previous.y - other.y);
        const after = Math.hypot(current.x - other.x, current.y - other.y);
        if (before > 0) this.camera.zoomAt((current.x + other.x) / 2, (current.y + other.y) / 2, after / before);
      } else {
        this.camera.panByScreen(current.x - previous.x, current.y - previous.y);
      }
      this.pointers.set(event.pointerId, current);
      this.dirty = true;
    });
    const release = (event: PointerEvent): void => {
      this.pointers.delete(event.pointerId);
    };
    on('pointerup', release);
    on('pointercancel', release);
    on(
      'wheel',
      (event) => {
        event.preventDefault();
        const point = localPoint(event);
        this.camera.zoomAt(point.x, point.y, WHEEL_ZOOM_STEP ** -event.deltaY);
        this.dirty = true;
      },
      { passive: false },
    );
  }
}
