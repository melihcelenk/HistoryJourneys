/**
 * Development helper: prints the routes between two figures as the application computes them.
 *
 * Usage: tsx scripts/dev/show-routes.ts <from> <to>
 * Reads public/data/hj.sqlite, so run `npm run db:build` first.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { SqliteContentRepository } from '../../src/data/SqliteContentRepository';
import { findRoutes } from '../../src/domain/routeEngine';

const [from, to] = process.argv.slice(2);
if (!from || !to) {
  console.error('Usage: tsx scripts/dev/show-routes.ts <from> <to>');
  process.exit(1);
}

const databasePath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'data', 'hj.sqlite');
if (!existsSync(databasePath)) {
  console.error(`${databasePath} does not exist; run "npm run db:build" first.`);
  process.exit(1);
}
const SQL = await initSqlJs();
const repository = new SqliteContentRepository(new SQL.Database(readFileSync(databasePath)));
const world = await repository.loadWorld();
repository.close();

const unknown = [from, to].filter((slug) => !world.figures.some((figure) => figure.slug === slug));
if (unknown.length > 0) {
  console.error(`Unknown figure: ${unknown.join(', ')}`);
  process.exit(1);
}

const routes = findRoutes(world, from, to);
if (routes.length === 0) console.log(`No route between ${from} and ${to}.`);
for (const route of routes) {
  console.log(`\n${route.kind} (${route.steps.length} cards, cost ${route.cost.toFixed(1)})`);
  for (const step of route.steps) {
    console.log(`  ${step.figure}${step.linkToNext ? `  --${step.linkToNext.type}-->` : ''}`);
  }
}
