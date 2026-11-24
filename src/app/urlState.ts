/**
 * Two-way mapping between the shareable part of the application state and the
 * URL hash (NFR-3). Examples:
 *   #/                                   start screen
 *   #/yol/ataturk/mehmed-ii?r=1&k=ahmed-i&y=1609
 *   #/yol/ataturk/mehmed-ii?k=ahmed-i&d=kosem-sultan
 */

import { SLUG_PATTERN } from '../domain/contentSchema';

/** Map renderers, in the order they are offered. */
export const MAP_KINDS = ['maplibre', 'pixi'] as const;
export type MapKind = (typeof MAP_KINDS)[number];
/** The renderer the game opens with and a link without a renderer means: the plain map, which works on every device. It is left out of links. */
export const DEFAULT_MAP_KIND: MapKind = 'maplibre';
/** The renderer that works everywhere; it takes over when another one cannot start. */
export const FALLBACK_MAP_KIND: MapKind = 'maplibre';

export interface UrlState {
  from: string | null;
  to: string | null;
  /** Index of the chosen route among the alternatives. */
  routeIndex: number;
  /** Figure whose card is open on the route. */
  focus: string | null;
  /** Figure opened as a detour from the route. */
  detour: string | null;
  year: number | null;
  /** Whether no card is open on the route: the reader looks at the whole route. */
  overview: boolean;
  /** Whether the journey of the figure in focus is drawn on the map. */
  showJourney: boolean;
  /** Whether the lines between stops are drawn on the map. */
  showLines: boolean;
  map: MapKind | null;
}

export const EMPTY_URL_STATE: UrlState = {
  from: null,
  to: null,
  routeIndex: 0,
  focus: null,
  detour: null,
  year: null,
  overview: false,
  showJourney: true,
  showLines: true,
  map: null,
};

const ROUTE_PREFIX = 'yol';
const MAX_ROUTE_INDEX = 9;
/** Years a link may carry; anything outside is ignored rather than shown on the timeline. */
const MIN_YEAR = -3000;
const MAX_YEAR = 2100;
/** Names of the query parameters, shared by parsing and formatting. */
const PARAM = { route: 'r', focus: 'k', detour: 'd', year: 'y', overview: 'g', journey: 'j', lines: 'l', map: 'map' } as const;
/** A switch is written to the link only when it differs from its default: "1" turns on one that is off by default. */
const ON = '1';
/** "0" turns off a switch that is on by default. */
const OFF = '0';

function slugOrNull(value: string | null | undefined): string | null {
  return value && SLUG_PATTERN.test(value) ? value : null;
}

/** A year from a link, or null when it is missing, malformed or outside history. */
function yearOrNull(value: string | null): number | null {
  const year = intOrNull(value);
  return year !== null && year >= MIN_YEAR && year <= MAX_YEAR ? year : null;
}

function routeIndexOrDefault(value: string | null): number {
  const index = intOrNull(value) ?? 0;
  return index >= 0 && index <= MAX_ROUTE_INDEX ? index : 0;
}

function intOrNull(value: string | null): number | null {
  if (value === null || !/^-?\d{1,5}$/.test(value)) return null;
  return Number(value);
}

/** Reads the state from a URL hash; anything malformed falls back to the empty state. */
export function parseHash(hash: string): UrlState {
  const [path = '', query = ''] = hash.replace(/^#\/?/, '').split('?');
  const [prefix, rawFrom, rawTo] = path.split('/');
  const params = new URLSearchParams(query);
  const map = MAP_KINDS.find((kind) => kind === params.get(PARAM.map)) ?? null;
  // The map and its switches belong to the reader, not to a journey: they hold with one figure or none, too.
  const settings = { map, showJourney: params.get(PARAM.journey) !== OFF, showLines: params.get(PARAM.lines) !== OFF };
  const from = prefix === ROUTE_PREFIX ? slugOrNull(rawFrom) : null;
  const to = prefix === ROUTE_PREFIX ? slugOrNull(rawTo) : null;
  if (!from || !to) return { ...EMPTY_URL_STATE, from, ...settings };
  return {
    from,
    to,
    routeIndex: routeIndexOrDefault(params.get(PARAM.route)),
    focus: slugOrNull(params.get(PARAM.focus)),
    detour: slugOrNull(params.get(PARAM.detour)),
    year: yearOrNull(params.get(PARAM.year)),
    overview: params.get(PARAM.overview) === ON,
    ...settings,
  };
}

/** Writes the state as a URL hash; default values are left out to keep links short. */
export function formatHash(state: UrlState): string {
  const params = new URLSearchParams();
  if (state.map) params.set(PARAM.map, state.map);
  if (!state.from) return withQuery('#/', withSwitches(params, state));
  if (!state.to) return withQuery(`#/${ROUTE_PREFIX}/${state.from}`, withSwitches(params, state));
  if (state.routeIndex > 0) params.set(PARAM.route, String(state.routeIndex));
  if (state.focus) params.set(PARAM.focus, state.focus);
  if (state.detour) params.set(PARAM.detour, state.detour);
  if (state.year !== null) params.set(PARAM.year, String(state.year));
  if (state.overview) params.set(PARAM.overview, ON);
  return withQuery(`#/${ROUTE_PREFIX}/${state.from}/${state.to}`, withSwitches(params, state));
}

/** Adds the map switches that are off; they are written last, whatever else the link carries. */
function withSwitches(params: URLSearchParams, state: UrlState): URLSearchParams {
  if (!state.showJourney) params.set(PARAM.journey, OFF);
  if (!state.showLines) params.set(PARAM.lines, OFF);
  return params;
}

function withQuery(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
