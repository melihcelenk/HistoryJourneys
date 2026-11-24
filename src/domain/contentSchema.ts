import { z } from 'zod';

/** Shape of every identifier in the content and in links. */
export const SLUG_PATTERN = /^[a-z0-9-]+$/;

/** Limits that come from the requirements; the rule set (content/rules/RULESET.md) repeats them for authors. */
const SUMMARY_SENTENCES = 3; // FR-1: a three-sentence summary
const MIN_ACTIONS = 2; // rule R6
const MAX_ACTIONS = 4;
const MIN_JOURNEY_STOPS = 3; // rule R17
const MAX_JOURNEY_STOPS = 30; // a figure with a detailed journey package (AJ-1) has many more stops than most
const MIN_SOURCES = 2; // rule R14, CG-8: at least two independent sources
const MIN_LINE_MEMBERS = 2;

const slug = z.string().regex(SLUG_PATTERN);
const text = z.string().min(1);
/** Sources are shown as links, so only web addresses are accepted. */
const webUrl = z.url({ protocol: /^https?$/ });
const isoDate = z.iso.date();

/** Location precision shown to the reader (FR-17). */
export const precisionSchema = z.enum(['building', 'district', 'city', 'region']);

export const placeSchema = z.object({
  slug,
  nameTr: text,
  historicName: text.optional(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const sourceSchema = z.object({
  id: text,
  title: text,
  publisher: text,
  url: webUrl,
  license: text.optional(),
});

export const actionSchema = z.object({
  id: slug,
  year: z.number().int(),
  text,
  cause: text,
  consequence: text,
  depth: text.optional(),
  sources: z.array(z.string()).min(1),
});

export const journeyStopSchema = z.object({
  place: placeSchema,
  precision: precisionSchema,
  from: z.number().int(),
  to: z.number().int(),
  event: text,
});

export const relationSchema = z.object({
  to: slug,
  type: text,
  note: text,
});

export const conceptSchema = z.object({
  slug,
  term: text,
  meaning: text,
  root: z.object({ letters: text, language: text, meaning: text }).optional(),
  related: z.array(z.object({ term: text, meaning: text })).default([]),
});

export const figureKindSchema = z.enum([
  'sultan',
  'leader',
  'statesman',
  'soldier',
  'scholar',
  'artist',
  'royal',
]);

export const generationStatusSchema = z.enum(['generated', 'reviewed']);

/**
 * Licences a portrait may have. Only pictures that anyone may use, change and
 * distribute without conditions are accepted, so that no picture brings an
 * obligation of its own (docs/tasks/HJ-1/PORTRAITS_ANALYSIS.md).
 */
export const PORTRAIT_LICENSES = ['Public domain', 'CC0'] as const;
/** Portraits come from Wikimedia Commons; the record points at the page of the file, where its licence is stated. */
const COMMONS_FILE_PREFIX = 'https://commons.wikimedia.org/wiki/File:';
const unitInterval = z.number().min(0).max(1);

/** What is recorded of a portrait: where it comes from, who made it and when, and under which licence it is used. */
export const portraitInfoSchema = z.object({
  sourceUrl: z.string().refine((url) => url.startsWith(COMMONS_FILE_PREFIX) && url.length > COMMONS_FILE_PREFIX.length, 'is not a file page of Wikimedia Commons'),
  /** What the work is, as shown to the reader. */
  title: text,
  /** Who made it; "Bilinmiyor" when the maker is not known. */
  author: text,
  /** When it was made, as shown to the reader, for example "1579" or "19. yüzyıl ortası". */
  created: text,
  license: z.enum(PORTRAIT_LICENSES),
  /** True unless the work is known to have been made in the lifetime of the figure; such a portrait is shown as a likeness, not as a record. */
  representative: z.boolean(),
});

/** Name of a Commons file as its page address writes it, brought back to the form the file name has: spaces, not underscores or escapes. */
function commonsFileName(value: string): string {
  try {
    return decodeURIComponent(value).replaceAll('_', ' ');
  } catch {
    // Not a valid escape sequence: compared as it is, and so found different.
    return value.replaceAll('_', ' ');
  }
}

export const portraitSchema = portraitInfoSchema
  .extend({
    /** Name of the file on Wikimedia Commons. */
    file: text,
    /** The square cut out for the medallion: its centre and its side, as fractions of the width and the height of the picture. */
    crop: z.object({ x: unitInterval, y: unitInterval, size: z.number().gt(0).max(1) }),
  })
  // The picture that is fetched and the page that is credited must be one and the same file.
  .refine((portrait) => commonsFileName(portrait.sourceUrl.slice(COMMONS_FILE_PREFIX.length)) === commonsFileName(portrait.file), {
    path: ['sourceUrl'],
    message: 'is not the Commons page of the file',
  });

export const figureSchema = z.object({
  slug,
  nameTr: text,
  nameEn: text,
  wikiTitleTr: text,
  kind: figureKindSchema,
  roles: z.array(text).min(1),
  birth: z.object({ year: z.number().int(), place: text }),
  death: z.object({ year: z.number().int(), place: text }),
  reign: z.object({ from: z.number().int(), to: z.number().int() }).optional(),
  summary: z.array(text).length(SUMMARY_SENTENCES),
  actions: z.array(actionSchema).min(MIN_ACTIONS).max(MAX_ACTIONS),
  journey: z.array(journeyStopSchema).min(MIN_JOURNEY_STOPS).max(MAX_JOURNEY_STOPS),
  relations: z.array(relationSchema).default([]),
  concepts: z.array(conceptSchema).default([]),
  sources: z.array(sourceSchema).min(MIN_SOURCES),
  portrait: portraitSchema.optional(),
  generation: z.object({
    model: text,
    ruleset: text,
    date: isoDate,
    status: generationStatusSchema,
  }),
});

/**
 * How a relation lets a route travel: `direct` links people who had to do with each other,
 * `influence` links a figure to one it shaped, possibly centuries later (FR-8).
 */
export const relationModeSchema = z.enum(['direct', 'influence']);

export const relationTypeSchema = z.object({
  type: text,
  nameTr: text,
  weight: z.number().positive(),
  mode: relationModeSchema,
});

export const lineSchema = z.object({
  slug,
  nameTr: text,
  description: text,
  /** When set, consecutive members get a relation of this type (later member -> earlier member). */
  linkType: text.optional(),
  members: z.array(slug).min(MIN_LINE_MEMBERS),
});

export type FigureSeed = z.infer<typeof figureSchema>;
export type ConceptSeed = z.infer<typeof conceptSchema>;
export type RelationTypeSeed = z.infer<typeof relationTypeSchema>;
export type LineSeed = z.infer<typeof lineSchema>;
export type RelationMode = z.infer<typeof relationModeSchema>;
export type Precision = z.infer<typeof precisionSchema>;
export type FigureKind = z.infer<typeof figureKindSchema>;
export type GenerationStatus = z.infer<typeof generationStatusSchema>;
export type PortraitInfo = z.infer<typeof portraitInfoSchema>;
