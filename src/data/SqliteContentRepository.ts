import type { Database, SqlValue } from 'sql.js';
import { z } from 'zod';
import { figureKindSchema, generationStatusSchema, portraitInfoSchema, precisionSchema, relationModeSchema } from '../domain/contentSchema';
import type {
  Action,
  Concept,
  FigureCard,
  FigureSummary,
  JourneyStop,
  Line,
  Relation,
  RelationType,
  Source,
  VisitedPlace,
  World,
} from '../domain/types';
import type { ContentRepository } from './ContentRepository';

type Row = Record<string, SqlValue>;

function text(row: Row, column: string): string {
  return String(row[column] ?? '');
}

function numberOf(row: Row, column: string): number {
  return Number(row[column]);
}

function optionalText(row: Row, column: string): string | undefined {
  const value = row[column];
  return value === null || value === undefined ? undefined : String(value);
}

/** Reads a column that holds one of a fixed set of values; a value outside the set names its column and row. */
function oneOf<T>(row: Row, column: string, schema: z.ZodType<T>): T {
  const parsed = schema.safeParse(row[column]);
  if (parsed.success) return parsed.data;
  throw new Error(`Unexpected value "${String(row[column])}" in column ${column} (row ${String(row.slug ?? row.type ?? row.place_slug ?? '?')})`);
}

const stringListSchema = z.array(z.string());
const relatedWordsSchema = z.array(z.object({ term: z.string(), meaning: z.string() }));

/** Reads a JSON column and checks it against the shape the application expects. */
function parseJson<T>(row: Row, column: string, schema: z.ZodType<T>): T {
  return schema.parse(JSON.parse(text(row, column)));
}

function toSummary(row: Row): FigureSummary {
  const reignFrom = row.reign_from;
  const reignTo = row.reign_to;
  return {
    slug: text(row, 'slug'),
    nameTr: text(row, 'name_tr'),
    nameEn: text(row, 'name_en'),
    kind: oneOf(row, 'kind', figureKindSchema),
    roles: parseJson(row, 'roles_json', stringListSchema),
    birthYear: numberOf(row, 'birth_year'),
    birthPlace: text(row, 'birth_place'),
    deathYear: numberOf(row, 'death_year'),
    deathPlace: text(row, 'death_place'),
    reign:
      typeof reignFrom === 'number' && typeof reignTo === 'number' ? { from: reignFrom, to: reignTo } : undefined,
    portrait: row.portrait_json === null ? undefined : parseJson(row, 'portrait_json', portraitInfoSchema),
  };
}

function toAction(row: Row): Action {
  return {
    id: text(row, 'id'),
    year: numberOf(row, 'year'),
    text: text(row, 'text'),
    cause: text(row, 'cause'),
    consequence: text(row, 'consequence'),
    depth: optionalText(row, 'depth'),
    sources: parseJson(row, 'sources_json', stringListSchema),
  };
}

function toStop(row: Row): JourneyStop {
  return {
    place: {
      slug: text(row, 'place_slug'),
      nameTr: text(row, 'name_tr'),
      historicName: optionalText(row, 'historic_name'),
      lat: numberOf(row, 'lat'),
      lon: numberOf(row, 'lon'),
    },
    precision: oneOf(row, 'precision', precisionSchema),
    from: numberOf(row, 'year_from'),
    to: numberOf(row, 'year_to'),
    event: text(row, 'event'),
  };
}

function toSource(row: Row): Source {
  return {
    id: text(row, 'id'),
    title: text(row, 'title'),
    publisher: text(row, 'publisher'),
    url: text(row, 'url'),
    license: optionalText(row, 'license'),
  };
}

/** Columns of the figure table that a figure summary is built from. */
const SUMMARY_COLUMNS =
  'slug, name_tr, name_en, kind, roles_json, birth_year, birth_place, death_year, death_place, reign_from, reign_to, portrait_json';

/**
 * Content repository backed by a SQLite database opened with sql.js. Values
 * that the application treats as one of a fixed set (kind, precision, ...) are
 * checked when they are read, so a stale or foreign database fails loudly.
 */
export class SqliteContentRepository implements ContentRepository {
  constructor(private readonly db: Database) {}

