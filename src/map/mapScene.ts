import { formatYearRange } from '../domain/calendar';
import { activeYear, stopAtYear } from '../domain/journey';
import type { FigureCard, JourneyStop, VisitedPlace } from '../domain/types';
import type { CityMarker, FigureMarker, LonLat, MapScene, StopMarker } from './MapView';

export interface SceneInput {
  places: VisitedPlace[];
  /** Cards of the figures on the route, in route order (cards not loaded yet are left out). */
  routeCards: FigureCard[];
  /** Card of the figure in front of the reader, on the route or on a detour. */
  activeCard: FigureCard | null;
  year: number;
}

/** How many of the most visited places get an ambient city label. */
const MAX_CITY_LABELS = 14;
/** Places closer than this (in degrees) share one label, so that buildings of one city do not pile up. */
const CITY_MERGE_DEGREES = 0.4;

function positionOf(place: { lon: number; lat: number }): LonLat {
  return [place.lon, place.lat];
}

function isNear(a: LonLat, b: LonLat): boolean {
  return Math.abs(a[0] - b[0]) < CITY_MERGE_DEGREES && Math.abs(a[1] - b[1]) < CITY_MERGE_DEGREES;
}

/** Name of the spot itself for a place such as "Topkapı Sarayı, İstanbul". */
function spotName(name: string): string {
  return name.split(',')[0]?.trim() ?? name;
}

/** Short city name of a place such as "Topkapı Sarayı, İstanbul". */
function cityName(place: VisitedPlace): string {
  return place.nameTr.split(',').at(-1)?.trim() ?? place.nameTr;
}

function buildCities(places: VisitedPlace[], taken: LonLat[]): CityMarker[] {
  const cities: CityMarker[] = [];
  for (const place of places) {
    if (cities.length >= MAX_CITY_LABELS) break;
    const position = positionOf(place);
    const crowded = [...taken, ...cities.map((city) => city.position)].some((other) => isNear(other, position));
    if (!crowded) cities.push({ id: place.slug, position, name: cityName(place), rank: cities.length + 1 });
  }
  return cities;
}

function buildStops(card: FigureCard, year: number): StopMarker[] {
  const current = stopAtYear(card, card.journey, year);
  return card.journey.map((stop, index) => ({
    id: `${card.slug}:${index}`,
    position: positionOf(stop.place),
    name: spotName(stop.place.nameTr),
    historicName: stop.place.historicName,
    years: formatYearRange(stop.from, stop.to),
    event: stop.event,
    precision: stop.precision,
    order: index + 1,
    reached: stop.from <= year,
    current: stop === current,
    crowded: current !== null && stop !== current && isNear(positionOf(stop.place), positionOf(current.place)),
  }));
}

function buildFigures(cards: FigureCard[], activeSlug: string | undefined, year: number): FigureMarker[] {
  const stacks = new Map<string, number>();
  const markers: FigureMarker[] = [];
  // The focused figure is placed first so that it stands on the spot itself.
  const ordered = [...cards].sort((a, b) => Number(b.slug === activeSlug) - Number(a.slug === activeSlug));
  for (const card of ordered) {
    const stop = stopAtYear(card, card.journey, year);
    if (!stop) continue;
    const stackIndex = stacks.get(stop.place.slug) ?? 0;
    stacks.set(stop.place.slug, stackIndex + 1);
    markers.push({
      slug: card.slug,
      position: positionOf(stop.place),
      name: card.nameTr,
      kind: card.kind,
      focused: card.slug === activeSlug,
      stackIndex,
    });
  }
  return markers;
}

/** The place a figure is most associated with: where it was in its active year. */
function seatOf(card: FigureCard): JourneyStop | null {
  return stopAtYear(card, card.journey, activeYear(card)) ?? card.journey[0] ?? null;
}

function buildRoutePath(cards: FigureCard[]): LonLat[] {
  const path: LonLat[] = [];
  for (const card of cards) {
    const seat = seatOf(card);
    if (!seat) continue;
    const position = positionOf(seat.place);
    const previous = path.at(-1);
    if (!previous || previous[0] !== position[0] || previous[1] !== position[1]) path.push(position);
  }
  return path.length > 1 ? path : [];
}

/**
 * Builds what the map shows: ambient cities, the journey of the figure in
 * focus, and every route figure that was alive in the selected year, standing
 * where it was that year (FR-13, FR-14, FR-16).
 */
export function buildScene(input: SceneInput): MapScene {
  const { activeCard, routeCards, year } = input;
  const stops = activeCard ? buildStops(activeCard, year) : [];
  const onRoute = activeCard !== null && routeCards.some((card) => card.slug === activeCard.slug);
  const figureCards = activeCard && !onRoute ? [...routeCards, activeCard] : routeCards;
  // Journeys are in chronological order (content validation), so the reached stops are the first ones.
  const reachedCount = stops.filter((stop) => stop.reached).length;
  return {
    cities: buildCities(
      input.places,
      stops.map((stop) => stop.position),
    ),
    stops,
    figures: buildFigures(figureCards, activeCard?.slug, year),
    journeyReached: stops.slice(0, reachedCount).map((stop) => stop.position),
    // The path ahead starts at the last reached stop so that the two lines join.
    journeyAhead: stops.slice(Math.max(reachedCount - 1, 0)).map((stop) => stop.position),
    routePath: buildRoutePath(routeCards),
  };
}

/** The points the camera should frame for a scene: the focused journey, or the whole route. */
export function framingPoints(scene: MapScene): LonLat[] {
  if (scene.stops.length > 0) return scene.stops.map((stop) => stop.position);
  return scene.routePath;
}
