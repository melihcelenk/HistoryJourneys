import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { figureSchema } from '../../src/domain/contentSchema';
import { buildDatabase } from '../../src/data/buildDatabase';
import { validateContent } from '../../src/data/contentValidation';
import { SqliteContentRepository } from '../../src/data/SqliteContentRepository';
import { findRoutes } from '../../src/domain/routeEngine';
import { BUILT_AT, figureSeed, RELATION_TYPES, sampleSeed } from './fixtures';

let SQL: SqlJsStatic;

beforeAll(async () => {
  SQL = await initSqlJs();
});

describe('figure schema', () => {
  it('accepts a complete figure', () => {
    expect(figureSchema.safeParse(figureSeed('x')).success).toBe(true);
  });

  it('requires exactly three summary sentences', () => {
    expect(figureSchema.safeParse(figureSeed('x', { summary: ['Bir.', 'İki.'] })).success).toBe(false);
  });

  it('requires at least two sources and two actions', () => {
    const seed = figureSeed('x');
    expect(figureSchema.safeParse({ ...seed, sources: seed.sources.slice(0, 1) }).success).toBe(false);
    expect(figureSchema.safeParse({ ...seed, actions: seed.actions.slice(0, 1) }).success).toBe(false);
  });
});

describe('validateContent', () => {
  it('accepts consistent content', () => {
    expect(validateContent(sampleSeed())).toEqual([]);
  });

  it('reports a relation to an unknown figure', () => {
    const seed = sampleSeed();
    seed.figures[0]!.relations.push({ to: 'nobody', type: 'child_of', note: 'n' });
    expect(validateContent(seed)).toContain('x: relation to unknown figure "nobody"');
  });

  it('reports an unknown relation type', () => {
    const seed = sampleSeed();
    seed.figures[0]!.relations.push({ to: 'y', type: 'met_once', note: 'n' });
    expect(validateContent(seed)).toContain('x: unknown relation type "met_once"');
  });

  it('reports links to unknown figures and concepts', () => {
    const seed = sampleSeed();
    seed.figures[1]!.actions[0]!.cause = '[[f:ghost|Hayalet]] ve [[c:yok|yok]]';
    const errors = validateContent(seed);
    expect(errors).toContain('y: link to unknown figure "ghost"');
    expect(errors).toContain('y: link to unknown concept "yok"');
  });

  it('reports an action citing an unknown source', () => {
    const seed = sampleSeed();
    seed.figures[1]!.actions[0]!.sources = ['missing'];
    expect(validateContent(seed)).toContain('y: action "ilk" cites unknown source "missing"');
  });

  it('reports the same place with different coordinates', () => {
    const seed = sampleSeed();
    seed.figures[1]!.journey[0]!.place.lat = 10;
    expect(validateContent(seed)).toContainEqual(expect.stringContaining('place "manisa" has different coordinates'));
  });

  it('reports a journey that is out of order', () => {
    const seed = sampleSeed();
    seed.figures[1]!.journey[1]!.from = 1400;
    expect(validateContent(seed)).toContain('y: journey stop 2 is out of order');
  });

  it('reports an unknown line member and duplicate figures', () => {
    const seed = sampleSeed();
    seed.lines[0]!.members.push('nobody');
    seed.figures.push(figureSeed('x'));
    const errors = validateContent(seed);
    expect(errors).toContain('line hat: unknown figure "nobody"');
    expect(errors).toContain('duplicate figure "x"');
  });
});

describe('SqliteContentRepository', () => {
  const opened: SqliteContentRepository[] = [];
  const open = () => {
    const repository = new SqliteContentRepository(buildDatabase(SQL, sampleSeed(), BUILT_AT));
    opened.push(repository);
    return repository;
  };

  afterEach(() => {
    // sql.js keeps its memory until a database is closed.
    opened.splice(0).forEach((repository) => repository.close());
  });

  it('loads figures ordered by birth year with their reign', async () => {
    const world = await open().loadWorld();
    expect(world.figures.map((item) => item.slug)).toEqual(['y', 'x']);
    expect(world.figures[0]!.reign).toEqual({ from: 1500, to: 1530 });
    expect(world.relationTypes).toHaveLength(RELATION_TYPES.length);
  });

  it('adds a succession relation between consecutive line members', async () => {
    const world = await open().loadWorld();
    expect(world.relations).toContainEqual({ from: 'x', to: 'y', type: 'succeeded', note: 'Hat: Figür y → Figür x' });
    expect(world.relations).toContainEqual({ from: 'x', to: 'y', type: 'child_of', note: 'x, y çocuğudur.' });
    expect(world.lines).toEqual([{ slug: 'hat', nameTr: 'Hat', description: 'Taht sırası', members: ['y', 'x'] }]);
  });

  it('returns a full card with actions, journey and sources in order', async () => {
    const card = await open().getFigureCard('x');
    expect(card?.summary).toEqual(['Bir.', 'İki.', 'Üç.']);
    expect(card?.actions.map((action) => action.id)).toEqual(['ilk', 'ikinci']);
    expect(card?.actions[1]!.depth).toBeUndefined();
    expect(card?.journey.map((stop) => stop.place.slug)).toEqual(['manisa', 'istanbul', 'edirne']);
    expect(card?.journey[1]!.place.historicName).toBe('Kostantiniyye');
    expect(card?.sources).toHaveLength(2);
    expect(card?.generation.ruleset).toBe('0.0.0');
  });

  it('returns a concept with its root and related words', async () => {
    const concept = await open().getConcept('kavram');
    expect(concept?.root?.letters).toBe('k-v-m');
    expect(concept?.related).toEqual([{ term: 'kıyam', meaning: 'ayağa kalkma' }]);
  });

  it('returns null for unknown slugs', async () => {
    const repository = open();
    expect(await repository.getFigureCard('nobody')).toBeNull();
    expect(await repository.getConcept('nothing')).toBeNull();
  });

  it('feeds the route engine', async () => {
    const world = await open().loadWorld();
    expect(findRoutes(world, 'y', 'x')[0]!.steps.map((step) => step.figure)).toEqual(['y', 'x']);
  });
});
