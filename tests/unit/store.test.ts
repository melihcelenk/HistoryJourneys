import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../../src/app/store';
import { DEFAULT_MAP_KIND, EMPTY_URL_STATE } from '../../src/app/urlState';
import type { ContentRepository } from '../../src/data/ContentRepository';
import type { Concept, FigureCard } from '../../src/domain/types';
import { figureCard, sampleWorld } from './fixtures';

function cardOf(slug: string): FigureCard {
  return figureCard(sampleWorld().figures.find((item) => item.slug === slug)!);
}

const CONCEPT: Concept = { slug: 'kavram', term: 'Kavram', meaning: 'Anlam', related: [] };
const DISK_ERROR = 'disk error';

function repository(overrides: Partial<ContentRepository> = {}): ContentRepository {
  return {
    loadWorld: async () => sampleWorld(),
    getFigureCard: async (slug) => cardOf(slug),
    getConcept: async () => CONCEPT,
    close: () => undefined,
    ...overrides,
  };
}

/** Lets pending promise callbacks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  useAppStore.setState(useAppStore.getInitialState(), true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loading cards', () => {
  it('records the cards that could not be loaded instead of failing silently', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failing = repository({
      getFigureCard: async (slug) => {
        if (slug === 'b') throw new Error(DISK_ERROR);
        return cardOf(slug);
      },
    });
    await useAppStore.getState().init(failing, EMPTY_URL_STATE);
    useAppStore.getState().startJourney('a', 'd');
    await settle();

    const state = useAppStore.getState();
    expect(state.failedCards).toContain('b');
    expect(Object.keys(state.cards)).toEqual(expect.arrayContaining(['a', 'c', 'd']));
    expect(logged).toHaveBeenCalled();
  });

  it('retries a failed card when it is opened again', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let broken = true;
    const flaky = repository({
      getFigureCard: async (slug) => {
        if (slug === 'b' && broken) throw new Error(DISK_ERROR);
        return cardOf(slug);
      },
    });
    await useAppStore.getState().init(flaky, EMPTY_URL_STATE);
    useAppStore.getState().startJourney('a', 'd');
    await settle();
    broken = false;
    useAppStore.getState().openFigure('b');
    await settle();

    expect(useAppStore.getState().cards.b).toBeDefined();
    expect(useAppStore.getState().failedCards).not.toContain('b');
  });
});

describe('choosing the two figures', () => {
  it('never keeps the same figure at both ends', async () => {
    await useAppStore.getState().init(repository(), EMPTY_URL_STATE);
    useAppStore.getState().startJourney('a', 'd');
    useAppStore.getState().setEndpoint('to', 'a');
    expect(useAppStore.getState().from).toBeNull();
    expect(useAppStore.getState().to).toBe('a');

    useAppStore.getState().startJourney('b', 'b');
    expect(useAppStore.getState().to).toBe('a');
  });

  it('keeps a destination that is chosen before the start', async () => {
    await useAppStore.getState().init(repository(), EMPTY_URL_STATE);
    useAppStore.getState().setEndpoint('to', 'd');
    expect(useAppStore.getState().to).toBe('d');
    useAppStore.getState().setEndpoint('from', 'a');
    expect(useAppStore.getState().routes.length).toBeGreaterThan(0);
  });
});

describe('opening a concept', () => {
  it('does not replace a dialog the reader opened while the concept was loading', async () => {
    let release: (concept: Concept) => void = () => undefined;
    const slow = repository({ getConcept: () => new Promise<Concept>((resolve) => (release = resolve)) });
    await useAppStore.getState().init(slow, EMPTY_URL_STATE);

    const pending = useAppStore.getState().openConcept(CONCEPT.slug);
    useAppStore.getState().openDialog({ kind: 'about' });
    release(CONCEPT);
    await pending;

    expect(useAppStore.getState().dialog).toEqual({ kind: 'about' });
  });

  it('opens the concept when nothing else happened meanwhile', async () => {
    await useAppStore.getState().init(repository(), EMPTY_URL_STATE);
    await useAppStore.getState().openConcept(CONCEPT.slug);
    expect(useAppStore.getState().dialog).toEqual({ kind: 'concept', concept: CONCEPT });
  });
});

describe('opening a figure while only the destination is chosen', () => {
  it('makes the figure the start and computes the routes', async () => {
    await useAppStore.getState().init(repository(), EMPTY_URL_STATE);
    useAppStore.getState().setEndpoint('to', 'd');
    useAppStore.getState().openFigure('a');

    const state = useAppStore.getState();
    expect(state.from).toBe('a');
    expect(state.to).toBe('d');
    expect(state.routes.length).toBeGreaterThan(0);
  });

  it('never ends up with the same figure at both ends', async () => {
    await useAppStore.getState().init(repository(), EMPTY_URL_STATE);
    useAppStore.getState().setEndpoint('to', 'd');
    useAppStore.getState().openFigure('d');

    const state = useAppStore.getState();
    expect(state.from).toBe('d');
    expect(state.to).toBeNull();
  });
});

describe('failures of the repository', () => {
  it('closes the repository when the content cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const close = vi.fn();
    const broken = repository({ loadWorld: async () => Promise.reject(new Error('corrupt')), close });
    await useAppStore.getState().init(broken, EMPTY_URL_STATE);

    expect(useAppStore.getState().status).toBe('error');
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('still shows the error screen when the repository cannot even be closed', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const broken = repository({
      loadWorld: async () => Promise.reject(new Error('corrupt')),
      close: () => {
        throw new Error('already closed');
      },
    });

    await expect(useAppStore.getState().init(broken, EMPTY_URL_STATE)).resolves.toBeUndefined();
    expect(useAppStore.getState().status).toBe('error');
    expect(logged).toHaveBeenCalledTimes(2);
  });

  it('logs a concept that cannot be loaded instead of rejecting', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failing = repository({ getConcept: async () => Promise.reject(new Error(DISK_ERROR)) });
    await useAppStore.getState().init(failing, EMPTY_URL_STATE);

    await expect(useAppStore.getState().openConcept(CONCEPT.slug)).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalled();
    expect(useAppStore.getState().dialog).toBeNull();
  });
});

describe('opening the figure whose card is already open', () => {
  it('keeps the year and the event that is being told', async () => {
    await useAppStore.getState().init(repository(), EMPTY_URL_STATE);
    useAppStore.getState().startJourney('a', 'd');
    await settle();
    const told = { year: 1444, figure: 'a', figureName: 'A', stopIndex: 0, place: { slug: 'yer', nameTr: 'Yer', lat: 40, lon: 30 }, placeName: 'Yer', years: '1444', text: 'olay' };
    useAppStore.setState({ year: 1444, spotlight: told });
    useAppStore.getState().openFigure('a');

    expect(useAppStore.getState().year).toBe(1444);
    expect(useAppStore.getState().spotlight).toEqual(told);
  });

  it('still moves time when another figure is opened', async () => {
    await useAppStore.getState().init(repository(), EMPTY_URL_STATE);
    useAppStore.getState().startJourney('a', 'd');
    useAppStore.setState({ year: 1444 });
    useAppStore.getState().openFigure('c');
    // The cards of this file have no journey: time goes to the birth of the figure.
    expect(useAppStore.getState().year).toBe(1460);
  });
});

describe('small guarantees of the store', () => {
  it('asks for a card once when the first figure is opened', async () => {
    const asked: string[] = [];
    const counting = repository({
      getFigureCard: async (slug) => {
        asked.push(slug);
        return cardOf(slug);
      },
    });
    await useAppStore.getState().init(counting, EMPTY_URL_STATE);
    useAppStore.getState().openFigure('a');
    await settle();
    expect(asked).toEqual(['a']);
  });

  it('does nothing when there is no detour to leave', async () => {
    await useAppStore.getState().init(repository(), EMPTY_URL_STATE);
    useAppStore.getState().startJourney('a', 'd');
    useAppStore.setState({ year: 1444, playing: true });
    useAppStore.getState().closeDetour();

    expect(useAppStore.getState().year).toBe(1444);
    expect(useAppStore.getState().playing).toBe(true);
  });

  it('goes back to the plain map for a link that names no map', async () => {
    await useAppStore.getState().init(repository(), EMPTY_URL_STATE);
    useAppStore.getState().applyUrlState({ ...EMPTY_URL_STATE, from: 'a', to: 'd', map: 'pixi' });
    expect(useAppStore.getState().mapKind).toBe('pixi');
    useAppStore.getState().applyUrlState({ ...EMPTY_URL_STATE, from: 'a', to: 'd' });
    expect(useAppStore.getState().mapKind).toBe(DEFAULT_MAP_KIND);
  });
});

describe('leaving a detour', () => {
  it('stops playback and the telling of an event, like every other change of card', async () => {
    await useAppStore.getState().init(repository(), EMPTY_URL_STATE);
    useAppStore.getState().startJourney('a', 'd');
    useAppStore.getState().openFigure('lonely');
    await settle();
    // Something is being told and time is playing, so that the test fails if leaving the detour clears nothing.
    useAppStore.setState({ spotlight: { year: 1500, figure: 'lonely', figureName: 'LONELY', stopIndex: 0, place: { slug: 'yer', nameTr: 'Yer', lat: 40, lon: 30 }, placeName: 'Yer', years: '1500', text: 'olay' } });
    useAppStore.getState().setPlaying(true);
    expect(useAppStore.getState().spotlight).not.toBeNull();
    expect(useAppStore.getState().playing).toBe(true);
    useAppStore.getState().closeDetour();

    expect(useAppStore.getState().playing).toBe(false);
    expect(useAppStore.getState().spotlight).toBeNull();
  });
});
