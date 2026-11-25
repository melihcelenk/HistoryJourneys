import { z } from 'zod';

/**
 * A briefing: what a figure tells at the map table, step by step. It is content, kept in `content/scenes/`; a
 * figure gets a briefing by getting such a file and a map to point at.
 */
const stepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** What the figure says, in his own voice. */
  text: z.string().min(1),
  /** Ids of the places and routes of the map that are shown while this step is told. */
  marks: z.array(z.string().min(1)),
});

const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.url(),
  license: z.string().optional(),
});

const briefingSchema = z.object({
  /** Slug of the figure who tells it. */
  figure: z.string().min(1),
  title: z.string().min(1),
  /** The words on the button that starts the briefing. */
  invitation: z.string().min(1),
  /** One sentence on when and where the figure is speaking. */
  setting: z.string().min(1),
  steps: z.array(stepSchema).min(2),
  sources: z.array(sourceSchema).min(1),
});

export type Briefing = z.infer<typeof briefingSchema>;
export type BriefingStep = z.infer<typeof stepSchema>;

/** Reads a briefing from its content file; throws, naming the fault, when the file is not a valid briefing. */
export function parseBriefing(raw: unknown): Briefing {
  return briefingSchema.parse(raw);
}
