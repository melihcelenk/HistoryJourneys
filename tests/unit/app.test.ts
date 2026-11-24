import { describe, expect, it } from 'vitest';
import { EMPTY_URL_STATE, formatHash, parseHash, type UrlState } from '../../src/app/urlState';
import type { FigureCard, JourneyStop, VisitedPlace } from '../../src/domain/types';
import { buildScene, framingPoints } from '../../src/map/mapScene';
import { figure, figureCard } from './fixtures';

describe('urlState', () => {
  const full: UrlState = {
    from: 'ataturk',
    to: 'mehmed-ii',
    routeIndex: 1,
    focus: 'ahmed-i',
    detour: 'kosem-sultan',
    year: 1609,
    showJourney: false,
    showLines: false,
    overview: false,
    map: 'pixi',
  };

  it('round-trips a full state', () => {
    expect(parseHash(formatHash(full))).toEqual(full);
  });

  it('leaves the plain map, the one the game opens with, out of links', () => {
    expect(formatHash({ ...full, map: null })).not.toContain('map=');
    expect(parseHash('#/yol/a/b').map).toBeNull();
    expect(parseHash('#/yol/a/b?map=pixi').map).toBe('pixi');
    // Links made while the painted map was the default still say which map they want.
    expect(parseHash('#/yol/a/b?map=maplibre').map).toBe('maplibre');
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
  const card = (slug: string, birth: number, death: number, reign: number, journey: JourneyStop[]): FigureCard =>
    figureCard(figure(slug, birth, death, reign), { journey });
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
  const open = (year: number, routeCards: FigureCard[] = [ahmed], activeCard: FigureCard | null = ahmed) =>
    buildScene({ places, routeCards, activeCard, year, showJourney: true });

  it('marks reached and current stops of an open journey for the selected year', () => {
    const scene = open(1609);
    expect(scene.stops.map((item) => item.reached)).toEqual([true, true, false, false]);
    expect(scene.stops.map((item) => item.current)).toEqual([false, true, false, false]);
    expect(scene.stops[1]!.name).toBe('Topkapı Sarayı');
    expect(scene.stops[1]!.years).toBe('1595–1611');
  });

  it('does not draw a stop that would cover the current one', () => {
    expect(open(1609).stops.map((item) => item.crowded)).toEqual([false, false, false, true]);
  });

  it('splits the open journey at the selected year and joins the two parts', () => {
    const scene = open(1609);
    expect(scene.journeyReached).toHaveLength(2);
    expect(scene.journeyAhead).toHaveLength(3);
    expect(scene.journeyAhead[0]).toEqual(scene.journeyReached.at(-1));
  });

  it('fans out the figures that stand at one place', () => {
    const scene = open(1609, [mustafa, ahmed]);
    expect(scene.figures.map((item) => [item.slug, item.focused, item.stackIndex])).toEqual([
      ['ahmed', true, 0],
      ['mustafa', false, 1],
    ]);
    expect(open(1630, [mustafa, ahmed]).figures.map((item) => item.slug)).toEqual(['mustafa']);
  });

  it('adds ambient cities away from the labelled places, one label per city', () => {
    const empty = buildScene({ places, routeCards: [], activeCard: null, year: 1609, showJourney: false });
    expect(empty.cities.map((city) => city.name)).toEqual(['İstanbul', 'Bursa']);
    expect(open(1609).cities.map((city) => city.name)).toEqual(['Bursa']);
  });

  it('includes a detour figure that is not on the route', () => {
    const scene = buildScene({ places, routeCards: [ahmed], activeCard: mustafa, year: 1620, showJourney: false });
    expect(scene.figures.map((item) => item.slug)).toEqual(['mustafa']);
    expect(scene.stops.map((item) => item.order)).toEqual([null]);
  });

  it('tells the map which figures have a portrait', () => {
    const portrait = { title: 'Portre', author: 'Bilinmiyor', created: '1600', license: 'Public domain' as const, sourceUrl: 'https://commons.wikimedia.org/wiki/File:P.jpg', representative: false };
    const withPortrait = { ...mustafa, portrait };
    const scene = open(1609, [withPortrait, ahmed]);
    expect(scene.figures.map((item) => [item.slug, item.portrait])).toEqual([
      ['ahmed', false],
      ['mustafa', true],
    ]);
  });

  it('has nothing to frame when nothing is on the map', () => {
    const empty = buildScene({ places, routeCards: [], activeCard: null, year: 1609, showJourney: false });
    expect(framingPoints(empty)).toEqual([]);
    expect(framingPoints(open(1609))).toHaveLength(4);
  });
});
