import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { ContentRepository } from '../data/ContentRepository';
import { activeYear } from '../domain/journey';
import { findRoutes, type Route } from '../domain/routeEngine';
import type { Concept, FigureCard, FigureSummary, World } from '../domain/types';
import { DEFAULT_MAP_KIND, type MapKind, type UrlState } from './urlState';

export type EndpointSlot = 'from' | 'to';

export type Dialog =
  | { kind: 'picker'; slot: EndpointSlot }
  | { kind: 'concept'; concept: Concept }
  | { kind: 'quiz' }
  | { kind: 'about' }
  | { kind: 'settings' };

export interface AppState {
  status: 'loading' | 'ready' | 'error';
  world: World | null;
  /** Cards loaded so far, by figure slug. */
  cards: Record<string, FigureCard>;
  /** Figures whose card could not be loaded; opening the figure again retries. */
  failedCards: string[];
  from: string | null;
  to: string | null;
  routes: Route[];
  routeIndex: number;
  /** Figure whose card is open on the route. */
  focus: string | null;
  /** Figures opened as a detour from the route, most recent last (FR-11). */
  detour: string[];
  year: number;
  playing: boolean;
  dialog: Dialog | null;
  mapKind: MapKind;

  init: (repository: ContentRepository, initial: UrlState) => Promise<void>;
  /** Marks the application as unable to start. */
  failToLoad: () => void;
  setEndpoint: (slot: EndpointSlot, slug: string) => void;
  startJourney: (from: string, to: string) => void;
  swapEndpoints: () => void;
  clearJourney: () => void;
  selectRoute: (index: number) => void;
  openFigure: (slug: string) => void;
  closeDetour: () => void;
  openConcept: (slug: string) => Promise<void>;
  setYear: (year: number) => void;
  setPlaying: (playing: boolean) => void;
  setMapKind: (kind: MapKind) => void;
  openDialog: (dialog: Dialog) => void;
  closeDialog: () => void;
  applyUrlState: (state: UrlState) => void;
}

/** Year shown before any figure is chosen: the conquest of Constantinople. */
const DEFAULT_YEAR = 1453;

let repository: ContentRepository | null = null;

function figureOf(world: World | null, slug: string | null): FigureSummary | undefined {
  return world?.figures.find((figure) => figure.slug === slug);
}

/** Year in which the given figure was most active; the default year when the figure is unknown. */
function activeYearOf(world: World | null, slug: string | null): number {
  const figure = figureOf(world, slug);
  return figure ? activeYear(figure) : DEFAULT_YEAR;
}

/** What a link asks for when routes are recomputed. */
type RoutePreference = Partial<Pick<UrlState, 'routeIndex' | 'focus' | 'year'>>;

function routeFigures(route: Route | undefined): string[] {
  return route?.steps.map((step) => step.figure) ?? [];
}

/** The figure currently in front of the reader: the detour card if any, otherwise the focused route card. */
export function activeFigureSlug(state: Pick<AppState, 'detour' | 'focus' | 'from'>): string | null {
  return state.detour.at(-1) ?? state.focus ?? state.from;
}

export function currentRoute(state: Pick<AppState, 'routes' | 'routeIndex'>): Route | undefined {
  return state.routes[state.routeIndex];
}

