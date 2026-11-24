import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { activeFigureSlug, currentRoute, useAppStore, useRouteCards } from '../app/store';
import { FALLBACK_MAP_KIND, type MapKind } from '../app/urlState';
import { createMapView } from '../map/createMapView';
import { buildScene, framingPoints } from '../map/mapScene';
import type { Insets, MapScene, MapView, Viewport } from '../map/MapView';
import { JourneyGroups, useShownJourney } from './JourneyGroups';
import { MAP_KIND_LABELS } from './mapKindLabels';
import { MiniMap } from './MiniMap';

/** Below this width the panel sits under the map instead of over it. */
const DESKTOP_MIN_WIDTH = 900;
/** Room for the panel on the left, the stop groups above, the caption of an event below and stop cards at the right edge. */
const DESKTOP_INSETS: Insets = { top: 120, right: 140, bottom: 170, left: 470 };
/** On a phone only the strip of stop groups lies on the map, along its top edge. */
const PHONE_INSETS: Insets = { top: 56, right: 0, bottom: 0, left: 0 };

function currentInsets(): Insets {
  return window.innerWidth >= DESKTOP_MIN_WIDTH ? DESKTOP_INSETS : PHONE_INSETS;
}

interface MapViewState {
  containerRef: RefObject<HTMLDivElement | null>;
  /** The renderer once it can draw; null while it starts or after it failed. */
  view: MapView | null;
  viewport: Viewport | null;
  /** True when no renderer could start on this device. */
  failed: boolean;
}

/** How many times a renderer is started before giving up; a start can fail for a passing reason, such as a download that broke off. */
const START_ATTEMPTS = 2;

/** What went wrong, in a few words, for the note shown to the reader. */
function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Creates the map renderer for the chosen kind and destroys it when the kind
 * changes. A renderer that cannot start is tried once more. When the painted
 * map still cannot start (it needs more of WebGL than some devices offer) the
 * plain map takes over and the failure is recorded, so that the reader is told
 * instead of being left on a map they did not choose; when the plain map
 * fails too, `failed` is set.
 */
function useMapView(mapKind: MapKind): MapViewState {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<MapView | null>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [failed, setFailed] = useState(false);
  const openFigure = useAppStore((state) => state.openFigure);
  const goToStop = useAppStore((state) => state.goToStop);
  const reportMapFailure = useAppStore((state) => state.reportMapFailure);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let cancelled = false;
    let created: MapView | null = null;
    setFailed(false);
    const start = (attempt: number): void => {
      createMapView(mapKind, container, { onFigureClick: openFigure, onStopClick: goToStop, onViewportChange: setViewport })
        .then((mapView) => {
          created = mapView;
          if (cancelled) mapView.destroy();
          return mapView.ready;
        })
        .then(() => {
          if (!cancelled) setView(created);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          created?.destroy();
          created = null;
          if (attempt < START_ATTEMPTS) {
            // It is tried again at once, so this is not yet a failure.
            console.warn(`Map renderer "${mapKind}" did not start; trying again`, error);
            start(attempt + 1);
            return;
          }
          console.error(`Map renderer "${mapKind}" could not start`, error);
          if (mapKind === FALLBACK_MAP_KIND) setFailed(true);
          else reportMapFailure(mapKind, reasonOf(error));
        });
    };
    start(1);
    return () => {
      cancelled = true;
      setView(null);
      created?.destroy();
    };
  }, [mapKind, openFigure, goToStop, reportMapFailure]);

  return { containerRef, view, viewport, failed };
}

/** What the map shows for the current route, focus and year. */
function useMapScene(): MapScene {
  const places = useAppStore((state) => state.world?.places);
  const cards = useAppStore((state) => state.cards);
  const year = useAppStore((state) => state.year);
  const showJourney = useAppStore((state) => state.showJourney);
  const showLines = useAppStore((state) => state.showLines);
  const spotlight = useAppStore((state) => state.spotlight);
  const activeSlug = useAppStore(activeFigureSlug);
  const routeCards = useRouteCards();

  return useMemo(() => {
    return buildScene({
      places: places ?? [],
      routeCards,
      activeCard: activeSlug ? (cards[activeSlug] ?? null) : null,
      year,
      showJourney,
      showLines,
      spotlight: spotlight ? { figure: spotlight.figure, stopIndex: spotlight.stopIndex } : undefined,
    });
  }, [places, cards, routeCards, activeSlug, year, showJourney, showLines, spotlight]);
}

/** The map as the stage of the game: figures, journeys and the route for the selected year. */
export function MapStage() {
  const mapKind = useAppStore((state) => state.mapKind);
  const { containerRef, view, viewport, failed } = useMapView(mapKind);
  const scene = useMapScene();
  const mapFailure = useAppStore((state) => state.mapFailure);

  useEffect(() => {
    view?.setScene(scene);
  }, [scene, view]);

  // The camera follows the figure in focus and the group of its stops that is shown, not the year: scrubbing
  // time within a group must not move the map.
  const activeSlug = useAppStore(activeFigureSlug);
  const routeKey = useAppStore((state) => currentRoute(state)?.id ?? '');
  const activeLoaded = useAppStore((state) => activeSlug !== null && activeSlug in state.cards);
  const shownGroup = useShownJourney()?.active ?? -1;
  const subject = `${activeSlug}|${routeKey}|${activeLoaded}|${shownGroup}`;
  const spotlight = useAppStore((state) => state.spotlight);
  const sceneRef = useRef(scene);
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);
  const framed = useRef<{ view: MapView; subject: string } | null>(null);
  useEffect(() => {
    if (!view) return;
    if (framed.current?.view !== view || framed.current.subject !== subject) {
      framed.current = { view, subject };
      view.setInsets(currentInsets());
      view.frame(framingPoints(sceneRef.current));
    } else if (spotlight) {
      // The subject is already in the frame: while an event is told, the camera goes to where it happens.
      view.panTo([spotlight.place.lon, spotlight.place.lat]);
    }
  }, [view, subject, spotlight]);

  const figurePoints = useMemo(() => scene.figures.map((figure) => figure.position), [scene.figures]);

  return (
    <div className="stage" data-testid="map-stage" data-map-kind={mapKind} data-ready={view !== null || failed}>
      <div ref={containerRef} className="stage__map" key={mapKind} />
      {failed && (
        <p className="stage__error stone" role="alert" data-testid="map-error">
          Harita bu cihazda açılamadı. Kartları ve rotayı kullanmaya devam edebilirsin.
        </p>
      )}
      {mapFailure && (
        <p className="stage__notice stone" role="status" data-testid="map-notice">
          <strong>{MAP_KIND_LABELS[mapFailure.kind].name} açılamadı;</strong> {MAP_KIND_LABELS[FALLBACK_MAP_KIND].name.toLocaleLowerCase('tr')} gösteriliyor.
          <span className="stage__notice-reason"> ({mapFailure.reason})</span>
        </p>
      )}
      {spotlight && (
        <p className="chronicle parchment" data-testid="chronicle" aria-live="polite">
          <span className="display chronicle__year">{spotlight.year}</span>
          <span className="chronicle__who">
            <strong>{spotlight.figureName}</strong> · {spotlight.placeName} ({spotlight.years})
          </span>
          <span className="chronicle__text">{spotlight.text}</span>
        </p>
      )}
      <JourneyGroups />
      <MiniMap viewport={viewport} points={figurePoints} onJump={(point) => view?.panTo(point)} />
    </div>
  );
}
