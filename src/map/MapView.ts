import type { FigureKind, Precision } from '../domain/types';

/** A point as [longitude, latitude]. */
export type LonLat = [number, number];

/** A city label that dresses the map even when nothing is selected. */
export interface CityMarker {
  id: string;
  position: LonLat;
  name: string;
  /** 1 for the most visited places; larger numbers are shown smaller or hidden. */
  rank: number;
}

/** A stop on the journey of the figure in focus. */
export interface StopMarker {
  id: string;
  position: LonLat;
  name: string;
  historicName?: string;
  years: string;
  event: string;
  precision: Precision;
  /** 1-based order of the stop in the journey. */
  order: number;
  /** Whether the figure has reached this stop by the selected year. */
  reached: boolean;
  /** Whether the figure is at this stop in the selected year. */
  current: boolean;
  /** Whether the stop is so close to the current one that it would cover it; such a stop is not drawn. */
  crowded: boolean;
}

/** A figure standing at the place where it was in the selected year. */
export interface FigureMarker {
  slug: string;
  position: LonLat;
  name: string;
  kind: FigureKind;
  focused: boolean;
  /** Index among the figures standing at the same place, used to fan them out. */
  stackIndex: number;
}

/** Everything the map shows for one application state. */
export interface MapScene {
  cities: CityMarker[];
  stops: StopMarker[];
  figures: FigureMarker[];
  /** Journey of the focused figure up to the selected year. */
  journeyReached: LonLat[];
  /** The rest of the journey of the focused figure. */
  journeyAhead: LonLat[];
  /** Line through the seats of the figures on the route (FR-16). */
  routePath: LonLat[];
}

export const EMPTY_SCENE: MapScene = {
  cities: [],
  stops: [],
  figures: [],
  journeyReached: [],
  journeyAhead: [],
  routePath: [],
};

/** The visible part of the map, in degrees. */
export interface Viewport {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface MapViewEvents {
  onFigureClick: (slug: string) => void;
  onViewportChange: (viewport: Viewport) => void;
}

/** Parts of the map covered by panels, in pixels; the camera keeps its subject out of them. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * The map as the rest of the application sees it. MapLibre and PixiJS both
 * implement this interface, so the renderer can be swapped without touching
 * anything else.
 */
export interface MapView {
  /** Resolves when the map can draw; rejects when the renderer is not supported. */
  ready: Promise<void>;
  setScene(scene: MapScene): void;
  setInsets(insets: Insets): void;
  /** Moves the camera so that all the given points are comfortably visible. */
  frame(points: LonLat[]): void;
  /** Centres the camera on a point without changing the zoom. */
  panTo(point: LonLat): void;
  destroy(): void;
}

export type MapViewFactory = (container: HTMLElement, events: MapViewEvents) => MapView;
