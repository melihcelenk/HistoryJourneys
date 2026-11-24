import { z } from 'zod';

/** Shape of every identifier in the content and in links. */
export const SLUG_PATTERN = /^[a-z0-9-]+$/;

/** Limits that come from the requirements; the rule set (content/rules/RULESET.md) repeats them for authors. */
const SUMMARY_SENTENCES = 3; // FR-1: a three-sentence summary
const MIN_ACTIONS = 2; // rule R6
const MAX_ACTIONS = 4;
const MIN_JOURNEY_STOPS = 3; // rule R17
const MAX_JOURNEY_STOPS = 8;
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
  generation: z.object({
    model: text,
    ruleset: text,
    date: isoDate,
    status: generationStatusSchema,
  }),
});

export const relationGroupSchema = z.enum(['succession', 'family', 'service', 'ideas', 'conflict']);

export const relationTypeSchema = z.object({
  type: text,
  nameTr: text,
  weight: z.number().positive(),
  group: relationGroupSchema,
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
export type RelationGroup = z.infer<typeof relationGroupSchema>;
export type Precision = z.infer<typeof precisionSchema>;
export type FigureKind = z.infer<typeof figureKindSchema>;
export type GenerationStatus = z.infer<typeof generationStatusSchema>;
