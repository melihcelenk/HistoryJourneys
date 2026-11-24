import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../../src/app/store';
import { EMPTY_URL_STATE } from '../../src/app/urlState';
import type { ContentRepository } from '../../src/data/ContentRepository';
import type { FigureCard, JourneyStop } from '../../src/domain/types';
import { figureCard, sampleWorld } from './fixtures';

/** Years after the birth at which the journeys of these cards begin and continue. */
const FIRST_STOP_AFTER_BIRTH = 5;
const SECOND_STOP_AFTER_BIRTH = 25;

function stopFrom(slug: string, from: number): JourneyStop {
  return { place: { slug: `${slug}-${from}`, nameTr: `${slug} ${from}`, lat: 40, lon: 30 }, precision: 'city', from, to: from + 3, event: 'olay' };
}

/** A card whose journey begins a few years after the birth: neither the birth year nor the active year. */
function cardOf(slug: string): FigureCard {
  const summary = sampleWorld().figures.find((item) => item.slug === slug)!;
  const journey = slug === 'lonely' ? [] : [stopFrom(slug, summary.birthYear + FIRST_STOP_AFTER_BIRTH), stopFrom(slug, summary.birthYear + SECOND_STOP_AFTER_BIRTH)];
  return figureCard(summary, { journey });
}

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

describe('opening a figure starts its journey at the first stop', () => {
  it('goes to the year of the first stop once the card has arrived', async () => {
    state().startJourney('a', 'd');
    // The card is still loading: time waits at the birth of the figure.
    expect(state().year).toBe(1400);
    await settle();
    expect(state().year).toBe(1405);
  });

  it('goes there at once when the card is already loaded', async () => {
    state().startJourney('a', 'd');
    await settle();
    state().openFigure('c');
    expect(state().year).toBe(1465);
  });

  it('does the same for a detour and on the way back from it', async () => {
    state().startJourney('a', 'd');
    await settle();
    state().openFigure('w');
    await settle();
    expect(state().year).toBe(1455);
    state().closeDetour();
    expect(state().year).toBe(1405);
  });

  it('keeps the year the reader chose while the card was loading', async () => {
    state().startJourney('a', 'd');
    state().setYear(1420);
    await settle();
    expect(state().year).toBe(1420);
  });

  it('keeps the year of a link', async () => {
    state().applyUrlState({ ...EMPTY_URL_STATE, from: 'a', to: 'd', year: 1444 });
    await settle();
    expect(state().year).toBe(1444);
  });

  it('keeps the year of a link that opens a detour, too', async () => {
    state().applyUrlState({ ...EMPTY_URL_STATE, from: 'a', to: 'd', detour: 'w', year: 1444 });
    await settle();
    expect(state().detour).toEqual(['w']);
    expect(state().year).toBe(1444);
  });

  it('stays at the birth of a figure that has no journey', async () => {
    state().startJourney('a', 'd');
    await settle();
    state().openFigure('lonely');
    await settle();
    expect(state().year).toBe(1500);
  });

  it('does not move time when a card arrives for a figure that is no longer open', async () => {
    state().startJourney('a', 'd');
    state().closeFigure();
    const yearInOverview = state().year;
    await settle();
    expect(state().year).toBe(yearInOverview);
  });
});

describe('the tab of the card', () => {
  it('opens on the overview and is kept from one card to the next', async () => {
    expect(state().cardTab).toBe('overview');
    state().startJourney('a', 'd');
    state().setCardTab('journey');
    state().openFigure('c');
    expect(state().cardTab).toBe('journey');
  });
});
