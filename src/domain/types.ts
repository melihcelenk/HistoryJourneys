import type { FigureKind, GenerationStatus, PortraitInfo, Precision, RelationMode } from './contentSchema';

export type { FigureKind, Precision, RelationMode };

export interface Place {
  slug: string;
  nameTr: string;
  historicName?: string;
  lat: number;
  lon: number;
}

export interface JourneyStop {
  place: Place;
  precision: Precision;
  from: number;
  to: number;
  event: string;
}

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  license?: string;
}

export interface Action {
  id: string;
  year: number;
  text: string;
  cause: string;
  consequence: string;
  /** Fuller account behind the depth marker (FR-27). */
  depth?: string;
  sources: string[];
}

/** The light part of a figure, loaded for every figure at start-up. */
export interface FigureSummary {
  slug: string;
  nameTr: string;
  nameEn: string;
  kind: FigureKind;
  roles: string[];
  birthYear: number;
  birthPlace: string;
  deathYear: number;
  deathPlace: string;
  reign?: { from: number; to: number };
  /** The portrait of the figure, when the content has one; the picture itself is found by the slug of the figure. */
  portrait?: PortraitInfo;
}

export interface GenerationInfo {
  model: string;
  ruleset: string;
  date: string;
  status: GenerationStatus;
}

/** A figure with everything shown on its card. */
export interface FigureCard extends FigureSummary {
  summary: string[];
  actions: Action[];
  journey: JourneyStop[];
  sources: Source[];
  generation: GenerationInfo;
}

/** A typed, directed link: `from` <type> `to` (for example ahmed-i child_of mehmed-iii). */
export interface Relation {
  from: string;
  to: string;
  type: string;
  note: string;
}

export interface RelationType {
  type: string;
  nameTr: string;
  weight: number;
  mode: RelationMode;
}

export interface Concept {
  slug: string;
  term: string;
  meaning: string;
  root?: { letters: string; language: string; meaning: string };
  related: { term: string; meaning: string }[];
}

export interface Line {
  slug: string;
  nameTr: string;
  description: string;
  members: string[];
}

/** A place with the number of journey stops at it; used for the ambient city labels on the map. */
export interface VisitedPlace extends Place {
  visits: number;
}

/** Everything needed to pick figures, compute routes and dress the map. */
export interface World {
  figures: FigureSummary[];
  places: VisitedPlace[];
  relations: Relation[];
  relationTypes: RelationType[];
  lines: Line[];
}
