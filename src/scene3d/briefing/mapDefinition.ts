/**
 * A map for the briefing table, as plain data. Coordinates run from 0 to 1 over the sheet: x to the east, y to
 * the south. The map is a sketch for telling a plan, not a survey; it is not to scale.
 */
export type MapPoint = readonly [number, number];

/** The script a map is written in: the Arabic letters of Ottoman Turkish, or Latin letters. */
export type Script = 'ottoman' | 'latin';

/** A map of the time is written in Ottoman; the reader can turn it to Latin. */
export const DEFAULT_SCRIPT: Script = 'ottoman';

/** A name on the map, written both ways. */
export interface MapName {
  latin: string;
  ottoman: string;
}

export function nameIn(name: MapName, script: Script): string {
  return name[script];
}

export function otherScript(script: Script): Script {
  return script === 'ottoman' ? 'latin' : 'ottoman';
}

export type PlaceKind = 'fort' | 'city' | 'camp' | 'cannon' | 'fleet';
export type RouteKind = 'wall' | 'chain' | 'haul' | 'attack';

export interface MapPlace {
  at: MapPoint;
  label: MapName;
  kind: PlaceKind;
}

export interface MapRoute {
  points: readonly MapPoint[];
  /** The name of the route and where it is written, clear of the other names. */
  label?: MapName;
  labelAt?: MapPoint;
  kind: RouteKind;
}

export interface MapCaption {
  at: MapPoint;
  name: MapName;
  /** Turn of the writing, in radians. */
  turn?: number;
}

export interface MapDefinition {
  title: MapName;
  /** Outlines of the land; everything else is water. */
  land: readonly (readonly MapPoint[])[];
  /** Where the wind rose stands; the rhumb lines of the chart spread from it. */
  windRose: MapPoint;
  /** Names written on the water and the land, never marked. */
  captions: readonly MapCaption[];
  /** What a step of a briefing can point at, by id. */
  places: Readonly<Record<string, MapPlace>>;
  routes: Readonly<Record<string, MapRoute>>;
}

/** Ids of everything on the map a briefing can point at. */
export function markIds(map: MapDefinition): string[] {
  return [...Object.keys(map.places), ...Object.keys(map.routes)];
}

/** Every name written on the map. */
export function mapNames(map: MapDefinition): MapName[] {
  const routes = Object.values(map.routes).flatMap((route) => (route.label ? [route.label] : []));
  return [map.title, ...map.captions.map((caption) => caption.name), ...Object.values(map.places).map((place) => place.label), ...routes];
}

/** The middle of a place or a route, where the eye should go when it is marked. */
export function markCentre(map: MapDefinition, id: string): MapPoint {
  const place = map.places[id];
  if (place) return place.at;
  const route = map.routes[id];
  if (!route) throw new Error(`The map "${map.title.latin}" has no place or route called "${id}".`);
  const sum = route.points.reduce<[number, number]>((total, [x, y]) => [total[0] + x, total[1] + y], [0, 0]);
  return [sum[0] / route.points.length, sum[1] / route.points.length];
}

/** How far beside the sign of a place its pebble is set, so that the sign stays visible. */
const PEBBLE_OFFSET: MapPoint = [0.035, -0.05];

/** Where glass pebbles are set to show the given marks: one beside each place, one on each point of a route. */
export function pebblePoints(map: MapDefinition, ids: readonly string[]): MapPoint[] {
  return ids.flatMap((id): MapPoint[] => {
    const place = map.places[id];
    if (place) return [[place.at[0] + PEBBLE_OFFSET[0], place.at[1] + PEBBLE_OFFSET[1]]];
    return [...(map.routes[id]?.points ?? [])];
  });
}

/** The middle of several marks; the middle of the sheet when there are none. */
export function marksCentre(map: MapDefinition, ids: readonly string[]): MapPoint {
  if (ids.length === 0) return [0.5, 0.5];
  const centres = ids.map((id) => markCentre(map, id));
  return [centres.reduce((total, [x]) => total + x, 0) / centres.length, centres.reduce((total, [, y]) => total + y, 0) / centres.length];
}
