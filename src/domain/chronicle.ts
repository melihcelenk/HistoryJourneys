import { formatYearRange } from './calendar';
import { spotName } from './journey';
import type { FigureCard, JourneyStop, Place } from './types';

/** One thing playback tells about: a figure arriving at a stop of its journey. */
export interface ChronicleEvent {
  year: number;
  /** Slug of the figure. */
  figure: string;
  figureName: string;
  /** Index of the stop in the journey of the figure. */
  stopIndex: number;
  place: Place;
  placeName: string;
  /** The years the figure spent at the stop, for example "1453–1481". */
  years: string;
  text: string;
}

function toEvent(card: FigureCard, stop: JourneyStop, stopIndex: number): ChronicleEvent {
  return {
    year: stop.from,
    figure: card.slug,
    figureName: card.nameTr,
    stopIndex,
    place: stop.place,
    placeName: spotName(stop.place.nameTr),
    years: formatYearRange(stop.from, stop.to),
    text: stop.event,
  };
}

/** The event of one stop of a journey, or null when the journey has no such stop. */
export function eventOfStop(card: FigureCard, stopIndex: number): ChronicleEvent | null {
  const stop = card.journey[stopIndex];
  return stop ? toEvent(card, stop, stopIndex) : null;
}

/**
 * Lists every journey stop of the given figures in order of time. Playback
 * steps through this list instead of counting years, so that it pauses where
 * something happens and skips the years in which nothing is recorded.
 */
export function buildChronicle(cards: FigureCard[]): ChronicleEvent[] {
  const events = cards.flatMap((card) => card.journey.map((stop, stopIndex) => toEvent(card, stop, stopIndex)));
  // The sort is stable: events of one year keep the order of the figures and of their stops.
  return events.sort((a, b) => a.year - b.year);
}

/** Index of the first event in or after the given year, or -1 when there is none. */
export function firstEventIndexFrom(events: ChronicleEvent[], year: number): number {
  return events.findIndex((event) => event.year >= year);
}

/** Where playback continues: the index of the next event, and whether to tell it at once or after a rest. */
export interface PlaybackPlan {
  index: number;
  tellNow: boolean;
}

/**
 * Decides what playback does when it starts or when its list of events changes
 * in the middle of a rest (a card arrived). An event that
 * is being told is never told again and never cut short: playback rests on it
 * and then goes on, and after the last event it ends. With nothing being told,
 * playback begins at the first event from the current year on, or from the
 * beginning when the current year is past the last event.
 */
export function planPlayback(events: ChronicleEvent[], spotlight: ChronicleEvent | null, year: number): PlaybackPlan | null {
  if (events.length === 0) return null;
  const told = spotlight
    ? events.findIndex((event) => event.figure === spotlight.figure && event.stopIndex === spotlight.stopIndex)
    : -1;
  if (told >= 0) return { index: told + 1, tellNow: false };
  return { index: Math.max(firstEventIndexFrom(events, year), 0), tellNow: true };
}

export type StepDirection = 'previous' | 'next';

/**
 * The event a step by hand goes to, or null when there is none in that
 * direction. From an event that is being told it is the neighbour in the list,
 * so that two events of one year are told one after the other. With nothing
 * being told, the next event is the first one from the current year on (an
 * event of the year itself has not been told yet) and the previous event is
 * the last one before the year.
 */
export function neighbourEvent(
  events: ChronicleEvent[],
  spotlight: ChronicleEvent | null,
  year: number,
  direction: StepDirection,
): ChronicleEvent | null {
  const told = spotlight
    ? events.findIndex((event) => event.figure === spotlight.figure && event.stopIndex === spotlight.stopIndex)
    : -1;
  if (told >= 0) return events[direction === 'next' ? told + 1 : told - 1] ?? null;
  if (direction === 'next') return events[firstEventIndexFrom(events, year)] ?? null;
  return events.findLast((event) => event.year < year) ?? null;
}
