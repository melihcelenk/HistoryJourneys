import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../../src/app/store';
import { EMPTY_URL_STATE } from '../../src/app/urlState';
import type { ContentRepository } from '../../src/data/ContentRepository';
import type { Concept, FigureCard } from '../../src/domain/types';
import { figureCard, sampleWorld } from './fixtures';

function cardOf(slug: string): FigureCard {
  return figureCard(sampleWorld().figures.find((item) => item.slug === slug)!);
}

const CONCEPT: Concept = { slug: 'kavram', term: 'Kavram', meaning: 'Anlam', related: [] };

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
        if (slug === 'b') throw new Error('disk error');
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
        if (slug === 'b' && broken) throw new Error('disk error');
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

    const pending = useAppStore.getState().openConcept('kavram');
    useAppStore.getState().openDialog({ kind: 'about' });
    release(CONCEPT);
    await pending;

    expect(useAppStore.getState().dialog).toEqual({ kind: 'about' });
  });

  it('opens the concept when nothing else happened meanwhile', async () => {
    await useAppStore.getState().init(repository(), EMPTY_URL_STATE);
    await useAppStore.getState().openConcept('kavram');
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

  it('logs a concept that cannot be loaded instead of rejecting', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failing = repository({ getConcept: async () => Promise.reject(new Error('disk error')) });
    await useAppStore.getState().init(failing, EMPTY_URL_STATE);

    await expect(useAppStore.getState().openConcept('kavram')).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalled();
    expect(useAppStore.getState().dialog).toBeNull();
  });
});
