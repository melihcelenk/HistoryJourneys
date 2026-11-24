import { MAP_KINDS, type MapKind } from '../app/urlState';
import type { MapView, MapViewEvents } from './MapView';

/** Map renderers this build offers, in the order they are listed in the settings. */
export const AVAILABLE_MAP_KINDS: readonly MapKind[] = MAP_KINDS;

type MapViewLoader = (container: HTMLElement, events: MapViewEvents) => Promise<MapView>;

/** How each kind of map is loaded; a new kind does not compile until it has a loader here. */
const LOADERS: Record<MapKind, MapViewLoader> = {
  pixi: async (container, events) => new (await import('./PixiMapView')).PixiMapView(container, events),
  maplibre: async (container, events) => new (await import('./MapLibreMapView')).MapLibreMapView(container, events),
};

/**
 * Creates the map renderer for the chosen kind. Renderers are loaded on demand
 * so that only the one in use is downloaded.
 */
export function createMapView(kind: MapKind, container: HTMLElement, events: MapViewEvents): Promise<MapView> {
  return LOADERS[kind](container, events);
}
