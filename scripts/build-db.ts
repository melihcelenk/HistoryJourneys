/**
 * Builds public/data/hj.sqlite from the content files (DR-1).
 * Fails when a file breaks the schema or the content is inconsistent.
 *
 * Usage: tsx scripts/build-db.ts [--allow-missing]
 *   --allow-missing  drop line members and relations that point to figures not
 *                    written yet, instead of failing (used while content is
 *                    still being generated).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { buildDatabase } from '../src/data/buildDatabase';
import { type ContentSeed, UNKNOWN_FIGURE_LINK, validateContent } from '../src/data/contentValidation';
import { loadContent } from './loadContent';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = join(root, 'public', 'data', 'hj.sqlite');
const allowMissing = process.argv.includes('--allow-missing');

/** A line needs at least this many members to be a line. */
const MIN_LINE_MEMBERS = 2;

/** Removes references to figures that have no content file yet, and says what it removed. */
function dropMissingReferences(seed: ContentSeed): ContentSeed {
  const known = new Set(seed.figures.map((figure) => figure.slug));
  const dropped: string[] = [];
  const figures = seed.figures.map((figure) => ({
    ...figure,
    relations: figure.relations.filter((relation) => {
      if (known.has(relation.to)) return true;
      dropped.push(`relation ${figure.slug} ${relation.type} ${relation.to}`);
      return false;
    }),
  }));
  const lines = seed.lines
    .map((line) => ({
      ...line,
      members: line.members.filter((member) => {
        if (known.has(member)) return true;
        dropped.push(`member ${member} of line ${line.slug}`);
        return false;
      }),
    }))
    .filter((line) => {
      if (line.members.length >= MIN_LINE_MEMBERS) return true;
      dropped.push(`line ${line.slug} (too few members left)`);
      return false;
    });
  if (dropped.length > 0) console.warn(`--allow-missing left out:\n${dropped.map((item) => `  - ${item}`).join('\n')}`);
  return { ...seed, figures, lines };
}

function fail(title: string, errors: string[]): never {
  console.error(`${title}\n${errors.map((error) => `  - ${error}`).join('\n')}`);
  process.exit(1);
}

const loaded = loadContent(join(root, 'content'));
if (loaded.errors.length > 0) fail('Content files break the schema:', loaded.errors);

const seed = allowMissing ? dropMissingReferences(loaded.seed) : loaded.seed;
const problems = validateContent(seed).filter(
  (problem) => !(allowMissing && problem.includes(UNKNOWN_FIGURE_LINK)),
);
if (problems.length > 0) fail('Content is inconsistent:', problems);

const SQL = await initSqlJs();
const db = buildDatabase(SQL, seed, new Date().toISOString());
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, db.export());

const count = (table: string): number => Number(db.exec(`SELECT COUNT(*) FROM ${table}`)[0]?.values[0]?.[0] ?? 0);
console.log(
  `hj.sqlite: ${count('figure')} figures, ${count('relation')} relations, ${count('place')} places, ` +
    `${count('action')} actions, ${count('concept')} concepts`,
);
