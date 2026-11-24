import { beforeEach, describe, expect, it } from 'vitest';
import { activeFigureSlug, currentRoute, toUrlState, useAppStore } from '../../src/app/store';
import { EMPTY_URL_STATE, formatHash, parseHash } from '../../src/app/urlState';
import type { ContentRepository } from '../../src/data/ContentRepository';
import { JOURNEY_GROUP_SIZE, journeyGroups, journeyPosition } from '../../src/domain/journey';
import type { FigureCard, JourneyStop } from '../../src/domain/types';
import { buildScene, framingPoints } from '../../src/map/mapScene';
import { figure, figureCard, sampleWorld } from './fixtures';

function stop(index: number, from: number, to: number): JourneyStop {
  return { place: { slug: `yer-${index}`, nameTr: `Yer ${index}`, lat: 30 + index, lon: 20 + index }, precision: 'city', from, to, event: `Olay ${index}` };
}

const STOP_COUNT = 20;
const BIRTH = 1800;
/** A long journey: stop n lasts the two years from 1800 + 3n, so every third year has no record. */
const traveller = figureCard(figure('gezgin', BIRTH, 1870), {
  journey: Array.from({ length: STOP_COUNT }, (_, index) => stop(index, BIRTH + index * 3, BIRTH + index * 3 + 1)),
});
const neighbour = figureCard(figure('komsu', 1790, 1860), {
  journey: [
    { place: { slug: 'a', nameTr: 'A', lat: 10, lon: 10 }, precision: 'city', from: 1790, to: 1800, event: 'A olayı' },
    { place: { slug: 'b', nameTr: 'B', lat: 11, lon: 11 }, precision: 'city', from: 1801, to: 1860, event: 'B olayı' },
  ],
});

describe('a long journey is split into groups', () => {
  it('has groups of eight stops, the last one shorter', () => {
    expect(JOURNEY_GROUP_SIZE).toBe(8);
    expect(journeyGroups(STOP_COUNT)).toEqual([
      { index: 0, first: 0, last: 7 },
      { index: 1, first: 8, last: 15 },
      { index: 2, first: 16, last: 19 },
    ]);
    expect(journeyGroups(8)).toEqual([{ index: 0, first: 0, last: 7 }]);
    expect(journeyGroups(0)).toEqual([]);
  });

  it('places the reader at the stop of the year, or at the last one reached when the year has no record', () => {
    expect(journeyPosition(traveller, traveller.journey, 1830)).toBe(10);
    expect(journeyPosition(traveller, traveller.journey, 1832)).toBe(10);
    expect(journeyPosition(traveller, traveller.journey, 1700)).toBe(0);
  });

  it('places the reader at the stop that is being told about', () => {
    expect(journeyPosition(traveller, traveller.journey, 1830, 3)).toBe(3);
  });
});

