import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { activeFigureSlug, currentRoute, useAppStore, useRouteFigureSlugs } from '../app/store';
import { FALLBACK_MAP_KIND, type MapKind } from '../app/urlState';
import type { FigureCard } from '../domain/types';
import { createMapView } from '../map/createMapView';
import { buildScene, framingPoints } from '../map/mapScene';
import type { Insets, MapScene, MapView, Viewport } from '../map/MapView';
import { MiniMap } from './MiniMap';

/** Below this width the panel sits under the map instead of over it. */
const DESKTOP_MIN_WIDTH = 900;
const DESKTOP_INSETS: Insets = { top: 70, right: 20, bottom: 80, left: 470 };
const PHONE_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

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

/**
 * Creates the map renderer for the chosen kind and destroys it when the kind
 * changes. When the painted map cannot start (it needs more of WebGL than some
 * devices offer) the basic map takes over; when that fails too, `failed` is set.
 */
function useMapView(mapKind: MapKind): MapViewState {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<MapView | null>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [failed, setFailed] = useState(false);
  const openFigure = useAppStore((state) => state.openFigure);
  const setMapKind = useAppStore((state) => state.setMapKind);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let cancelled = false;
    let created: MapView | null = null;
    setFailed(false);
    createMapView(mapKind, container, { onFigureClick: openFigure, onViewportChange: setViewport })
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
        console.error(`Map renderer "${mapKind}" could not start`, error);
        created?.destroy();
        created = null;
        if (mapKind === FALLBACK_MAP_KIND) setFailed(true);
        else setMapKind(FALLBACK_MAP_KIND);
      });
    return () => {
      cancelled = true;
      setView(null);
      created?.destroy();
    };
  }, [mapKind, openFigure, setMapKind]);

  return { containerRef, view, viewport, failed };
}

/** What the map shows for the current route, focus and year. */
function useMapScene(): MapScene {
  const places = useAppStore((state) => state.world?.places);
  const cards = useAppStore((state) => state.cards);
  const year = useAppStore((state) => state.year);
  const activeSlug = useAppStore(activeFigureSlug);
  const routeSlugs = useRouteFigureSlugs();

  return useMemo(() => {
    const routeCards = routeSlugs
      .map((slug) => cards[slug])
      .filter((card): card is FigureCard => card !== undefined);
    return buildScene({
      places: places ?? [],
      routeCards,
      activeCard: activeSlug ? (cards[activeSlug] ?? null) : null,
      year,
    });
  }, [places, cards, routeSlugs, activeSlug, year]);
}

/** The map as the stage of the game: figures, journeys and the route for the selected year. */
export function MapStage() {
  const mapKind = useAppStore((state) => state.mapKind);
  const { containerRef, view, viewport, failed } = useMapView(mapKind);
  const scene = useMapScene();

  useEffect(() => {
    view?.setScene(scene);
  }, [scene, view]);

  // The camera follows the figure in focus, not the year: scrubbing time must not move the map.
  const activeSlug = useAppStore(activeFigureSlug);
  const routeKey = useAppStore((state) => currentRoute(state)?.id ?? '');
  const activeLoaded = useAppStore((state) => activeSlug !== null && activeSlug in state.cards);
  const sceneRef = useRef(scene);
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);
  useEffect(() => {
    if (!view) return;
    view.setInsets(currentInsets());
    view.frame(framingPoints(sceneRef.current));
  }, [view, activeSlug, routeKey, activeLoaded]);

  const figurePoints = useMemo(() => scene.figures.map((figure) => figure.position), [scene.figures]);

  return (
    <div className="stage" data-testid="map-stage" data-map-kind={mapKind} data-ready={view !== null || failed}>
      <div ref={containerRef} className="stage__map" key={mapKind} />
      {failed && (
        <p className="stage__error stone" role="alert" data-testid="map-error">
          Harita bu cihazda açılamadı. Kartları ve rotayı kullanmaya devam edebilirsin.
        </p>
      )}
      <MiniMap viewport={viewport} points={figurePoints} onJump={(point) => view?.panTo(point)} />
    </div>
  );
}
