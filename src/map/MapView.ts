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

/** A place on the map: a numbered stop of an open journey, or the place where a figure stands this year. */
export interface StopMarker {
  id: string;
  position: LonLat;
  name: string;
  historicName?: string;
  years: string;
  event: string;
  precision: Precision;
  /** 1-based order of the stop in an open journey; null for the place of a figure whose journey is not open. */
  order: number | null;
  /** The journey stop the marker stands for, which clicking it goes to; null for the place of a figure. */
  target: { figure: string; stopIndex: number } | null;
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
  /** Whether the content has a portrait of the figure; the banner shows it instead of the emblem of the kind. */
  portrait: boolean;
  focused: boolean;
  /** Index among the figures standing at the same place, used to fan them out. */
  stackIndex: number;
}

/** Everything the map shows for one application state. */
export interface MapScene {
  cities: CityMarker[];
  stops: StopMarker[];
  figures: FigureMarker[];
  /** The way each figure on the map came to where it stands this year. */
  trails: LonLat[][];
  /** Journey of the focused figure up to the selected year, within the group of stops that is shown; empty unless the journey is switched on. */
  journeyReached: LonLat[];
  /** The rest of the journey of the focused figure. */
  journeyAhead: LonLat[];
  /** Points the camera frames for this scene: the stops of the figure in focus that are shown, or its whole journey when it is hidden. */
  focusPoints: LonLat[];
}

export const EMPTY_SCENE: MapScene = {
  cities: [],
  stops: [],
  figures: [],
  trails: [],
  journeyReached: [],
  journeyAhead: [],
  focusPoints: [],
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
  /** A numbered stop of an open journey was chosen. */
  onStopClick: (figure: string, stopIndex: number) => void;
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
