import { describe, expect, it } from 'vitest';
import { buildChronicle, firstEventIndexFrom, planPlayback } from '../../src/domain/chronicle';
import { stopAtYear } from '../../src/domain/journey';
import type { FigureCard, JourneyStop } from '../../src/domain/types';
import { buildScene, framingPoints } from '../../src/map/mapScene';
import { figure, figureCard } from './fixtures';

function stop(slug: string, lon: number, lat: number, from: number, to: number): JourneyStop {
  return { place: { slug, nameTr: slug, lat, lon }, precision: 'city', from, to, event: `${slug} olayı` };
}

function card(slug: string, birth: number, death: number, journey: JourneyStop[]): FigureCard {
  return figureCard(figure(slug, birth, death, birth + 20), { journey });
}

// Fatih has stops between 1432 and 1481, with gaps between them; Atatürk lives four centuries later.
const fatih = card('fatih', 1432, 1481, [
  stop('edirne', 26.5, 41.7, 1432, 1443),
  stop('manisa', 27.4, 38.6, 1446, 1451),
  stop('istanbul', 28.98, 41.01, 1453, 1481),
]);
const ataturk = card('ataturk', 1881, 1938, [
  stop('selanik', 22.9, 40.6, 1881, 1896),
  stop('samsun', 36.3, 41.3, 1919, 1919),
  stop('ankara', 32.9, 39.9, 1919, 1938),
]);

describe('a figure is on the map only in years it has a record for', () => {
  const life = { birthYear: 1432, deathYear: 1481 };

  it('is at a stop during the years of that stop', () => {
    expect(stopAtYear(life, fatih.journey, 1440)?.place.slug).toBe('edirne');
    expect(stopAtYear(life, fatih.journey, 1453)?.place.slug).toBe('istanbul');
  });

  it('is nowhere in a year between two stops', () => {
    expect(stopAtYear(life, fatih.journey, 1444)).toBeNull();
    expect(stopAtYear(life, fatih.journey, 1452)).toBeNull();
  });

  it('prefers the stop that starts later when two stops share a year', () => {
    expect(stopAtYear({ birthYear: 1881, deathYear: 1938 }, ataturk.journey, 1919)?.place.slug).toBe('ankara');
  });
});

describe('the map of a year', () => {
  const places = [{ slug: 'bursa', nameTr: 'Bursa', lat: 40.19, lon: 29.06, visits: 3 }];
  const scene = (year: number, showJourney: boolean, active: FigureCard = ataturk) =>
    buildScene({ places, routeCards: [ataturk, fatih], activeCard: active, year, showJourney });

  it('does not show the journey of the figure in focus unless it is switched on', () => {
    const in1462 = scene(1462, false);
    expect(in1462.stops.map((item) => item.name)).toEqual(['istanbul']);
    expect(in1462.journeyReached).toEqual([]);
    expect(in1462.journeyAhead).toEqual([]);
  });

  it('shows every stop of the figure in focus when its journey is switched on', () => {
    const in1462 = scene(1462, true);
    expect(in1462.stops.filter((item) => item.order !== null).map((item) => item.name)).toEqual(['selanik', 'samsun', 'ankara']);
    expect(in1462.stops.filter((item) => item.order !== null).every((item) => !item.reached)).toBe(true);
  });

  it('shows the figures that have a record for the year, each with its trail so far', () => {
    const in1462 = scene(1462, false);
    expect(in1462.figures.map((item) => item.slug)).toEqual(['fatih']);
    expect(in1462.trails).toEqual([
      [
        [26.5, 41.7],
        [27.4, 38.6],
        [28.98, 41.01],
      ],
    ]);
  });

  it('labels the place of a present figure once, without a journey number', () => {
    const in1462 = scene(1462, false);
    expect(in1462.stops).toHaveLength(1);
    expect(in1462.stops[0]).toMatchObject({ name: 'istanbul', years: '', order: null, current: true, reached: true });
  });

  it('puts a figure at the stop that playback is telling about, even when a later stop shares the year', () => {
    const told = buildScene({
      places,
      routeCards: [ataturk, fatih],
      activeCard: ataturk,
      year: 1919,
      showJourney: false,
      spotlight: { figure: 'ataturk', stopIndex: 1 },
    });
    expect(told.figures.map((item) => [item.slug, item.position])).toEqual([['ataturk', [36.3, 41.3]]]);
    expect(told.stops.map((item) => item.name)).toEqual(['samsun']);
    expect(told.trails).toEqual([
      [
        [22.9, 40.6],
        [36.3, 41.3],
      ],
    ]);
  });

  it('shows nobody in a year without any record', () => {
    const in1700 = scene(1700, false);
    expect(in1700.figures).toEqual([]);
    expect(in1700.trails).toEqual([]);
    expect(in1700.stops).toEqual([]);
  });

  it('frames the journey of the figure in focus even while it is hidden', () => {
    expect(framingPoints(scene(1462, false))).toHaveLength(3);
    expect(framingPoints(scene(1462, false))[0]).toEqual([22.9, 40.6]);
  });
});

describe('chronicle: the events playback steps through', () => {
  const events = buildChronicle([ataturk, fatih]);

  it('lists every stop of every figure in order of time', () => {
    expect(events.map((event) => `${event.year} ${event.figure} ${event.place.slug}`)).toEqual([
      '1432 fatih edirne',
      '1446 fatih manisa',
      '1453 fatih istanbul',
      '1881 ataturk selanik',
      '1919 ataturk samsun',
      '1919 ataturk ankara',
    ]);
  });

  it('carries what the reader is told at each event', () => {
    expect(events[2]).toMatchObject({ figureName: 'FATIH', placeName: 'istanbul', years: '1453–1481', text: 'istanbul olayı' });
  });

  it('finds the first event from a year on', () => {
    expect(firstEventIndexFrom(events, 1400)).toBe(0);
    expect(firstEventIndexFrom(events, 1447)).toBe(2);
    expect(firstEventIndexFrom(events, 1919)).toBe(4);
    expect(firstEventIndexFrom(events, 1950)).toBe(-1);
  });

  it('is empty without cards', () => {
    expect(buildChronicle([])).toEqual([]);
  });
});

describe('what playback does when it starts or its events change', () => {
  const events = buildChronicle([ataturk, fatih]);

  it('tells the first event from the current year on when nothing is being told', () => {
    expect(planPlayback(events, null, 1447)).toEqual({ index: 2, tellNow: true });
  });

  it('starts over when the current year is after the last event', () => {
    expect(planPlayback(events, null, 1950)).toEqual({ index: 0, tellNow: true });
  });

  it('does not tell again or skip ahead when an event is already being told', () => {
    // This is what happens when the speed changes or a card arrives in the middle of a rest.
    expect(planPlayback(events, events[2]!, 1453)).toEqual({ index: 3, tellNow: false });
  });

  it('ends after the last event instead of starting over', () => {
    expect(planPlayback(events, events.at(-1)!, 1919)).toEqual({ index: events.length, tellNow: false });
  });

  it('has nothing to play without events', () => {
    expect(planPlayback([], null, 1500)).toBeNull();
  });
});
