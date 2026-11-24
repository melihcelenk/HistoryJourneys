import type { Concept, FigureCard, World } from '../domain/types';

/**
 * Read access to the content. The application depends only on this interface,
 * so the SQLite store can later be replaced (for example by an HTTP API)
 * without touching the rest of the code.
 */
export interface ContentRepository {
  /** Figures, relations, relation types and lines: what pickers and the route engine need. */
  loadWorld(): Promise<World>;
  /** Full card of one figure, or null when the slug is unknown. */
  getFigureCard(slug: string): Promise<FigureCard | null>;
  /** One concept with its origin and related words, or null when the slug is unknown. */
  getConcept(slug: string): Promise<Concept | null>;
  /** Releases what the repository holds; it must not be used afterwards. */
  close(): void;
}