describe('the journey of the figure in focus on the map', () => {
  const scene = (year: number, options: { showLines?: boolean; spotlight?: { figure: string; stopIndex: number } } = {}) =>
    buildScene({ places: [], routeCards: [traveller, neighbour], activeCard: traveller, year, showJourney: true, ...options });
  const numbers = (year: number) =>
    scene(year)
      .stops.filter((item) => item.order !== null)
      .map((item) => item.order);

  it('shows only the group of eight that the year falls in, with the real stop numbers', () => {
    expect(numbers(1800)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(numbers(1830)).toEqual([9, 10, 11, 12, 13, 14, 15, 16]);
    expect(numbers(1857)).toEqual([17, 18, 19, 20]);
  });

  it('shows the group of the stop that is being told about', () => {
    const told = scene(1800, { spotlight: { figure: 'gezgin', stopIndex: 17 } });
    expect(told.stops.filter((item) => item.order !== null).map((item) => item.order)).toEqual([17, 18, 19, 20]);
  });

  it('draws the path of the group only and frames the group', () => {
    const in1830 = scene(1830);
    // Stops 9 to 11 are reached in 1830; the path ahead starts at the last reached stop.
    expect(in1830.journeyReached).toHaveLength(3);
    expect(in1830.journeyAhead).toHaveLength(6);
    expect(framingPoints(in1830)).toHaveLength(8);
    expect(framingPoints(in1830)[0]).toEqual([28, 38]);
  });

  it('says which stop of which figure a numbered stop is, so that it can be opened', () => {
    const in1830 = scene(1830);
    expect(in1830.stops.find((item) => item.order === 9)?.target).toEqual({ figure: 'gezgin', stopIndex: 8 });
    expect(in1830.stops.find((item) => item.order === null)?.target).toBeNull();
  });

  it('keeps the trail of a figure short too: it begins with the group the figure is in', () => {
    const overview = buildScene({ places: [], routeCards: [traveller], activeCard: null, year: 1830, showJourney: true });
    // In 1830 the traveller is at stop 11, the third stop of the second group.
    expect(overview.trails).toEqual([
      [
        [28, 38],
        [29, 39],
        [30, 40],
      ],
    ]);
    expect(overview.stops.map((item) => item.order)).toEqual([null]);
  });

  it('labels the place of another figure even when a stop of the open journey outside the shown group is there', () => {
    // The visitor stands at the place of stop 1 of the traveller while the map shows stops 9 to 16.
    const visitor = figureCard(figure('misafir', 1790, 1860), {
      journey: [{ place: traveller.journey[0]!.place, precision: 'city', from: 1825, to: 1835, event: 'Geldi.' }],
    });
    const in1830 = buildScene({ places: [], routeCards: [traveller, visitor], activeCard: traveller, year: 1830, showJourney: true });
    expect(in1830.figures.map((item) => item.slug)).toContain('misafir');
    expect(in1830.stops.filter((item) => item.order === null).map((item) => item.name)).toEqual(['Yer 0']);
  });

  it('does not count a stop as reached while an earlier stop of the same year is being told', () => {
    // Two stops begin in 1820; while the first is told, the figure has not arrived at the second yet.
    const twoInOneYear = figureCard(figure('ikili', 1800, 1870), {
      journey: [stop(0, 1800, 1810), stop(1, 1820, 1820), stop(2, 1820, 1830)],
    });
    const told = buildScene({
      places: [],
      routeCards: [twoInOneYear],
      activeCard: twoInOneYear,
      year: 1820,
      showJourney: true,
      spotlight: { figure: 'ikili', stopIndex: 1 },
    });
    expect(told.stops.map((item) => item.reached)).toEqual([true, true, false]);
    expect(told.journeyReached).toHaveLength(2);
    const untold = buildScene({ places: [], routeCards: [twoInOneYear], activeCard: twoInOneYear, year: 1820, showJourney: true });
    expect(untold.stops.map((item) => item.reached)).toEqual([true, true, true]);
  });

  it('with the journey switched off, shows the figure in focus like any other: its place, its trail, no numbers', () => {
    const hidden = buildScene({ places: [], routeCards: [traveller], activeCard: traveller, year: 1830, showJourney: false });
    expect(hidden.stops.map((item) => item.order)).toEqual([null]);
    expect(hidden.trails).toHaveLength(1);
    expect(hidden.journeyReached).toEqual([]);
    // The camera still frames the whole journey, so that switching it on does not move the map.
    expect(framingPoints(hidden)).toHaveLength(STOP_COUNT);
  });

  it('hides every line when lines are switched off, and keeps the stops and the figures', () => {
    const withLines = scene(1830);
    const without = scene(1830, { showLines: false });
    expect(withLines.trails.length).toBeGreaterThan(0);
    expect(without.trails).toEqual([]);
    expect(without.journeyReached).toEqual([]);
    expect(without.journeyAhead).toEqual([]);
    expect(without.stops).toEqual(withLines.stops);
    expect(without.figures).toEqual(withLines.figures);
  });
});

describe('switches in links', () => {
  it('has the journey and the lines switched on unless the link says otherwise', () => {
    expect(parseHash('#/yol/a/b')).toMatchObject({ showJourney: true, showLines: true, overview: false });
    expect(parseHash('#/yol/a/b?j=0&l=0')).toMatchObject({ showJourney: false, showLines: false });
    expect(parseHash('#/yol/a/b?j=yes&l=x')).toMatchObject({ showJourney: true, showLines: true });
    expect(EMPTY_URL_STATE).toMatchObject({ showJourney: true, showLines: true, overview: false });
  });

  it('writes only the switches that are off, and the overview', () => {
    const state = parseHash('#/yol/a/b');
    expect(formatHash(state)).toBe('#/yol/a/b');
    expect(formatHash({ ...state, showJourney: false })).toBe('#/yol/a/b?j=0');
    expect(formatHash({ ...state, showLines: false })).toBe('#/yol/a/b?l=0');
    expect(formatHash({ ...state, overview: true })).toBe('#/yol/a/b?g=1');
    expect(parseHash('#/yol/a/b?g=1').overview).toBe(true);
  });

  it('keeps the switches when only one figure, or none, is chosen', () => {
    const single = { ...EMPTY_URL_STATE, from: 'a', showJourney: false, showLines: false };
    expect(formatHash(single)).toBe('#/yol/a?j=0&l=0');
    expect(parseHash('#/yol/a?j=0&l=0')).toEqual(single);
    const none = { ...EMPTY_URL_STATE, showLines: false };
    expect(formatHash(none)).toBe('#/?l=0');
    expect(parseHash('#/?l=0')).toEqual(none);
  });
});

describe('store: overview, stops and the kind of route', () => {
  const journeyOf = (slug: string): JourneyStop[] => [
    { place: { slug: `${slug}-1`, nameTr: `${slug} bir`, lat: 40, lon: 30 }, precision: 'city', from: 1400, to: 1450, event: 'ilk olay' },
    { place: { slug: `${slug}-2`, nameTr: `${slug} iki`, lat: 41, lon: 31 }, precision: 'city', from: 1460, to: 1470, event: 'ikinci olay' },
  ];
  const cardOf = (slug: string): FigureCard =>
    figureCard(sampleWorld().figures.find((item) => item.slug === slug)!, { journey: journeyOf(slug) });
  const repository: ContentRepository = {
    loadWorld: async () => sampleWorld(),
    getFigureCard: async (slug) => cardOf(slug),
    getConcept: async () => null,
    close: () => undefined,
  };
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
  const state = () => useAppStore.getState();

  beforeEach(async () => {
    useAppStore.setState(useAppStore.getInitialState(), true);
    await state().init(repository, EMPTY_URL_STATE);
  });

  it('shows the journey and the lines by default, and switches each on its own', () => {
    expect(state().showJourney).toBe(true);
    expect(state().showLines).toBe(true);
    state().toggleLines();
    expect(state().showLines).toBe(false);
    expect(state().showJourney).toBe(true);
    state().toggleJourney();
    expect(state().showJourney).toBe(false);
  });

  it('closes the open card and goes to the overview', () => {
    state().startJourney('a', 'd');
    expect(activeFigureSlug(state())).toBe('a');
    state().setPlaying(true);
    state().closeFigure();

    expect(state().focus).toBeNull();
    expect(activeFigureSlug(state())).toBeNull();
    expect(state().playing).toBe(false);
    expect(toUrlState(state())).toMatchObject({ overview: true, focus: null });
  });

  it('closes a detour too when going to the overview', () => {
    state().startJourney('a', 'd');
    state().openFigure('lonely');
    state().closeFigure();
    expect(state().detour).toEqual([]);
    expect(activeFigureSlug(state())).toBeNull();
  });

  it('comes back to the overview from a link that was made on a detour from the overview', () => {
    state().startJourney('a', 'd');
    state().closeFigure();
    state().openFigure('lonely');
    const link = toUrlState(state());
    expect(link).toMatchObject({ overview: true, detour: 'lonely', focus: null });

    useAppStore.setState({ focus: 'a', detour: [] });
    state().applyUrlState(parseHash(formatHash(link)));
    expect(state().detour).toEqual(['lonely']);
    state().closeDetour();
    expect(activeFigureSlug(state())).toBeNull();
  });

  it('opens a card again from the overview', () => {
    state().startJourney('a', 'd');
    state().closeFigure();
    state().openFigure('c');
    expect(activeFigureSlug(state())).toBe('c');
    expect(toUrlState(state()).overview).toBe(false);
  });

  it('keeps showing the single figure when there is no route to go back to', () => {
    state().setEndpoint('from', 'a');
    state().closeFigure();
    expect(activeFigureSlug(state())).toBe('a');
  });

  it('restores the overview from a link', () => {
    state().applyUrlState({ ...EMPTY_URL_STATE, from: 'a', to: 'd', overview: true, year: 1475 });
    expect(state().focus).toBeNull();
    expect(state().year).toBe(1475);
    expect(state().routes.length).toBeGreaterThan(0);
  });

  it('goes to a stop of a journey: the year of the stop, with the stop told', async () => {
    state().startJourney('a', 'd');
    await settle();
    state().setPlaying(true);
    state().goToStop('a', 1);

    expect(state().year).toBe(1460);
    expect(state().spotlight).toMatchObject({ figure: 'a', stopIndex: 1, text: 'ikinci olay' });
    expect(state().playing).toBe(false);
  });

  it('ignores a stop that does not exist', async () => {
    state().startJourney('a', 'd');
    await settle();
    const yearBefore = state().year;
    state().goToStop('a', 9);
    state().goToStop('nobody', 0);
    expect(state().year).toBe(yearBefore);
    expect(state().spotlight).toBeNull();
  });

  it('opens the route of the kind chosen before the journey starts', () => {
    expect(state().routeKind).toBe('direct');
    state().setRouteKind('influence');
    state().startJourney('a', 'd');
    expect(currentRoute(state())?.kind).toBe('influence');
  });

  it('switches the route when the kind changes during a journey', () => {
    state().startJourney('a', 'd');
    expect(currentRoute(state())?.kind).toBe('direct');
    state().setRouteKind('influence');
    expect(currentRoute(state())?.kind).toBe('influence');
    expect(state().focus).toBe('a');
  });

  it('opens the route there is when the chosen kind does not exist, and remembers the choice', () => {
    state().setRouteKind('influence');
    state().startJourney('a', 'b');
    expect(currentRoute(state())?.kind).toBe('direct');
    expect(state().routeKind).toBe('influence');
  });

  it('takes the kind of route from a link', () => {
    state().applyUrlState({ ...EMPTY_URL_STATE, from: 'a', to: 'd', routeIndex: 1 });
    expect(currentRoute(state())?.kind).toBe('influence');
    expect(state().routeKind).toBe('influence');
  });
});
