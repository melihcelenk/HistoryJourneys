import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import initSqlJs from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildDatabase } from '../../src/data/buildDatabase';
import { validateContent } from '../../src/data/contentValidation';
import { SqliteContentRepository } from '../../src/data/SqliteContentRepository';
import { findRoutes } from '../../src/domain/routeEngine';
import type { World } from '../../src/domain/types';
import { MAP_REGION } from '../../src/map/mapRegion';
import { loadContent } from '../../scripts/loadContent';
import { BUILT_AT } from './fixtures';

const SLUG = 'konstantin-i';
const CONQUEROR = 'mehmed-ii';

describe('Constantine I in the real content', () => {
  const content = loadContent(join(process.cwd(), 'content'));
  const figure = content.seed.figures.find((candidate) => candidate.slug === SLUG);
  let world: World;

  beforeAll(async () => {
    const repository = new SqliteContentRepository(buildDatabase(await initSqlJs(), content.seed, BUILT_AT));
    try {
      world = await repository.loadWorld();
    } finally {
      repository.close();
    }
  });

  it('leaves the content valid', () => {
    expect(content.errors).toEqual([]);
    expect(validateContent(content.seed)).toEqual([]);
  });

  it('is a Roman emperor who was born in Niş and died near İzmit', () => {
    expect(figure).toBeDefined();
    expect(figure!.roles.join(' ')).toMatch(/Roma imparatoru/);
    expect(figure!.journey[0]!.place.slug).toBe('nis');
    expect(figure!.journey[0]!.from).toBe(figure!.birth.year);
    expect(figure!.journey.at(-1)!.place.slug).toBe('izmit');
    expect(figure!.journey.at(-1)!.to).toBe(figure!.death.year);
  });

  it('has every stop of his journey within his life and on the map', () => {
    for (const stop of figure!.journey) {
      expect(stop.from, stop.place.slug).toBeGreaterThanOrEqual(figure!.birth.year);
      expect(stop.to, stop.place.slug).toBeLessThanOrEqual(figure!.death.year);
      expect(stop.place.lon, stop.place.slug).toBeGreaterThan(MAP_REGION.west);
      expect(stop.place.lon, stop.place.slug).toBeLessThan(MAP_REGION.east);
      expect(stop.place.lat, stop.place.slug).toBeGreaterThan(MAP_REGION.south);
      expect(stop.place.lat, stop.place.slug).toBeLessThan(MAP_REGION.north);
    }
  });

  it('comes to the city he made his capital, the same place the conqueror enters', () => {
    const own = figure!.journey.find((stop) => stop.place.slug === 'istanbul');
    const later = content.seed.figures.find((candidate) => candidate.slug === CONQUEROR)!.journey.find((stop) => stop.place.slug === 'istanbul');
    expect(own).toBeDefined();
    expect(own!.place).toEqual({ ...later!.place, historicName: own!.place.historicName });
  });

  it('lists every place he newly brings in the registry of shared places', () => {
    const registry = readFileSync(join(process.cwd(), 'content', 'places-registry.md'), 'utf8');
    for (const stop of figure!.journey) expect(registry, stop.place.slug).toContain(`| ${stop.place.slug} |`);
  });

  it('can be travelled to from the conqueror of his city, and back', () => {
    expect(findRoutes(world, SLUG, CONQUEROR).length).toBeGreaterThan(0);
    expect(findRoutes(world, CONQUEROR, SLUG).length).toBeGreaterThan(0);
  });

  it('links only figures and concepts that exist', () => {
    const slugs = new Set(content.seed.figures.map((candidate) => candidate.slug));
    const texts = figure!.actions.flatMap((action) => [action.cause, action.consequence, action.depth ?? '']).join(' ');
    for (const [, target] of texts.matchAll(/\[\[f:([a-z0-9-]+)\|/g)) expect(slugs.has(target!), target).toBe(true);
    expect(texts).toContain(`[[f:${CONQUEROR}|`);
  });
});
