import { useMemo } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { ContentRepository } from '../data/ContentRepository';
import { type ChronicleEvent, eventOfStop } from '../domain/chronicle';
import { findRoutes, type Route, type RouteKind } from '../domain/routeEngine';
import type { Concept, FigureCard, FigureSummary, World } from '../domain/types';
import { DEFAULT_MAP_KIND, FALLBACK_MAP_KIND, type MapKind, type UrlState } from './urlState';

export type EndpointSlot = 'from' | 'to';

export type Dialog =
  | { kind: 'picker'; slot: EndpointSlot }
  | { kind: 'concept'; concept: Concept }
  | { kind: 'relations'; figure: string }
  | { kind: 'quiz' }
  | { kind: 'about' }
  | { kind: 'settings' };

/** The parts of a card, in the order of its tabs; the first one is open when nothing else was chosen. */
export const CARD_TABS = ['overview', 'journey', 'relations', 'sources'] as const;
export type CardTab = (typeof CARD_TABS)[number];

/** Playback speeds, in the order the speed button cycles through them. */
export const PLAYBACK_SPEEDS = [1, 2, 0.5] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

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
  /** The kind of route the reader asked for; the route that is open may be of another kind when this one does not exist. */
  routeKind: RouteKind;
  /** Figure whose card is open on the route; null in the overview, where no card is open. */
  focus: string | null;
  /** Figures opened as a detour from the route, most recent last (FR-11). */
  detour: string[];
  year: number;
  /**
   * A figure that was opened before its card arrived: time waits at its birth and goes to the first stop of its
   * journey once the card is there, unless the reader has moved time meanwhile.
   */
  awaitingStart: string | null;
  /** The tab that is open on a card; kept from one card to the next. */
  cardTab: CardTab;
  playing: boolean;
  speed: PlaybackSpeed;
  /** The event playback is telling about; the map and the caption follow it. */
  spotlight: ChronicleEvent | null;
  /** Whether the journey of the figure in focus is drawn on the map. */
  showJourney: boolean;
  /** Whether the lines between stops are drawn on the map. */
  showLines: boolean;
  dialog: Dialog | null;
  mapKind: MapKind;
  /** The map the reader chose but that could not start on this device, and why; the plain map is shown in its place. */
  mapFailure: { kind: MapKind; reason: string } | null;

  init: (repository: ContentRepository, initial: UrlState) => Promise<void>;
  /** Marks the application as unable to start. */
  failToLoad: () => void;
  setEndpoint: (slot: EndpointSlot, slug: string) => void;
  startJourney: (from: string, to: string) => void;
  swapEndpoints: () => void;
  clearJourney: () => void;
  selectRoute: (index: number) => void;
  /** Chooses the kind of route; during a journey the route of that kind opens, if there is one. */
  setRouteKind: (kind: RouteKind) => void;
  openFigure: (slug: string) => void;
  /** Closes the open card and any detour: the reader sees the whole route. */
  closeFigure: () => void;
  closeDetour: () => void;
  openConcept: (slug: string) => Promise<void>;
  setYear: (year: number) => void;
  setPlaying: (playing: boolean) => void;
  /** Moves time to an event and puts it in the spotlight; used by playback. */
  tell: (event: ChronicleEvent) => void;
  /** Moves time to a stop of the journey of a figure and tells what happened there. */
  goToStop: (figure: string, stopIndex: number) => void;
  cycleSpeed: () => void;
  toggleJourney: () => void;
  toggleLines: () => void;
  setCardTab: (tab: CardTab) => void;
  setMapKind: (kind: MapKind) => void;
  /** Records that a map could not start and shows the plain map instead. */
  reportMapFailure: (kind: MapKind, reason: string) => void;
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


/** What a link asks for when routes are recomputed. */
type RoutePreference = Partial<Pick<UrlState, 'routeIndex' | 'focus' | 'year' | 'overview'>>;

/** Which route opens: the one a link names; otherwise the route of the kind the reader chose, or the first one. */
function routeIndexFor(routes: Route[], preferred: RoutePreference, chosenKind: RouteKind): number {
  const ofChosenKind = Math.max(
    routes.findIndex((route) => route.kind === chosenKind),
    0,
  );
  return Math.min(preferred.routeIndex ?? ofChosenKind, Math.max(routes.length - 1, 0));
}

/** Which card opens on a route: none in the overview; otherwise the card a link names, or the first one. */
function focusFor(onRoute: string[], preferred: RoutePreference, first: string): string | null {
  if (preferred.overview && onRoute.length > 0) return null;
  return preferred.focus && onRoute.includes(preferred.focus) ? preferred.focus : first;
}

function routeFigures(route: Route | undefined): string[] {
  return route?.steps.map((step) => step.figure) ?? [];
}

