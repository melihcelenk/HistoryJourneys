import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildDatabase } from '../../src/data/buildDatabase';
import { SqliteContentRepository } from '../../src/data/SqliteContentRepository';
import { figureSchema, PORTRAIT_LICENSES, type FigureSeed } from '../../src/domain/contentSchema';
import { loadContent } from '../../scripts/loadContent';
import { BUILT_AT, figureSeed, sampleSeed } from './fixtures';

type PortraitSeed = NonNullable<FigureSeed['portrait']>;

function portrait(overrides: Partial<PortraitSeed> = {}): PortraitSeed {
  return {
    file: 'Portrait of X.jpg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Portrait_of_X.jpg',
    title: 'X portresi',
    author: 'Bilinmeyen sanatçı',
    created: '1579',
    license: 'Public domain',
    representative: false,
    crop: { x: 0.5, y: 0.3, size: 0.6 },
    ...overrides,
  };
}

/** A complete portrait record with one field left out. */
function without(field: keyof PortraitSeed): Partial<PortraitSeed> {
  return Object.fromEntries(Object.entries(portrait()).filter(([key]) => key !== field));
}

const parses = (value: unknown): boolean => figureSchema.safeParse(figureSeed('x', { portrait: value as PortraitSeed })).success;

describe('the portrait of a figure in the content', () => {
  it('is optional: a figure without a portrait is complete', () => {
    expect(figureSchema.safeParse(figureSeed('x')).success).toBe(true);
  });

  it('accepts a public domain or CC0 portrait with its record', () => {
    expect(PORTRAIT_LICENSES).toEqual(['Public domain', 'CC0']);
    for (const license of PORTRAIT_LICENSES) expect(parses(portrait({ license }))).toBe(true);
  });

  it('rejects any other licence', () => {
    for (const license of ['CC BY-SA 4.0', 'CC BY 4.0', 'All rights reserved', '']) {
      expect(parses({ ...portrait(), license })).toBe(false);
    }
  });

  it('rejects a portrait whose author, date, title or source is missing', () => {
    for (const field of ['author', 'created', 'title', 'sourceUrl', 'file'] as const) {
      expect(parses(without(field))).toBe(false);
      expect(parses({ ...portrait(), [field]: '' })).toBe(false);
    }
  });

  it('rejects a portrait that does not say whether it was made in the lifetime of the figure', () => {
    expect(parses(without('representative'))).toBe(false);
  });

  it('accepts only a file page of Wikimedia Commons as the source', () => {
    expect(parses(portrait({ sourceUrl: 'https://example.org/portrait.jpg' }))).toBe(false);
    expect(parses(portrait({ sourceUrl: 'http://commons.wikimedia.org/wiki/File:X.jpg' }))).toBe(false);
    expect(parses(portrait({ sourceUrl: 'https://commons.wikimedia.org/wiki/Category:X' }))).toBe(false);
  });

  it('rejects a source page that is not the page of the file that is used', () => {
    expect(parses(portrait({ file: 'Another picture.jpg' }))).toBe(false);
    // Commons writes spaces as underscores and escapes other characters in addresses; both forms name one file.
    expect(parses(portrait({ file: 'Portrait_of_X.jpg' }))).toBe(true);
    expect(parses(portrait({ file: 'Şemâilnâme (1579).jpg', sourceUrl: 'https://commons.wikimedia.org/wiki/File:%C5%9Eem%C3%A2iln%C3%A2me_(1579).jpg' }))).toBe(true);
  });

  it('rejects a crop that reaches outside the picture', () => {
    expect(parses(portrait({ crop: { x: 1.2, y: 0.3, size: 0.5 } }))).toBe(false);
    expect(parses(portrait({ crop: { x: 0.5, y: 0.3, size: 0 } }))).toBe(false);
    expect(parses(portrait({ crop: { x: 0.5, y: 0.3, size: 1.5 } }))).toBe(false);
  });
});

describe('the portrait in the database', () => {
  let SQL: SqlJsStatic;
  beforeAll(async () => {
    SQL = await initSqlJs();
  });

  it('reaches the application with what the reader is shown, and not the crop', async () => {
    const seed = sampleSeed();
    seed.figures[0] = { ...seed.figures[0]!, portrait: portrait({ representative: true }) };
    const repository = new SqliteContentRepository(buildDatabase(SQL, seed, BUILT_AT));
    try {
      const world = await repository.loadWorld();
      const expected = {
        title: 'X portresi',
        author: 'Bilinmeyen sanatçı',
        created: '1579',
        license: 'Public domain',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Portrait_of_X.jpg',
        representative: true,
      };
      expect(world.figures.find((figure) => figure.slug === 'x')?.portrait).toEqual(expected);
      expect(world.figures.find((figure) => figure.slug === 'y')?.portrait).toBeUndefined();
      expect((await repository.getFigureCard('x'))?.portrait).toEqual(expected);
    } finally {
      repository.close();
    }
  });
});

describe('the portraits of the real content', () => {
  const content = loadContent(join(process.cwd(), 'content'));
  const folder = join(process.cwd(), 'public', 'portraits');
  const withPortrait = content.seed.figures.filter((figure) => figure.portrait);

  it('passes the schema', () => {
    expect(content.errors).toEqual([]);
  });

  it('has an image file for every portrait record', () => {
    expect(withPortrait.length).toBeGreaterThan(0);
    for (const figure of withPortrait) {
      expect(existsSync(join(folder, `${figure.slug}.webp`)), `${figure.slug}.webp`).toBe(true);
    }
  });

  it('has no image file without a record: every picture that is shipped is accounted for', () => {
    const recorded = new Set(withPortrait.map((figure) => `${figure.slug}.webp`));
    expect(readdirSync(folder).filter((file) => !recorded.has(file))).toEqual([]);
  });

  it('never uses the same picture for two figures', () => {
    const files = withPortrait.map((figure) => figure.portrait!.file);
    expect(new Set(files).size).toBe(files.length);
  });
});