  private query(sql: string, params: SqlValue[] = []): Row[] {
    const statement = this.db.prepare(sql);
    try {
      statement.bind(params);
      const rows: Row[] = [];
      while (statement.step()) rows.push(statement.getAsObject());
      return rows;
    } finally {
      statement.free();
    }
  }

  async loadWorld(): Promise<World> {
    const figures = this.query(`SELECT ${SUMMARY_COLUMNS} FROM figure ORDER BY birth_year, slug`).map(toSummary);
    const relations: Relation[] = this.query('SELECT from_slug, to_slug, type, note FROM relation').map((row) => ({
      from: text(row, 'from_slug'),
      to: text(row, 'to_slug'),
      type: text(row, 'type'),
      note: text(row, 'note'),
    }));
    const relationTypes: RelationType[] = this.query('SELECT * FROM relation_type').map((row) => ({
      type: text(row, 'type'),
      nameTr: text(row, 'name_tr'),
      weight: numberOf(row, 'weight'),
      mode: oneOf(row, 'mode', relationModeSchema),
    }));
    const membersByLine = new Map<string, string[]>();
    for (const member of this.query('SELECT line_slug, figure_slug FROM line_member ORDER BY line_slug, position')) {
      const line = text(member, 'line_slug');
      const members = membersByLine.get(line) ?? [];
      members.push(text(member, 'figure_slug'));
      membersByLine.set(line, members);
    }
    const lines: Line[] = this.query('SELECT * FROM line ORDER BY position').map((row) => ({
      slug: text(row, 'slug'),
      nameTr: text(row, 'name_tr'),
      description: text(row, 'description'),
      members: membersByLine.get(text(row, 'slug')) ?? [],
    }));
    const places: VisitedPlace[] = this.query(
      `SELECT p.slug, p.name_tr, p.historic_name, p.lat, p.lon, COUNT(s.figure_slug) AS visits
       FROM place p LEFT JOIN journey_stop s ON s.place_slug = p.slug
       GROUP BY p.slug ORDER BY visits DESC, p.slug`,
    ).map((row) => ({
      slug: text(row, 'slug'),
      nameTr: text(row, 'name_tr'),
      historicName: optionalText(row, 'historic_name'),
      lat: numberOf(row, 'lat'),
      lon: numberOf(row, 'lon'),
      visits: numberOf(row, 'visits'),
    }));
    return { figures, places, relations, relationTypes, lines };
  }

  async getFigureCard(slug: string): Promise<FigureCard | null> {
    const row = this.query('SELECT * FROM figure WHERE slug = ?', [slug])[0];
    if (!row) return null;
    const stops = this.query(
      `SELECT s.place_slug, s.precision, s.year_from, s.year_to, s.event, p.name_tr, p.historic_name, p.lat, p.lon
       FROM journey_stop s JOIN place p ON p.slug = s.place_slug
       WHERE s.figure_slug = ? ORDER BY s.position`,
      [slug],
    );
    return {
      ...toSummary(row),
      summary: parseJson(row, 'summary_json', stringListSchema),
      actions: this.query('SELECT * FROM action WHERE figure_slug = ? ORDER BY position', [slug]).map(toAction),
      journey: stops.map(toStop),
      sources: this.query('SELECT * FROM source WHERE figure_slug = ? ORDER BY id', [slug]).map(toSource),
      generation: {
        model: text(row, 'gen_model'),
        ruleset: text(row, 'gen_ruleset'),
        date: text(row, 'gen_date'),
        status: oneOf(row, 'gen_status', generationStatusSchema),
      },
    };
  }

  close(): void {
    this.db.close();
  }

  async getConcept(slug: string): Promise<Concept | null> {
    const row = this.query('SELECT * FROM concept WHERE slug = ?', [slug])[0];
    if (!row) return null;
    const letters = optionalText(row, 'root_letters');
    return {
      slug: text(row, 'slug'),
      term: text(row, 'term'),
      meaning: text(row, 'meaning'),
      root: letters
        ? { letters, language: text(row, 'root_language'), meaning: text(row, 'root_meaning') }
        : undefined,
      related: parseJson(row, 'related_json', relatedWordsSchema),
    };
  }
}
