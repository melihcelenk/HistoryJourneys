import type { Database, SqlJsStatic, SqlValue } from 'sql.js';
import { type FigureSeed, type LineSeed, portraitInfoSchema } from '../domain/contentSchema';
import type { ContentSeed } from './contentValidation';
import { DB_SCHEMA, DB_SCHEMA_VERSION } from './dbSchema';

type Row = Record<string, SqlValue | undefined>;

/**
 * Inserts one row. Table and column names come from the code in this file,
 * never from content; values are always bound as parameters. A row that breaks
 * a constraint stops the build.
 */
function insert(db: Database, table: string, row: Row, conflict: 'fail' | 'keep-first' = 'fail'): void {
  const columns = Object.keys(row);
  const placeholders = columns.map(() => '?').join(', ');
  const verb = conflict === 'keep-first' ? 'INSERT OR IGNORE' : 'INSERT';
  db.run(
    `${verb} INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
    columns.map((column) => row[column] ?? null),
  );
}

/**
 * Inserts a row that several figures may define (a place or a concept). The
 * first definition is kept; content validation guarantees that the others are
 * identical, so nothing is lost.
 */
function insertShared(db: Database, table: string, row: Row): void {
  insert(db, table, row, 'keep-first');
}

function insertActions(db: Database, figure: FigureSeed): void {
  figure.actions.forEach((action, position) =>
    insert(db, 'action', {
      figure_slug: figure.slug,
      id: action.id,
      position,
      year: action.year,
      text: action.text,
      cause: action.cause,
      consequence: action.consequence,
      depth: action.depth,
      sources_json: JSON.stringify(action.sources),
    }),
  );
}

function insertJourney(db: Database, figure: FigureSeed): void {
  figure.journey.forEach((stop, position) => {
    insertShared(db, 'place', {
      slug: stop.place.slug,
      name_tr: stop.place.nameTr,
      historic_name: stop.place.historicName,
      lat: stop.place.lat,
      lon: stop.place.lon,
    });
    insert(db, 'journey_stop', {
      figure_slug: figure.slug,
      position,
      place_slug: stop.place.slug,
      precision: stop.precision,
      year_from: stop.from,
      year_to: stop.to,
      event: stop.event,
    });
  });
}

function insertSources(db: Database, figure: FigureSeed): void {
  figure.sources.forEach((source) =>
    insert(db, 'source', {
      figure_slug: figure.slug,
      id: source.id,
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      license: source.license,
    }),
  );
}

function insertConcepts(db: Database, figure: FigureSeed): void {
  figure.concepts.forEach((concept) =>
    insertShared(db, 'concept', {
      slug: concept.slug,
      term: concept.term,
      meaning: concept.meaning,
      root_letters: concept.root?.letters,
      root_language: concept.root?.language,
      root_meaning: concept.root?.meaning,
      related_json: JSON.stringify(concept.related),
    }),
  );
}

function insertFigure(db: Database, figure: FigureSeed): void {
  insert(db, 'figure', {
    slug: figure.slug,
    name_tr: figure.nameTr,
    name_en: figure.nameEn,
    wiki_title_tr: figure.wikiTitleTr,
    kind: figure.kind,
    roles_json: JSON.stringify(figure.roles),
    birth_year: figure.birth.year,
    birth_place: figure.birth.place,
    death_year: figure.death.year,
    death_place: figure.death.place,
    reign_from: figure.reign?.from,
    reign_to: figure.reign?.to,
    summary_json: JSON.stringify(figure.summary),
    // Only what the reader is shown goes to the database: parsing with the narrower schema drops the file name and the crop.
    portrait_json: figure.portrait ? JSON.stringify(portraitInfoSchema.parse(figure.portrait)) : undefined,
    gen_model: figure.generation.model,
    gen_ruleset: figure.generation.ruleset,
    gen_date: figure.generation.date,
    gen_status: figure.generation.status,
  });
  insertActions(db, figure);
  insertJourney(db, figure);
  insertSources(db, figure);
  insertConcepts(db, figure);
}

function insertRelations(db: Database, figures: FigureSeed[]): void {
  for (const figure of figures) {
    for (const relation of figure.relations) {
      insert(db, 'relation', { from_slug: figure.slug, to_slug: relation.to, type: relation.type, note: relation.note });
    }
  }
}

/** Lines with a link type connect consecutive members: the later member is the "from" side. */
function insertLine(db: Database, line: LineSeed, position: number, names: Map<string, string>): void {
  insert(db, 'line', { slug: line.slug, position, name_tr: line.nameTr, description: line.description });
  line.members.forEach((member, index) => {
    insert(db, 'line_member', { line_slug: line.slug, position: index, figure_slug: member });
    const previous = line.members[index - 1];
    if (line.linkType && previous) {
      insert(db, 'relation', {
        from_slug: member,
        to_slug: previous,
        type: line.linkType,
        note: `${line.nameTr}: ${names.get(previous) ?? previous} → ${names.get(member) ?? member}`,
      });
    }
  });
}

function fill(db: Database, seed: ContentSeed, builtAt: string): void {
  insert(db, 'meta', { key: 'schema_version', value: DB_SCHEMA_VERSION });
  insert(db, 'meta', { key: 'built_at', value: builtAt });
  seed.relationTypes.forEach((type) =>
    insert(db, 'relation_type', { type: type.type, name_tr: type.nameTr, weight: type.weight, mode: type.mode }),
  );
  seed.figures.forEach((figure) => insertFigure(db, figure));
  insertRelations(db, seed.figures);
  const names = new Map(seed.figures.map((figure) => [figure.slug, figure.nameTr]));
  seed.lines.forEach((line, position) => insertLine(db, line, position, names));
}

/**
 * Builds the content database from seed data. Content validation is expected
 * to have run first; the database still enforces its own keys and references,
 * and a row that breaks them fails the build instead of being dropped. On
 * failure nothing is kept: the transaction is rolled back and the database is
 * closed before the error is passed on.
 */
export function buildDatabase(SQL: SqlJsStatic, seed: ContentSeed, builtAt: string): Database {
  const db = new SQL.Database();
  try {
    db.run(DB_SCHEMA);
    // References are checked when the transaction commits, so rows may be inserted in any order.
    db.run('PRAGMA foreign_keys = ON');
    db.run('BEGIN');
    db.run('PRAGMA defer_foreign_keys = ON');
    fill(db, seed, builtAt);
    db.run('COMMIT');
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}
