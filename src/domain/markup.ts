/**
 * Link markup used in generated text (rule R12):
 * `[[f:slug|shown text]]` links a figure, `[[c:slug|shown text]]` links a concept.
 */

import { SLUG_PATTERN } from './contentSchema';

export type LinkTarget = 'figure' | 'concept';

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; target: LinkTarget; slug: string; text: string };

const TARGET_BY_PREFIX: Record<string, LinkTarget> = { f: 'figure', c: 'concept' };

/** One link: a known prefix, a slug and the shown text. Built from the prefix table and the slug rule. */
const LINK_SOURCE = `\\[\\[([${Object.keys(TARGET_BY_PREFIX).join('')}]):(${SLUG_PATTERN.source.replace(/^\^|\$$/g, '')})\\|([^\\]]+)\\]\\]`;
const LINK_PATTERN = new RegExp(LINK_SOURCE, 'g');
const VALID_LINK = new RegExp(`^${LINK_SOURCE}$`);
/** Anything written in double square brackets, whether it is a valid link or not. */
const BRACKET_PATTERN = /\[\[[^\]]*\]\]/g;

/** Splits marked-up text into plain text and link segments, in order. */
export function parseMarkup(input: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of input.matchAll(LINK_PATTERN)) {
    const [whole, prefix, slug, text] = match;
    const target = TARGET_BY_PREFIX[prefix ?? ''];
    if (target === undefined || slug === undefined || text === undefined) continue;
    if (match.index > cursor) {
      segments.push({ kind: 'text', text: input.slice(cursor, match.index) });
    }
    segments.push({ kind: 'link', target, slug, text });
    cursor = match.index + whole.length;
  }
  if (cursor < input.length) {
    segments.push({ kind: 'text', text: input.slice(cursor) });
  }
  return segments;
}

/** Returns the text as the reader sees it, without link markup. */
export function stripMarkup(input: string): string {
  return parseMarkup(input)
    .map((segment) => segment.text)
    .join('');
}

/** Lists every link in the text; used to validate that link targets exist. */
export function extractLinks(input: string): { target: LinkTarget; slug: string }[] {
  return parseMarkup(input).flatMap((segment) =>
    segment.kind === 'link' ? [{ target: segment.target, slug: segment.slug }] : [],
  );
}

/**
 * Lists bracketed pieces that look like links but break the rules (unknown
 * prefix, upper-case slug, missing text). The reader would see them as raw
 * brackets, so content validation rejects them.
 */
export function findMalformedLinks(input: string): string[] {
  return (input.match(BRACKET_PATTERN) ?? []).filter((piece) => !VALID_LINK.test(piece));
}
