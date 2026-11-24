import {
  type ExpressionSpecification,
  type GeoJSONSource,
  LngLatBounds,
  type LngLatLike,
  Map as MapLibreMap,
  Marker,
  setWorkerUrl,
  type StyleSpecification,
} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_HOME, MAP_REGION } from './mapRegion';
import { CAMERA_DURATION_MS, FIGURE_MOVE_DURATION_MS } from './mapTimings';
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
import { EMPTY_SCENE, type Insets, type LonLat, type MapScene, type MapView, type MapViewEvents } from './MapView';
import { createLandTexture, createSeaTexture, toImageData } from './textures';

// MapLibre runs its data processing in a worker that the bundler has to emit as a separate file.
setWorkerUrl(workerUrl);

const MIN_ZOOM = 3;
const MAX_ZOOM = 8;
/** The camera does not zoom in further than this when framing a journey. */
const MAX_FRAME_ZOOM = 6.2;
const FRAME_MARGIN_PX = 70;

const PATH_SOURCES = ['trails', 'journey-ahead', 'journey-reached'] as const;
type PathSource = (typeof PATH_SOURCES)[number];

function linesFeature(lines: LonLat[][]): GeoJSON.Feature<GeoJSON.MultiLineString> {
  return { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: lines } };
}

function lineFeature(coordinates: LonLat[]): GeoJSON.Feature<GeoJSON.LineString> {
  return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } };
}

function createStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      land: { type: 'geojson', data: 'geo/land.json' },
      lakes: { type: 'geojson', data: 'geo/lakes.json' },
      rivers: { type: 'geojson', data: 'geo/rivers.json' },
      ...Object.fromEntries(PATH_SOURCES.map((name) => [name, { type: 'geojson', data: lineFeature([]) }])),
    },
    layers: [{ id: 'sea', type: 'background', paint: { 'background-color': '#587a82' } }],
  };
}

