import { describe, expect, it } from 'vitest';
import { formatYearRange, formatYearWithHijri, toHijriYear } from '../../src/domain/calendar';
import { activeYear, stopAtYear, stopsUntilYear } from '../../src/domain/journey';
import { extractLinks, parseMarkup, stripMarkup } from '../../src/domain/markup';
import { buildCauseQuestions, buildOrderingRound, scoreOrdering, seededRng } from '../../src/domain/quiz';
import type { FigureCard, JourneyStop } from '../../src/domain/types';
import { figure } from './fixtures';

describe('markup', () => {
  const text = 'Babası [[f:mehmed-iii|III. Mehmed]] ve [[c:ekber-ve-ersed|ekber ve erşed]] kuralı.';

  it('splits text into text and link segments', () => {
    expect(parseMarkup(text)).toEqual([
      { kind: 'text', text: 'Babası ' },
      { kind: 'link', target: 'figure', slug: 'mehmed-iii', text: 'III. Mehmed' },
      { kind: 'text', text: ' ve ' },
      { kind: 'link', target: 'concept', slug: 'ekber-ve-ersed', text: 'ekber ve erşed' },
      { kind: 'text', text: ' kuralı.' },
    ]);
  });

  it('strips markup to the text the reader sees', () => {
    expect(stripMarkup(text)).toBe('Babası III. Mehmed ve ekber ve erşed kuralı.');
  });

  it('lists link targets', () => {
    expect(extractLinks(text)).toEqual([
      { target: 'figure', slug: 'mehmed-iii' },
      { target: 'concept', slug: 'ekber-ve-ersed' },
    ]);
  });

  it('leaves plain and malformed text untouched', () => {
    expect(parseMarkup('Düz metin.')).toEqual([{ kind: 'text', text: 'Düz metin.' }]);
    expect(stripMarkup('[[x:abc|metin]] kalır')).toBe('[[x:abc|metin]] kalır');
    expect(parseMarkup('')).toEqual([]);
  });
});

describe('calendar', () => {
  it('converts well-known years to the Hijri calendar', () => {
    expect(toHijriYear(1453)).toBe(857);
    expect(toHijriYear(1923)).toBe(1342);
  });

  it('has no Hijri year before the Hijra', () => {
    expect(toHijriYear(500)).toBeNull();
    expect(formatYearWithHijri(500)).toBe('500');
  });

  it('formats years for display', () => {
    expect(formatYearWithHijri(1453)).toBe('1453 · H. 857');
    expect(formatYearRange(1590, 1617)).toBe('1590–1617');
    expect(formatYearRange(1617, 1617)).toBe('1617');
  });
});

describe('journey', () => {
  const stop = (slug: string, from: number, to: number): JourneyStop => ({
    place: { slug, nameTr: slug, lat: 0, lon: 0 },
    precision: 'city',
    from,
    to,
    event: '',
  });
  const journey = [stop('manisa', 1590, 1595), stop('istanbul', 1595, 1611), stop('edirne', 1612, 1613), stop('turbe', 1617, 1617)];
  const ahmed = { birthYear: 1590, deathYear: 1617 };

  it('finds where a figure was in a given year', () => {
    expect(stopAtYear(ahmed, journey, 1592)?.place.slug).toBe('manisa');
    expect(stopAtYear(ahmed, journey, 1609)?.place.slug).toBe('istanbul');
    expect(stopAtYear(ahmed, journey, 1612)?.place.slug).toBe('edirne');
  });

  it('keeps the figure at the last stop between two stops', () => {
    expect(stopAtYear(ahmed, journey, 1615)?.place.slug).toBe('edirne');
  });

  it('returns nothing outside the lifetime', () => {
    expect(stopAtYear(ahmed, journey, 1589)).toBeNull();
    expect(stopAtYear(ahmed, journey, 1618)).toBeNull();
  });

  it('lists the stops reached so far', () => {
    expect(stopsUntilYear(journey, 1600).map((item) => item.place.slug)).toEqual(['manisa', 'istanbul']);
  });

  it('uses the accession year, or adulthood, as the active year', () => {
    expect(activeYear(figure('s', 1590, 1617, 1603))).toBe(1603);
    expect(activeYear(figure('v', 1500, 1570))).toBe(1530);
    expect(activeYear(figure('young', 1500, 1520))).toBe(1520);
  });
});

describe('quiz', () => {
  const figures = [figure('a', 1400, 1450, 1430), figure('b', 1430, 1480, 1450), figure('c', 1460, 1510, 1480), figure('d', 1490, 1540, 1510), figure('e', 1520, 1570, 1540), figure('f', 1550, 1600, 1570)];

  it('builds an ordering round that is not already solved', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const round = buildOrderingRound(figures, seededRng(seed));
      expect(round.solution).toHaveLength(5);
      expect([...round.shuffled].sort()).toEqual([...round.solution].sort());
      expect(round.shuffled).not.toEqual(round.solution);
    }
  });

  it('puts the solution in chronological order', () => {
    const round = buildOrderingRound(figures, seededRng(7));
    const years = round.solution.map((slug) => figures.find((item) => item.slug === slug)!.reign!.from);
    expect(years).toEqual([...years].sort((x, y) => x - y));
  });

  it('is reproducible for the same seed', () => {
    expect(buildOrderingRound(figures, seededRng(3))).toEqual(buildOrderingRound(figures, seededRng(3)));
  });

  it('scores correct positions', () => {
    expect(scoreOrdering(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(3);
    expect(scoreOrdering(['b', 'a', 'c'], ['a', 'b', 'c'])).toBe(1);
  });

  const card = (slug: string): FigureCard => ({
    ...figure(slug, 1500, 1560, 1530),
    summary: ['', '', ''],
    actions: [
      { id: '1', year: 1531, text: `${slug} işi`, cause: `${slug} [[f:a|nedeni]] 1`, consequence: '', sources: [] },
      { id: '2', year: 1541, text: `${slug} diğer işi`, cause: `${slug} nedeni 2`, consequence: '', sources: [] },
    ],
    journey: [],
    sources: [],
    generation: { model: '', ruleset: '', date: '', status: 'generated' },
  });

  it('builds cause questions with exactly one correct option', () => {
    const questions = buildCauseQuestions([card('x'), card('y')], seededRng(5), 3);
    expect(questions).toHaveLength(3);
    for (const question of questions) {
      expect(question.options).toHaveLength(3);
      expect(new Set(question.options).size).toBe(3);
      expect(question.options[question.correctIndex]).toContain(question.figure);
      expect(question.options.join(' ')).not.toContain('[[');
    }
  });

  it('builds no cause questions when there are too few actions', () => {
    const single = { ...card('x'), actions: card('x').actions.slice(0, 1) };
    expect(buildCauseQuestions([single], seededRng(1), 3)).toEqual([]);
  });
});
