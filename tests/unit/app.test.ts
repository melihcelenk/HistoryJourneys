import { describe, expect, it } from 'vitest';
import { EMPTY_URL_STATE, formatHash, parseHash, type UrlState } from '../../src/app/urlState';
import type { FigureCard, JourneyStop, VisitedPlace } from '../../src/domain/types';
import { buildScene, framingPoints } from '../../src/map/mapScene';
import { figure } from './fixtures';

describe('urlState', () => {
  const full: UrlState = {
    from: 'ataturk',
    to: 'mehmed-ii',
    routeIndex: 1,
    focus: 'ahmed-i',
    detour: 'kosem-sultan',
    year: 1609,
    map: 'maplibre',
  };

  it('round-trips a full state', () => {
    expect(parseHash(formatHash(full))).toEqual(full);
  });

  it('round-trips the empty state and a single figure', () => {
    expect(formatHash(EMPTY_URL_STATE)).toBe('#/');
    expect(parseHash('#/')).toEqual(EMPTY_URL_STATE);
    expect(parseHash('')).toEqual(EMPTY_URL_STATE);
    const single = { ...EMPTY_URL_STATE, from: 'ataturk' };
    expect(formatHash(single)).toBe('#/yol/ataturk');
    expect(parseHash('#/yol/ataturk')).toEqual(single);
  });

  it('leaves default values out of the link', () => {
    expect(formatHash({ ...EMPTY_URL_STATE, from: 'a', to: 'b' })).toBe('#/yol/a/b');
  });

  it('ignores malformed values', () => {
    expect(parseHash('#/yol/A_B/c')).toEqual(EMPTY_URL_STATE);
    const parsed = parseHash('#/yol/a/b?r=99&k=<x>&y=abc&d=..&map=other');
    expect(parsed).toEqual({ ...EMPTY_URL_STATE, from: 'a', to: 'b' });
  });

  it('ignores an unknown path', () => {
    expect(parseHash('#/something/else')).toEqual(EMPTY_URL_STATE);
  });
});

describe('buildScene', () => {
  const stop = (slug: string, lon: number, lat: number, from: number, to: number): JourneyStop => ({
    place: { slug, nameTr: slug === 'saray' ? 'Topkapı Sarayı, İstanbul' : slug, lat, lon },
    precision: 'city',
    from,
    to,
    event: `${slug} olayı`,
  });
  const card = (slug: string, birth: number, death: number, reign: number, journey: JourneyStop[]): FigureCard => ({
    ...figure(slug, birth, death, reign),
    summary: ['', '', ''],
    actions: [],
    journey,
    sources: [],
    generation: { model: '', ruleset: '', date: '', status: 'generated' },
  });
  const ahmed = card('ahmed', 1590, 1617, 1603, [
    stop('manisa', 27.4, 38.6, 1590, 1595),
    stop('saray', 28.98, 41.01, 1595, 1611),
    stop('edirne', 26.5, 41.7, 1612, 1613),
    stop('cami', 28.97, 41.0, 1617, 1617),
  ]);
  const mustafa = card('mustafa', 1591, 1639, 1617, [stop('saray', 28.98, 41.01, 1591, 1639)]);
  const places: VisitedPlace[] = [
    { slug: 'saray', nameTr: 'Topkapı Sarayı, İstanbul', lat: 41.01, lon: 28.98, visits: 9 },
    { slug: 'cami', nameTr: 'Sultanahmet Camii, İstanbul', lat: 41.0, lon: 28.97, visits: 4 },
    { slug: 'bursa', nameTr: 'Bursa', lat: 40.19, lon: 29.06, visits: 3 },
  ];

  it('marks reached and current stops for the selected year', () => {
    const scene = buildScene({ places, routeCards: [ahmed], activeCard: ahmed, year: 1609 });
    expect(scene.stops.map((item) => item.reached)).toEqual([true, true, false, false]);
    expect(scene.stops.map((item) => item.current)).toEqual([false, true, false, false]);
    expect(scene.stops[1]!.name).toBe('Topkapı Sarayı');
    expect(scene.stops[1]!.years).toBe('1595–1611');
  });

  it('hides the labels of stops next to the current one', () => {
    const scene = buildScene({ places, routeCards: [ahmed], activeCard: ahmed, year: 1609 });
    expect(scene.stops.map((item) => item.crowded)).toEqual([false, false, false, true]);
  });

  it('splits the journey path at the selected year and joins the two parts', () => {
    const scene = buildScene({ places, routeCards: [ahmed], activeCard: ahmed, year: 1609 });
    expect(scene.journeyReached).toHaveLength(2);
    expect(scene.journeyAhead).toHaveLength(3);
    expect(scene.journeyAhead[0]).toEqual(scene.journeyReached.at(-1));
  });

  it('shows only the figures alive in the selected year and fans out those at one place', () => {
    const scene = buildScene({ places, routeCards: [mustafa, ahmed], activeCard: ahmed, year: 1609 });
    expect(scene.figures.map((item) => [item.slug, item.focused, item.stackIndex])).toEqual([
      ['ahmed', true, 0],
      ['mustafa', false, 1],
    ]);
    const later = buildScene({ places, routeCards: [mustafa, ahmed], activeCard: ahmed, year: 1630 });
    expect(later.figures.map((item) => item.slug)).toEqual(['mustafa']);
  });

  it('adds ambient cities away from the journey stops, one label per city', () => {
    const scene = buildScene({ places, routeCards: [], activeCard: null, year: 1609 });
    expect(scene.cities.map((city) => city.name)).toEqual(['İstanbul', 'Bursa']);
    const focused = buildScene({ places, routeCards: [ahmed], activeCard: ahmed, year: 1609 });
    expect(focused.cities.map((city) => city.name)).toEqual(['Bursa']);
  });

  it('includes a detour figure that is not on the route', () => {
    const scene = buildScene({ places, routeCards: [ahmed], activeCard: mustafa, year: 1620 });
    expect(scene.figures.map((item) => item.slug)).toEqual(['mustafa']);
    expect(scene.stops).toHaveLength(1);
  });

  it('frames the focused journey, or the route when nothing is in focus', () => {
    const focused = buildScene({ places, routeCards: [ahmed], activeCard: ahmed, year: 1609 });
    expect(framingPoints(focused)).toHaveLength(4);
    const empty = buildScene({ places, routeCards: [], activeCard: null, year: 1609 });
    expect(framingPoints(empty)).toEqual([]);
  });
});