export const useAppStore = create<AppState>((set, get) => {
  /**
   * Loads the cards that are not cached yet; unknown slugs are ignored. A card
   * that fails to load is logged and recorded, so that the interface can say so
   * and the other cards still arrive.
   */
  async function ensureCards(slugs: string[]): Promise<void> {
    const source = repository;
    if (!source) return;
    const missing = [...new Set(slugs)].filter((slug) => !(slug in get().cards));
    if (missing.length === 0) return;
    const results = await Promise.allSettled(missing.map((slug) => source.getFigureCard(slug)));
    const loaded: Record<string, FigureCard> = {};
    const failed: string[] = [];
    results.forEach((result, index) => {
      const slug = missing[index] ?? '';
      if (result.status === 'rejected') {
        console.error(`Card "${slug}" could not be loaded`, result.reason);
        failed.push(slug);
      } else if (result.value) {
        loaded[result.value.slug] = result.value;
      }
    });
    set((state) => ({
      cards: { ...state.cards, ...loaded },
      failedCards: [...state.failedCards.filter((slug) => !missing.includes(slug)), ...failed],
    }));
  }

  /** Writes the two ends of the journey; the same figure can never be at both ends. */
  function setEndpoints(from: string | null, to: string | null): void {
    set({ from, to: to === from ? null : to, dialog: null });
    recomputeRoutes();
  }

  /** Recomputes the routes for the current endpoints and puts the reader on the preferred or the first card. */
  function recomputeRoutes(preferred: RoutePreference = {}): void {
    const { world, from, to } = get();
    if (!world) return;
    if (!from) {
      set({ routes: [], routeIndex: 0, focus: null, detour: [], playing: false });
      return;
    }
    const routes = to ? findRoutes(world, from, to) : [];
    const routeIndex = Math.min(preferred.routeIndex ?? 0, Math.max(routes.length - 1, 0));
    const onRoute = routeFigures(routes[routeIndex]);
    const focus = preferred.focus && onRoute.includes(preferred.focus) ? preferred.focus : (onRoute[0] ?? from);
    set({
      routes,
      routeIndex,
      focus,
      detour: [],
      playing: false,
      year: preferred.year ?? activeYearOf(world, focus),
    });
    void ensureCards([from, ...(to ? [to] : []), ...onRoute]);
  }

  /** Opens the detour a link points to, keeping the year of the link. */
  function openDetourFromLink(slug: string | null, year: number | null): void {
    const detour = figureOf(get().world, slug);
    if (!detour || detour.slug === get().focus) return;
    get().openFigure(detour.slug);
    if (year !== null) set({ year });
  }

  return {
    status: 'loading',
    world: null,
    cards: {},
    failedCards: [],
    from: null,
    to: null,
    routes: [],
    routeIndex: 0,
    focus: null,
    detour: [],
    year: DEFAULT_YEAR,
    playing: false,
    dialog: null,
    mapKind: DEFAULT_MAP_KIND,

    init: async (contentRepository, initial) => {
      try {
        repository = contentRepository;
        const world = await contentRepository.loadWorld();
        set({ world, status: 'ready' });
        get().applyUrlState(initial);
      } catch (error) {
        console.error('Content could not be loaded', error);
        repository = null;
        contentRepository.close();
        set({ status: 'error' });
      }
    },

    failToLoad: () => set({ status: 'error' }),

    setEndpoint: (slot, slug) => {
      const state = get();
      if (!figureOf(state.world, slug)) return;
      // Choosing the figure that is at the other end moves it: the other end becomes empty.
      if (slot === 'from') setEndpoints(slug, state.to === slug ? null : state.to);
      else setEndpoints(state.from === slug ? null : state.from, slug);
    },

    startJourney: (from, to) => {
      const { world } = get();
      if (from === to || !figureOf(world, from) || !figureOf(world, to)) return;
      setEndpoints(from, to);
    },

    swapEndpoints: () => {
      const { from, to } = get();
      if (!from || !to) return;
      set({ from: to, to: from });
      recomputeRoutes();
    },

    clearJourney: () =>
      set({ from: null, to: null, routes: [], routeIndex: 0, focus: null, detour: [], playing: false, year: DEFAULT_YEAR }),

    selectRoute: (index) => {
      const { routes, world } = get();
      const route = routes[index];
      if (!route) return;
      const focus = route.steps[0]?.figure ?? null;
      const figure = figureOf(world, focus);
      set({ routeIndex: index, focus, detour: [], playing: false, year: figure ? activeYear(figure) : get().year });
      void ensureCards(routeFigures(route));
    },

    openFigure: (slug) => {
      const state = get();
      const figure = figureOf(state.world, slug);
      if (!figure) return;
      const onRoute = routeFigures(currentRoute(state)).includes(slug);
      if (!state.from) {
        // No start yet: the figure becomes the starting point, and the route to a chosen destination is computed.
        setEndpoints(slug, state.to);
      } else if (onRoute) {
        set({ focus: slug, detour: [], year: activeYear(figure), playing: false, dialog: null });
      } else {
        const detour = state.detour.at(-1) === slug ? state.detour : [...state.detour, slug];
        set({ detour, year: activeYear(figure), playing: false, dialog: null });
      }
      void ensureCards([slug]);
    },

    closeDetour: () => {
      const state = get();
      const detour = state.detour.slice(0, -1);
      const back = figureOf(state.world, detour.at(-1) ?? state.focus);
      set({ detour, year: back ? activeYear(back) : state.year });
    },

    openConcept: async (slug) => {
      const source = repository;
      if (!source) return;
      const dialogBefore = get().dialog;
      let concept: Concept | null;
      try {
        concept = await source.getConcept(slug);
      } catch (error) {
        console.error(`Concept "${slug}" could not be loaded`, error);
        return;
      }
      if (!concept) {
        console.warn(`Concept "${slug}" is not in the content`);
        return;
      }
      // The reader may have opened or closed something while the concept was loading.
      if (get().dialog === dialogBefore) set({ dialog: { kind: 'concept', concept } });
    },

    setYear: (year) => set({ year }),
    setPlaying: (playing) => set({ playing }),
    setMapKind: (mapKind) => set({ mapKind }),
    openDialog: (dialog) => set({ dialog }),
    closeDialog: () => set({ dialog: null }),

    applyUrlState: (url) => {
      const { world } = get();
      if (!world) return;
      if (url.map) set({ mapKind: url.map });
      const from = figureOf(world, url.from)?.slug ?? null;
      if (!from) {
        get().clearJourney();
        return;
      }
      const to = figureOf(world, url.to)?.slug ?? null;
      set({ from, to: to === from ? null : to });
      recomputeRoutes({ routeIndex: url.routeIndex, focus: url.focus ?? undefined, year: url.year ?? undefined });
      openDetourFromLink(url.detour, url.year);
    },
  };
});

const NO_FIGURES: string[] = [];

/** Slugs of the figures on the chosen route, in order; the same array as long as the route is the same. */
export function useRouteFigureSlugs(): string[] {
  return useAppStore(useShallow((state) => currentRoute(state)?.steps.map((step) => step.figure) ?? NO_FIGURES));
}

/** The shareable part of the state, in the shape the URL uses. */
export function toUrlState(state: AppState): UrlState {
  const hasRoute = state.from !== null && state.to !== null;
  return {
    from: state.from,
    to: state.to,
    routeIndex: state.routeIndex,
    focus: hasRoute ? state.focus : null,
    detour: state.detour.at(-1) ?? null,
    year: hasRoute ? state.year : null,
    map: state.mapKind === DEFAULT_MAP_KIND ? null : state.mapKind,
  };
}
