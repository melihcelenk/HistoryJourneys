import { activeYear } from './journey';
import { stripMarkup } from './markup';
import type { FigureCard, FigureSummary } from './types';

/** Random number source in [0, 1); injectable so that rounds are reproducible in tests. */
export type Rng = () => number;

/** Small seeded generator (mulberry32) for reproducible rounds. */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

export interface OrderingRound {
  /** Figure slugs in the shuffled order shown to the player. */
  shuffled: string[];
  /** The same slugs in chronological order. */
  solution: string[];
}

export const ORDERING_ROUND_SIZE = 5;

/** Keeps the first item for every key; later items with a key already seen are dropped. */
function uniqueBy<T, K>(items: T[], key: (item: T) => K): T[] {
  const seen = new Set<K>();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

/**
 * Builds a "put these figures in chronological order" round (FR-21). Figures
 * that share an active year never meet in one round, so that every round has
 * exactly one correct order.
 */
export function buildOrderingRound(figures: FigureSummary[], rng: Rng, size = ORDERING_ROUND_SIZE): OrderingRound {
  const picked = uniqueBy(shuffle(figures, rng), activeYear).slice(0, size);
  const solution = [...picked].sort((a, b) => activeYear(a) - activeYear(b)).map((figure) => figure.slug);
  let shuffled = shuffle(solution, rng);
  // A round that starts solved is no puzzle; rotate it once.
  if (solution.length > 1 && shuffled.every((slug, index) => slug === solution[index])) {
    shuffled = [...shuffled.slice(1), shuffled[0] as string];
  }
  return { shuffled, solution };
}

/** Counts how many positions of the player's order match the solution. */
export function scoreOrdering(order: string[], solution: string[]): number {
  return order.filter((slug, index) => slug === solution[index]).length;
}

export interface CauseQuestion {
  figure: string;
  figureName: string;
  action: string;
  /** Candidate causes as plain text; exactly one is correct. */
  options: string[];
  correctIndex: number;
}

const CAUSE_OPTION_COUNT = 3;

interface CauseEntry {
  card: FigureCard;
  action: string;
  cause: string;
}

/**
 * Builds "which cause led to this action?" questions from the given cards
 * (FR-21). Options are compared as the reader sees them, so one question never
 * shows the same text twice; a question without enough different wrong answers
 * is not asked.
 */
export function buildCauseQuestions(cards: FigureCard[], rng: Rng, count: number): CauseQuestion[] {
  if (count <= 0) return [];
  const pool: CauseEntry[] = cards.flatMap((card) =>
    card.actions.map((action) => ({ card, action: stripMarkup(action.text), cause: stripMarkup(action.cause) })),
  );
  const questions: CauseQuestion[] = [];
  for (const entry of shuffle(pool, rng)) {
    if (questions.length >= count) break;
    const otherCauses = uniqueBy(
      shuffle(pool, rng).filter((other) => other.cause !== entry.cause),
      (other) => other.cause,
    ).map((other) => other.cause);
    if (otherCauses.length < CAUSE_OPTION_COUNT - 1) continue;
    const options = shuffle([entry.cause, ...otherCauses.slice(0, CAUSE_OPTION_COUNT - 1)], rng);
    questions.push({
      figure: entry.card.slug,
      figureName: entry.card.nameTr,
      action: entry.action,
      options,
      correctIndex: options.indexOf(entry.cause),
    });
  }
  return questions;
}
