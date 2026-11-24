import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { figureSchema, lineSchema, relationTypeSchema } from '../src/domain/contentSchema';
import type { ContentSeed } from '../src/data/contentValidation';

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export interface LoadedContent {
  seed: ContentSeed;
  /** Schema errors, prefixed with the file they come from. */
  errors: string[];
}

/** Reads and schema-validates every content file under the given directory. */
export function loadContent(contentDir: string): LoadedContent {
  const errors: string[] = [];
  /** Reads and checks one content file; its problems are collected under the name of the file. */
  const parseFile = <T>(path: string, label: string, schema: z.ZodType<T>): T | undefined => {
    try {
      const parsed = schema.safeParse(readJson(path));
      if (parsed.success) return parsed.data;
      errors.push(...parsed.error.issues.map((issue) => `${label}: ${issue.path.join('.')} ${issue.message}`));
    } catch (error) {
      errors.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    }
    return undefined;
  };
  const figuresDir = join(contentDir, 'figures');
  let figureFiles: string[] = [];
  try {
    figureFiles = readdirSync(figuresDir)
      .filter((file) => file.endsWith('.json'))
      .sort();
  } catch (error) {
    errors.push(`figures: ${error instanceof Error ? error.message : String(error)}`);
  }
  const figures = figureFiles.flatMap((file) => parseFile(join(figuresDir, file), file, figureSchema) ?? []);
  const relationTypes = parseFile(join(contentDir, 'relation-types.json'), 'relation-types.json', z.array(relationTypeSchema)) ?? [];
  const lines = parseFile(join(contentDir, 'lines.json'), 'lines.json', z.array(lineSchema)) ?? [];
  return { seed: { figures, relationTypes, lines }, errors };
}
