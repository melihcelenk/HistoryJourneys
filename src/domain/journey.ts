import type { FigureSummary, JourneyStop } from './types';

/**
 * Returns the stop a figure was at in the given year, or null when the year is
 * outside the figure's lifetime. Between two stops the figure stays at the
 * earlier one, which matches how sparse journeys are read on the map; in a
 * year of the lifetime before the first stop, the first stop is returned.
 * The journey must be in chronological order, which content validation
 * guarantees.
 */
export function stopAtYear(
  figure: Pick<FigureSummary, 'birthYear' | 'deathYear'>,
  journey: JourneyStop[],
  year: number,
): JourneyStop | null {
  if (year < figure.birthYear || year > figure.deathYear) return null;
  let current: JourneyStop | null = null;
  for (const stop of journey) {
    if (stop.from > year) break;
    current = stop;
  }
  return current ?? journey[0] ?? null;
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
