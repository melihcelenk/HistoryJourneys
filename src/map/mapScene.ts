import { formatYearRange } from '../domain/calendar';
import { currentStopIndex, groupIndexOf, type JourneyGroup, journeyGroups, shownGroup, spotName } from '../domain/journey';
import type { FigureCard, JourneyStop, VisitedPlace } from '../domain/types';
import type { CityMarker, FigureMarker, LonLat, MapScene, StopMarker } from './MapView';

export interface SceneInput {
  places: VisitedPlace[];
  /** Cards of the figures on the route, in route order (cards not loaded yet are left out). */
  routeCards: FigureCard[];
  /** Card of the figure in front of the reader, on the route or on a detour. */
  activeCard: FigureCard | null;
  year: number;
  /** Whether the journey of the figure in focus is shown, one group of stops at a time. */
  showJourney: boolean;
  /** Whether the lines between stops are drawn: the journey path and the trails of the other figures. On unless switched off. */
  showLines?: boolean;
  /** The stop playback is telling about: that figure stands there even if a later stop shares the year. */
  spotlight?: { figure: string; stopIndex: number };
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

/** Short city name of a place such as "Topkapı Sarayı, İstanbul". */
function cityName(place: VisitedPlace): string {
  return place.nameTr.split(',').at(-1)?.trim() ?? place.nameTr;
}

function buildCities(places: VisitedPlace[], taken: LonLat[]): CityMarker[] {
  const cities: CityMarker[] = [];
  const occupied = [...taken];
  for (const place of places) {
    if (cities.length >= MAX_CITY_LABELS) break;
    const position = positionOf(place);
    if (occupied.some((other) => isNear(other, position))) continue;
    cities.push({ id: place.slug, position, name: cityName(place), rank: cities.length + 1 });
    occupied.push(position);
  }
  return cities;
}

/** A figure that has a record for the year, and the stop it is at. */
interface Presence {
  card: FigureCard;
  stop: JourneyStop;
  stopIndex: number;
}

/** Finds where each figure is in the year; figures without a record for the year are left out. */
function findPresent(cards: FigureCard[], input: SceneInput): Presence[] {
  return cards.flatMap((card) => {
    const told = input.spotlight?.figure === card.slug ? input.spotlight.stopIndex : undefined;
    const stopIndex = currentStopIndex(card, card.journey, input.year, told);
    const stop = card.journey[stopIndex];
    return stop ? [{ card, stop, stopIndex }] : [];
  });
}

function stopMarker(
  id: string,
  stop: JourneyStop,
  flags: Pick<StopMarker, 'order' | 'target' | 'reached' | 'current' | 'crowded'>,
): StopMarker {
  return {
    id,
    position: positionOf(stop.place),
    name: spotName(stop.place.nameTr),
    historicName: stop.place.historicName,
    // Several figures may stand at one place, each with its own years; only a journey stop has years of its own.
    years: flags.order === null ? '' : formatYearRange(stop.from, stop.to),
    event: stop.event,
    precision: stop.precision,
    ...flags,
  };
}

/**
 * The stops of the open journey that are shown: the group the reader is at,
 * each with its number in the whole journey. A long journey drawn at once
 * covers the map, so it is shown one group at a time.
 */
function buildJourneyStops(
  card: FigureCard,
  group: JourneyGroup,
  year: number,
  current: JourneyStop | undefined,
  toldIndex: number | undefined,
): StopMarker[] {
  return card.journey.slice(group.first, group.last + 1).map((stop, offset) => {
    const stopIndex = group.first + offset;
    return stopMarker(`${card.slug}:${stopIndex}`, stop, {
      order: stopIndex + 1,
      target: { figure: card.slug, stopIndex },
      // While a stop is told the figure stands there: a later stop is not reached yet, even one of the same year.
      reached: toldIndex === undefined ? stop.from <= year : stopIndex <= toldIndex,
      current: stop === current,
      crowded: current !== undefined && stop !== current && isNear(positionOf(stop.place), positionOf(current.place)),
    });
  });
}

/** One label per place where a figure stands this year; places labelled by the shown stops of an open journey are skipped. */
function buildPlaceLabels(present: Presence[], alreadyLabelled: Iterable<string>): StopMarker[] {
  const labelled = new Set(alreadyLabelled);
  const labels: StopMarker[] = [];
  for (const { stop } of present) {
    if (labelled.has(stop.place.slug)) continue;
    labelled.add(stop.place.slug);
    labels.push(stopMarker(`place:${stop.place.slug}`, stop, { order: null, target: null, reached: true, current: true, crowded: false }));
  }
  return labels;
}

function buildFigures(present: Presence[], activeSlug: string | undefined): FigureMarker[] {
  const stacks = new Map<string, number>();
  // The focused figure is placed first so that it stands on the spot itself.
  const ordered = [...present].sort((a, b) => Number(b.card.slug === activeSlug) - Number(a.card.slug === activeSlug));
  return ordered.map(({ card, stop }) => {
    const stackIndex = stacks.get(stop.place.slug) ?? 0;
    stacks.set(stop.place.slug, stackIndex + 1);
    return {
      slug: card.slug,
      position: positionOf(stop.place),
      name: card.nameTr,
      kind: card.kind,
      portrait: Boolean(card.portrait),
      focused: card.slug === activeSlug,
      stackIndex,
    };
  });
}

/**
 * The way a figure came to where it is: the stops of its current group up to the current one. Like an open
 * journey, a trail is kept to one group of stops; the whole way of a long journey would cover the map.
 */
function trailOf({ card, stopIndex }: Presence): LonLat[] {
  const trail: LonLat[] = [];
  const groupStart = journeyGroups(card.journey.length)[groupIndexOf(stopIndex)]?.first ?? 0;
  for (const stop of card.journey.slice(groupStart, stopIndex + 1)) {
    const position = positionOf(stop.place);
    const previous = trail.at(-1);
    if (!previous || previous[0] !== position[0] || previous[1] !== position[1]) trail.push(position);
  }
  return trail;
}

/** The journey that is open on the map: whose it is, its stops that are shown and the places they label. */
interface OpenJourney {
  slug: string | null;
  stops: StopMarker[];
  places: string[];
}

const NO_JOURNEY: OpenJourney = { slug: null, stops: [], places: [] };

/** The shown group of the journey of the figure in focus, unless the journey is switched off. */
function openJourney(input: SceneInput, present: Presence[]): OpenJourney {
  const card = input.showJourney ? input.activeCard : null;
  if (!card) return NO_JOURNEY;
  const told = input.spotlight?.figure === card.slug ? input.spotlight.stopIndex : undefined;
  const group = shownGroup(card, card.journey, input.year, told);
  if (!group) return { ...NO_JOURNEY, slug: card.slug };
  const current = present.find((presence) => presence.card.slug === card.slug)?.stop;
  return {
    slug: card.slug,
    stops: buildJourneyStops(card, group, input.year, current, told),
    // Only the stops that are shown carry a label; a place of the journey outside the shown group still needs one.
    places: card.journey.slice(group.first, group.last + 1).map((stop) => stop.place.slug),
  };
}

/**
 * Builds what the map shows for a year (FR-13, FR-14): ambient cities, every
 * figure that has a record for the year at its place and, unless switched
 * off, the journey of the figure in focus, one group of stops at a time. When
 * no journey is open, each figure has the trail that led it to where it stands.
 */
export function buildScene(input: SceneInput): MapScene {
  const { activeCard, routeCards } = input;
  const onRoute = activeCard !== null && routeCards.some((card) => card.slug === activeCard.slug);
  const present = findPresent(activeCard && !onRoute ? [...routeCards, activeCard] : routeCards, input);

  const journey = openJourney(input, present);
  const journeyStops = journey.stops;
  const others = present.filter((presence) => presence.card.slug !== journey.slug);
  const stops = [...journeyStops, ...buildPlaceLabels(others, journey.places)];
  // Journeys are in chronological order (content validation), so the reached stops are the first ones.
  const reachedCount = journeyStops.filter((stop) => stop.reached).length;
  const figures = buildFigures(present, activeCard?.slug);
  const showLines = input.showLines ?? true;
  const journeyPath = showLines ? journeyStops.map((stop) => stop.position) : [];

  return {
    cities: buildCities(
      input.places,
      stops.map((stop) => stop.position),
    ),
    stops,
    figures,
    // While a journey is open its path is the only line on the map: the trails of the figures who happen to be
    // around that year would cross it and read as part of it.
    trails: showLines && journey.slug === null ? others.map(trailOf).filter((trail) => trail.length > 1) : [],
    journeyReached: journeyPath.slice(0, reachedCount),
    // The path ahead starts at the last reached stop so that the two lines join.
    journeyAhead: journeyPath.slice(Math.max(reachedCount - 1, 0)),
    focusPoints: focusPointsOf(activeCard, journeyStops, figures),
  };
}

/** What the camera frames: the stops that are shown, the whole journey while it is hidden, or the figures of the overview. */
function focusPointsOf(activeCard: FigureCard | null, journeyStops: StopMarker[], figures: FigureMarker[]): LonLat[] {
  if (journeyStops.length > 0) return journeyStops.map((stop) => stop.position);
  if (activeCard) return activeCard.journey.map((stop) => positionOf(stop.place));
  return figures.map((figure) => figure.position);
}

/** The points the camera should frame for a scene. */
export function framingPoints(scene: MapScene): LonLat[] {
  return scene.focusPoints;
}
