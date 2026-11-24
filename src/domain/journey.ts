import type { FigureSummary, JourneyStop } from './types';

/**
 * Returns the stop a figure was at in the given year, or null when there is no
 * record for that year. A figure is at a stop only during the years of that
 * stop: in a year between two stops nothing is known, so nothing is returned
 * rather than a guess. When two stops share a year (the figure moved that
 * year) the later one is returned. The journey must be in chronological order,
 * which content validation guarantees.
 */
export function stopAtYear(
  figure: Pick<FigureSummary, 'birthYear' | 'deathYear'>,
  journey: JourneyStop[],
  year: number,
): JourneyStop | null {
  if (year < figure.birthYear || year > figure.deathYear) return null;
  return journey.findLast((stop) => stop.from <= year && year <= stop.to) ?? null;
}

/**
 * Index of the stop a figure is at: the stop that is being told about, when
 * there is one, otherwise the stop of the year; -1 when no stop is recorded
 * for the year. The map and the journey list of the card both follow it.
 */
export function currentStopIndex(
  figure: Pick<FigureSummary, 'birthYear' | 'deathYear'>,
  journey: JourneyStop[],
  year: number,
  toldIndex?: number,
): number {
  if (toldIndex !== undefined && journey[toldIndex]) return toldIndex;
  const stop = stopAtYear(figure, journey, year);
  return stop ? journey.indexOf(stop) : -1;
}

/** How many stops of a journey the map shows at a time; a longer journey is shown group by group. */
export const JOURNEY_GROUP_SIZE = 8;

/** A run of consecutive stops shown together; `first` and `last` are indexes into the journey. */
export interface JourneyGroup {
  index: number;
  first: number;
  last: number;
}

/** Splits a journey of the given length into groups, in order; the last group may be shorter. */
export function journeyGroups(stopCount: number): JourneyGroup[] {
  const groups: JourneyGroup[] = [];
  for (let first = 0; first < stopCount; first += JOURNEY_GROUP_SIZE) {
    groups.push({ index: groups.length, first, last: Math.min(first + JOURNEY_GROUP_SIZE, stopCount) - 1 });
  }
  return groups;
}

/** Index of the group a stop belongs to. */
export function groupIndexOf(stopIndex: number): number {
  return Math.floor(stopIndex / JOURNEY_GROUP_SIZE);
}

/**
 * Index of the stop the reader is looking at: the stop that is being told
 * about, otherwise the stop of the year, otherwise the last stop reached by
 * the year (the first stop before the journey begins). It only chooses which
 * part of a journey is shown; it never says that the figure was there.
 */
export function journeyPosition(
  figure: Pick<FigureSummary, 'birthYear' | 'deathYear'>,
  journey: JourneyStop[],
  year: number,
  toldIndex?: number,
): number {
  if (toldIndex !== undefined && journey[toldIndex]) return toldIndex;
  const present = stopAtYear(figure, journey, year);
  if (present) return journey.indexOf(present);
  return Math.max(journey.findLastIndex((stop) => stop.from <= year), 0);
}

/**
 * The group of stops of a journey that is shown for a year, or undefined for an empty journey. `toldIndex` is
 * the index of the stop that is being told about, when it belongs to this figure.
 */
export function shownGroup(
  figure: Pick<FigureSummary, 'birthYear' | 'deathYear'>,
  journey: JourneyStop[],
  year: number,
  toldIndex?: number,
): JourneyGroup | undefined {
  return journeyGroups(journey.length)[groupIndexOf(journeyPosition(figure, journey, year, toldIndex))];
}

/** Stops the figure has reached by the given year, in order (the path so far). */
export function stopsUntilYear(journey: JourneyStop[], year: number): JourneyStop[] {
  return journey.filter((stop) => stop.from <= year);
}

/** The year around which a figure was most active; used to order figures in time. */
export function activeYear(figure: FigureSummary): number {
  const ADULT_AGE = 30;
  if (figure.reign) return figure.reign.from;
  return Math.min(figure.birthYear + ADULT_AGE, figure.deathYear);
}

/** Name of the spot itself for a place such as "Topkapı Sarayı, İstanbul". */
export function spotName(placeName: string): string {
  return placeName.split(',')[0]?.trim() ?? placeName;
}
