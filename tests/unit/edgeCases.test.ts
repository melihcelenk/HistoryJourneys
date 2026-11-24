import { describe, expect, it } from 'vitest';
import { parseHash } from '../../src/app/urlState';
import { formatYearWithHijri, toHijriYear } from '../../src/domain/calendar';
import { activeYear } from '../../src/domain/journey';
import { buildCauseQuestions, buildOrderingRound, seededRng } from '../../src/domain/quiz';
import { findRoutes } from '../../src/domain/routeEngine';
import type { FigureCard, JourneyStop } from '../../src/domain/types';
import { buildScene } from '../../src/map/mapScene';
import { figure, figureCard, sampleWorld } from './fixtures';

function card(slug: string, causes: string[], journey: JourneyStop[] = []): FigureCard {
  return figureCard(figure(slug, 1500, 1560, 1530), {
    actions: causes.map((cause, index) => ({ id: String(index), year: 1531, text: `${slug} işi ${index}`, cause, consequence: '', sources: [] })),
    journey,
  });
}

describe('calendar boundaries', () => {
  it('has no Hijri year zero: the year of the Hijra is year one', () => {
    expect(toHijriYear(622)).toBe(1);
    expect(toHijriYear(623)).toBe(1);
    expect(formatYearWithHijri(622)).toBe('622 · H. 1');
  });

  it('keeps well-known later years', () => {
    expect(toHijriYear(1453)).toBe(857);
    expect(toHijriYear(1923)).toBe(1342);
  });
});

describe('ordering round with equal years', () => {
  it('never puts two figures with the same active year in one round', () => {
    const figures = [
      figure('a', 1400, 1450, 1430),
      figure('b', 1400, 1450, 1430),
      figure('c', 1400, 1450, 1430),
      figure('d', 1460, 1510, 1480),
      figure('e', 1490, 1540, 1510),
      figure('f', 1520, 1570, 1540),
    ];
    for (let seed = 1; seed <= 30; seed += 1) {
      const round = buildOrderingRound(figures, seededRng(seed));
      const years = round.solution.map((slug) => activeYear(figures.find((item) => item.slug === slug)!));
      expect(new Set(years).size).toBe(years.length);
      expect(round.solution).toHaveLength(4);
    }
  });
});

describe('cause questions', () => {
  it('never offers the same text twice in one question', () => {
    const cards = [card('x', ['Aynı neden.', 'Aynı neden.', 'Başka neden.']), card('y', ['Aynı neden.', 'Üçüncü neden.'])];
    for (let seed = 1; seed <= 30; seed += 1) {
      const questions = buildCauseQuestions(cards, seededRng(seed), 5);
      expect(questions.length).toBeGreaterThan(0);
      for (const question of questions) {
        expect(new Set(question.options).size).toBe(question.options.length);
        expect(question.options).toHaveLength(3);
      }
    }
  });

  it('builds no question when there are not enough different causes', () => {
    expect(buildCauseQuestions([card('x', ['Aynı.', 'Aynı.', 'Aynı.', 'Başka.'])], seededRng(1), 3)).toEqual([]);
  });

  it('builds nothing for a count that is not positive', () => {
    const cards = [card('x', ['Bir.', 'İki.', 'Üç.', 'Dört.'])];
    expect(buildCauseQuestions(cards, seededRng(1), 0)).toEqual([]);
    expect(buildCauseQuestions(cards, seededRng(1), -2)).toEqual([]);
  });
});

describe('route cost', () => {
  it('is the plain sum of the relation weights, for the first route and for alternatives', () => {
    const world = sampleWorld();
    const weights = new Map(world.relationTypes.map((type) => [type.type, type.weight]));
    const routes = findRoutes(world, 'a', 'd');
    expect(routes.length).toBeGreaterThanOrEqual(2);
    for (const route of routes) {
      const expected = route.steps.reduce((sum, step) => sum + (step.linkToNext ? weights.get(step.linkToNext.type)! : 0), 0);
      expect(route.cost).toBeCloseTo(expected, 6);
    }
  });
});

describe('scene with a reloaded card', () => {
  it('shows a figure once even when its card is a different object', () => {
    const stop: JourneyStop = { place: { slug: 'saray', nameTr: 'Saray', lat: 41, lon: 29 }, precision: 'city', from: 1500, to: 1560, event: '' };
    const original = card('x', [], [stop]);
    const reloaded = { ...original };
    const scene = buildScene({ places: [], routeCards: [original], activeCard: reloaded, year: 1540 });
    expect(scene.figures.map((item) => item.slug)).toEqual(['x']);
  });
});

describe('years in links', () => {
  it('ignores a year far outside history', () => {
    expect(parseHash('#/yol/a/b?y=99999').year).toBeNull();
    expect(parseHash('#/yol/a/b?y=-5000').year).toBeNull();
    expect(parseHash('#/yol/a/b?y=1609').year).toBe(1609);
  });
});