/**
 * The figure currently in front of the reader: the detour card if any, otherwise the open route card. On a route
 * with no card open (the overview) there is none; without a route it is the starting figure.
 */
export function activeFigureSlug(state: Pick<AppState, 'detour' | 'focus' | 'from' | 'routes'>): string | null {
  return state.detour.at(-1) ?? state.focus ?? (state.routes.length > 0 ? null : state.from);
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
    settleStart(loaded);
  }

  /**
   * Where time goes when a figure is opened: to the first stop of its journey, so that the journey is followed
   * from its beginning. While the card is still on its way time waits at the birth of the figure, and the figure
   * is remembered so that time moves on when the card arrives.
   */
  function startOf(slug: string | null): Pick<AppState, 'year' | 'awaitingStart'> {
    const { world, cards } = get();
    const figure = figureOf(world, slug);
    if (!figure) return { year: DEFAULT_YEAR, awaitingStart: null };
    const card = cards[figure.slug];
    if (!card) return { year: figure.birthYear, awaitingStart: figure.slug };
    return { year: card.journey[0]?.from ?? figure.birthYear, awaitingStart: null };
  }

  /** Moves time to the first stop of a figure whose card has just arrived, if the reader is still waiting for it. */
  function settleStart(loaded: Record<string, FigureCard>): void {
    const state = get();
    const card = state.awaitingStart ? loaded[state.awaitingStart] : undefined;
    if (!card) return;
    const stillOpen = activeFigureSlug(state) === card.slug;
    set({ awaitingStart: null, year: stillOpen ? (card.journey[0]?.from ?? state.year) : state.year });
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
      set({ routes: [], routeIndex: 0, focus: null, detour: [], playing: false, spotlight: null, awaitingStart: null });
      return;
    }
    const routes = to ? findRoutes(world, from, to) : [];
    const routeIndex = routeIndexFor(routes, preferred, get().routeKind);
    const onRoute = routeFigures(routes[routeIndex]);
    const first = onRoute[0] ?? from;
    const focus = focusFor(onRoute, preferred, first);
    const linkYear = preferred.year ?? null;
    set({
      routes,
      routeIndex,
      focus,
      detour: [],
      playing: false,
      spotlight: null,
      // A link says where in time it was made; otherwise the figure that opens begins its journey.
      ...(linkYear === null ? startOf(focus ?? first) : { year: linkYear, awaitingStart: null }),
    });
    void ensureCards([from, ...(to ? [to] : []), ...onRoute]);
  }

  /** Opens the detour a link points to, keeping the year of the link. */
  function openDetourFromLink(slug: string | null, year: number | null): void {
    const detour = figureOf(get().world, slug);
    if (!detour || detour.slug === get().focus) return;
    get().openFigure(detour.slug);
    // The link says where in time it was made: the detour does not start over at its first stop.
    if (year !== null) set({ year, awaitingStart: null });
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
    routeKind: 'direct',
    focus: null,
    detour: [],
    year: DEFAULT_YEAR,
    awaitingStart: null,
    cardTab: CARD_TABS[0],
    playing: false,
    speed: 1,
    spotlight: null,
    showJourney: true,
    showLines: true,
    dialog: null,
    mapKind: DEFAULT_MAP_KIND,
    mapFailure: null,

    init: async (contentRepository, initial) => {
      try {
        repository = contentRepository;
        const world = await contentRepository.loadWorld();
        set({ world, status: 'ready' });
        get().applyUrlState(initial);
      } catch (error) {
        console.error('Content could not be loaded', error);
        repository = null;
        // The error screen comes first: a repository that cannot even be closed must not keep the reader waiting.
        set({ status: 'error' });
        try {
          contentRepository.close();
        } catch (closeError) {
          console.error('The content repository could not be closed', closeError);
        }
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
      set({ from: null, to: null, routes: [], routeIndex: 0, focus: null, detour: [], playing: false, spotlight: null, year: DEFAULT_YEAR, awaitingStart: null }),

    selectRoute: (index) => {
      const route = get().routes[index];
      if (!route) return;
      const focus = route.steps[0]?.figure ?? null;
      set({ routeIndex: index, focus, detour: [], playing: false, spotlight: null, ...startOf(focus) });
      void ensureCards(routeFigures(route));
    },

    setRouteKind: (kind) => {
      set({ routeKind: kind });
      const { routes, routeIndex } = get();
      const index = routes.findIndex((route) => route.kind === kind);
      if (index >= 0 && index !== routeIndex) get().selectRoute(index);
    },

    openFigure: (slug) => {
      const state = get();
      const figure = figureOf(state.world, slug);
      if (!figure) return;
      if (activeFigureSlug(state) === slug) {
        // The figure is already in front of the reader (its banner on the map, a retry of its card): time stays where it is.
        set({ dialog: null });
        void ensureCards([slug]);
        return;
      }
      const onRoute = routeFigures(currentRoute(state)).includes(slug);
      if (!state.from) {
        // No start yet: the figure becomes the starting point, and the route to a chosen destination is computed.
        // Setting the endpoints loads the card of the figure too.
        setEndpoints(slug, state.to);
        return;
      }
      if (onRoute) {
        set({ focus: slug, detour: [], ...startOf(slug), playing: false, spotlight: null, dialog: null });
      } else {
        const detour = state.detour.at(-1) === slug ? state.detour : [...state.detour, slug];
        set({ detour, ...startOf(slug), playing: false, spotlight: null, dialog: null });
      }
      void ensureCards([slug]);
    },

    closeFigure: () => {
      // Without a route there is nothing to look at but the card itself.
      if (get().routes.length === 0) return;
      set({ focus: null, detour: [], playing: false, spotlight: null });
    },

    closeDetour: () => {
      const state = get();
      // Nothing to leave: the card that is open stays as it is.
      if (state.detour.length === 0) return;
      const detour = state.detour.slice(0, -1);
      const back = detour.at(-1) ?? state.focus;
      // Back in the overview nobody is open: time stays where it is.
      set({ detour, ...(back ? startOf(back) : { awaitingStart: null }), playing: false, spotlight: null });
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

    // Choosing a year by hand ends the telling of an event, and the wait for the first stop of a card on its way.
    setYear: (year) => set({ year, spotlight: null, awaitingStart: null }),
    setPlaying: (playing) => set({ playing }),
    tell: (event) => set({ year: event.year, spotlight: event, awaitingStart: null }),
    goToStop: (figure, stopIndex) => {
      const card = get().cards[figure];
      const event = card ? eventOfStop(card, stopIndex) : null;
      if (event) set({ year: event.year, spotlight: event, playing: false, awaitingStart: null });
    },
    cycleSpeed: () =>
      set((state) => ({ speed: PLAYBACK_SPEEDS[(PLAYBACK_SPEEDS.indexOf(state.speed) + 1) % PLAYBACK_SPEEDS.length] ?? 1 })),
    toggleJourney: () => set((state) => ({ showJourney: !state.showJourney })),
    toggleLines: () => set((state) => ({ showLines: !state.showLines })),
    setCardTab: (cardTab) => set({ cardTab }),
    // Choosing a map is a fresh start: what failed before is forgotten.
    setMapKind: (mapKind) => set({ mapKind, mapFailure: null }),
    reportMapFailure: (kind, reason) => set({ mapKind: FALLBACK_MAP_KIND, mapFailure: { kind, reason } }),
    openDialog: (dialog) => set({ dialog }),
    closeDialog: () => set({ dialog: null }),

    applyUrlState: (url) => {
      const { world } = get();
      if (!world) return;
      // A link that names no map means the map the game opens with.
      set({ mapKind: url.map ?? DEFAULT_MAP_KIND });
      set({ showJourney: url.showJourney, showLines: url.showLines });
      const from = figureOf(world, url.from)?.slug ?? null;
      if (!from) {
        get().clearJourney();
        return;
      }
      const to = figureOf(world, url.to)?.slug ?? null;
      set({ from, to: to === from ? null : to });
      recomputeRoutes({ routeIndex: url.routeIndex, focus: url.focus ?? undefined, year: url.year ?? undefined, overview: url.overview });
      // The link decides which route is open; the choice of kind follows it.
      const opened = currentRoute(get());
      if (opened) set({ routeKind: opened.kind });
      openDetourFromLink(url.detour, url.year);
    },
  };
});

const NO_FIGURES: string[] = [];

/** Slugs of the figures on the chosen route, in order; the same array as long as the route is the same. */
export function useRouteFigureSlugs(): string[] {
  return useAppStore(useShallow((state) => currentRoute(state)?.steps.map((step) => step.figure) ?? NO_FIGURES));
}

/** Cards of the figures on the chosen route, in order; cards that have not loaded yet are left out. */
export function useRouteCards(): FigureCard[] {
  const slugs = useRouteFigureSlugs();
  const cards = useAppStore((state) => state.cards);
  return useMemo(() => slugs.flatMap((slug) => (cards[slug] ? [cards[slug]] : [])), [slugs, cards]);
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
    // A detour from the overview keeps the overview underneath it, so that the way back leads there.
    overview: state.routes.length > 0 && state.focus === null,
    showJourney: state.showJourney,
    showLines: state.showLines,
    map: state.mapKind === DEFAULT_MAP_KIND ? null : state.mapKind,
  };
}