/** Layers that need the generated textures; added once the style has loaded. */
function addTerrainLayers(map: MapLibreMap): void {
  map.addImage('land-texture', toImageData(createLandTexture()));
  map.addImage('sea-texture', toImageData(createSeaTexture()));
  map.setPaintProperty('sea', 'background-pattern', 'sea-texture');
  const zoomWidth = (low: number, high: number): ExpressionSpecification => [
    'interpolate',
    ['linear'],
    ['zoom'],
    MIN_ZOOM,
    low,
    MAX_ZOOM,
    high,
  ];
  map.addLayer({ id: 'shallows', type: 'line', source: 'land', paint: { 'line-color': '#a8c6bf', 'line-width': zoomWidth(8, 30), 'line-blur': zoomWidth(6, 22), 'line-opacity': 0.55 } });
  map.addLayer({ id: 'land', type: 'fill', source: 'land', paint: { 'fill-pattern': 'land-texture' } });
  map.addLayer({ id: 'land-rim', type: 'line', source: 'land', paint: { 'line-color': '#7a6238', 'line-width': zoomWidth(3, 10), 'line-blur': zoomWidth(3, 9), 'line-opacity': 0.35 } });
  map.addLayer({ id: 'rivers', type: 'line', source: 'rivers', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#5f8791', 'line-width': zoomWidth(0.6, 2.4), 'line-opacity': 0.8 } });
  map.addLayer({ id: 'lakes', type: 'fill', source: 'lakes', paint: { 'fill-color': '#5f8791', 'fill-outline-color': '#4a6a72' } });
  map.addLayer({ id: 'coast', type: 'line', source: 'land', layout: { 'line-join': 'round' }, paint: { 'line-color': '#4d3d22', 'line-width': zoomWidth(0.8, 1.8), 'line-opacity': 0.85 } });
}

function addPathLayers(map: MapLibreMap): void {
  const round = { 'line-cap': 'round', 'line-join': 'round' } as const;
  map.addLayer({ id: 'trails', type: 'line', source: 'trails', layout: round, paint: { 'line-color': '#5a1a14', 'line-width': 2, 'line-opacity': 0.6 } });
  map.addLayer({ id: 'journey-ahead', type: 'line', source: 'journey-ahead', layout: round, paint: { 'line-color': '#5a1a14', 'line-width': 2.5, 'line-opacity': 0.4, 'line-dasharray': [1, 2] } });
  map.addLayer({ id: 'journey-reached-glow', type: 'line', source: 'journey-reached', layout: round, paint: { 'line-color': '#f4e2a8', 'line-width': 8, 'line-blur': 6, 'line-opacity': 0.55 } });
  map.addLayer({ id: 'journey-reached', type: 'line', source: 'journey-reached', layout: round, paint: { 'line-color': '#8a1f17', 'line-width': 3.5 } });
}

/** Keeps a set of DOM markers in sync with the items of a scene, keyed by id. */
class MarkerSet<T> {
  private readonly markers = new Map<string, Marker>();
  /** Running glide animation of each marker, as a requestAnimationFrame id. */
  private readonly animations = new Map<Marker, number>();

  constructor(
    private readonly map: MapLibreMap,
    private readonly options: {
      key: (item: T) => string;
      position: (item: T) => LonLat;
      create: (item: T) => HTMLElement;
      /** Stacking order of this kind of marker. */
      layer: number;
      update?: (element: HTMLElement, item: T) => void;
      /** When set, markers glide to their new position instead of jumping. */
      moveDurationMs?: number;
    },
  ) {}

  sync(items: T[]): void {
    const seen = new Set<string>();
    for (const item of items) {
      const key = this.options.key(item);
      seen.add(key);
      const existing = this.markers.get(key);
      if (existing) {
        const element = markerOf(existing.getElement());
        if (element) this.options.update?.(element, item);
        this.move(existing, this.options.position(item));
      } else {
        const anchor = createAnchor(this.options.create(item), this.options.layer);
        const marker = new Marker({ element: anchor, anchor: 'center' })
          .setLngLat(this.options.position(item))
          .addTo(this.map);
        this.markers.set(key, marker);
      }
    }
    for (const [key, marker] of this.markers) {
      if (!seen.has(key)) {
        this.discard(marker);
        this.markers.delete(key);
      }
    }
  }

  private move(marker: Marker, target: LonLat): void {
    const start = marker.getLngLat();
    const duration = this.options.moveDurationMs ?? 0;
    cancelAnimationFrame(this.animations.get(marker) ?? 0);
    this.animations.delete(marker);
    if (duration === 0 || (start.lng === target[0] && start.lat === target[1])) {
      marker.setLngLat(target);
      return;
    }
    const startedAt = performance.now();
    const step = (now: number): void => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      marker.setLngLat([start.lng + (target[0] - start.lng) * eased, start.lat + (target[1] - start.lat) * eased]);
      if (progress < 1) this.animations.set(marker, requestAnimationFrame(step));
      else this.animations.delete(marker);
    };
    this.animations.set(marker, requestAnimationFrame(step));
  }

  clear(): void {
    this.markers.forEach((marker) => this.discard(marker));
    this.markers.clear();
  }

  private discard(marker: Marker): void {
    cancelAnimationFrame(this.animations.get(marker) ?? 0);
    this.animations.delete(marker);
    marker.remove();
  }
}

/** The game map drawn with MapLibre from local Natural Earth data; no tile server is involved. */
export class MapLibreMapView implements MapView {
  readonly ready: Promise<void>;
  private readonly map: MapLibreMap;
  private readonly cities: MarkerSet<MapScene['cities'][number]>;
  private readonly stops: MarkerSet<MapScene['stops'][number]>;
  private readonly figures: MarkerSet<MapScene['figures'][number]>;
  private scene: MapScene = EMPTY_SCENE;
  private insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
  private loaded = false;
  private failed = false;
  /** Rejects `ready`; used when the map is destroyed before it has loaded. */
  private abandon: (reason: Error) => void = () => undefined;

  constructor(container: HTMLElement, events: MapViewEvents) {
    this.map = new MapLibreMap({
      container,
      style: createStyle(),
      center: [MAP_HOME.lon, MAP_HOME.lat],
      zoom: MAP_HOME.zoom,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxBounds: [
        [MAP_REGION.west, MAP_REGION.south],
        [MAP_REGION.east, MAP_REGION.north],
      ],
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: false,
      renderWorldCopies: false,
    });
    this.map.touchZoomRotate.disableRotation();
    this.map.keyboard.disableRotation();

    this.cities = new MarkerSet(this.map, {
      key: (city) => city.id,
      position: (city) => city.position,
      create: createCityElement,
      layer: MARKER_LAYERS.city,
      update: updateCityElement,
    });
    this.stops = new MarkerSet(this.map, {
      key: (stop) => stop.id,
      position: (stop) => stop.position,
      create: (stop) => createStopElement(stop, events.onStopClick),
      layer: MARKER_LAYERS.stop,
      update: updateStopElement,
    });
    this.figures = new MarkerSet(this.map, {
      key: (figure) => figure.slug,
      position: (figure) => figure.position,
      create: (figure) => createFigureElement(figure, events.onFigureClick),
      layer: MARKER_LAYERS.figure,
      update: updateFigureElement,
      moveDurationMs: FIGURE_MOVE_DURATION_MS,
    });

    const reportViewport = (): void => {
      const bounds = this.map.getBounds();
      events.onViewportChange({
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
      });
    };
    this.map.on('move', reportViewport);

    this.ready = new Promise((resolve, reject) => {
      this.map.once('load', () => {
        // A map that already reported a start-up error stays failed; its owner destroys it.
        if (this.failed) return;
        addTerrainLayers(this.map);
        addPathLayers(this.map);
        this.loaded = true;
        this.render();
        reportViewport();
        resolve();
      });
      // Before the map has loaded an error means it cannot start (missing map data, no WebGL);
      // afterwards the map keeps working, so the error is only reported.
      this.map.on('error', (event) => {
        console.error(this.loaded ? 'Map error' : 'The map could not start', event.error);
        if (!this.loaded) {
          this.failed = true;
          reject(event.error);
        }
      });
      this.abandon = reject;
    });
  }

  setScene(scene: MapScene): void {
    this.scene = scene;
    if (this.loaded) this.render();
  }

  setInsets(insets: Insets): void {
    this.insets = insets;
  }

  frame(points: LonLat[]): void {
    const [first, ...rest] = points;
    if (!first) return;
    const bounds = rest.reduce(
      (box, point) => box.extend(point as LngLatLike),
      new LngLatBounds(first as LngLatLike, first as LngLatLike),
    );
    this.map.fitBounds(bounds, {
      padding: {
        top: this.insets.top + FRAME_MARGIN_PX,
        right: this.insets.right + FRAME_MARGIN_PX,
        bottom: this.insets.bottom + FRAME_MARGIN_PX,
        left: this.insets.left + FRAME_MARGIN_PX,
      },
      maxZoom: MAX_FRAME_ZOOM,
      duration: CAMERA_DURATION_MS,
    });
  }

  panTo(point: LonLat): void {
    this.map.easeTo({ center: point, duration: CAMERA_DURATION_MS / 2 });
  }

  destroy(): void {
    // Nothing settles `ready` once the map is removed, so a map that never loaded says so itself.
    if (!this.loaded) this.abandon(new Error('The map was destroyed before it had loaded'));
    this.cities.clear();
    this.stops.clear();
    this.figures.clear();
    this.map.remove();
  }

  private render(): void {
    this.map.getSource<GeoJSONSource>('trails')?.setData(linesFeature(this.scene.trails));
    this.setPath('journey-ahead', this.scene.journeyAhead);
    this.setPath('journey-reached', this.scene.journeyReached);
    this.cities.sync(this.scene.cities);
    this.stops.sync(this.scene.stops);
    this.figures.sync(this.scene.figures);
  }

  private setPath(source: Exclude<PathSource, 'trails'>, coordinates: LonLat[]): void {
    this.map.getSource<GeoJSONSource>(source)?.setData(lineFeature(coordinates.length > 1 ? coordinates : []));
  }
}
