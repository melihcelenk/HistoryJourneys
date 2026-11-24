import type { FigureKind, Relation, RelationMode, World } from './types';

/** A figure in a relation graph, placed on a plane whose unit is the radius of the circle of related figures. */
export interface GraphFigure {
  slug: string;
  name: string;
  kind: FigureKind;
  birthYear: number;
  deathYear: number;
  x: number;
  y: number;
}

/** A related figure and what links it to the figure in the centre. */
export interface GraphNode extends GraphFigure {
  /** Names of the kinds of relation with the centre, each once, in the order of the content. */
  labels: string[];
  /** What the content says about each relation. */
  notes: string[];
  /** Direct when at least one of the relations is a direct one; influence when all of them are influences. */
  mode: RelationMode;
}

export interface RelationGraph {
  centre: GraphFigure;
  nodes: GraphNode[];
}

/** Where the first related figure is placed: straight above the centre. */
const START_ANGLE = -Math.PI / 2;

/**
 * Lays out the relations of one figure as a star: the figure in the centre and
 * every figure it has a relation with around it, once, in order of time and
 * evenly spread on a circle. Several relations with the same figure become one
 * link that names them all. Returns null for a figure that is not in the content.
 */
export function buildRelationGraph(world: World, slug: string): RelationGraph | null {
  const figures = new Map(world.figures.map((figure) => [figure.slug, figure]));
  const centre = figures.get(slug);
  if (!centre) return null;

  const links = collectLinks(world, slug, new Set(figures.keys()));

  const related = [...links.keys()].flatMap((other) => figures.get(other) ?? []).sort((a, b) => a.birthYear - b.birthYear);
  const nodes = related.map((figure, index): GraphNode => {
    const angle = START_ANGLE + (2 * Math.PI * index) / related.length;
    const link = links.get(figure.slug);
    return {
      ...placed(figure, Math.cos(angle), Math.sin(angle)),
      labels: link?.labels ?? [],
      notes: link?.notes ?? [],
      mode: link?.direct ? 'direct' : 'influence',
    };
  });
  return { centre: placed(centre, 0, 0), nodes };
}

interface Link {
  labels: string[];
  notes: string[];
  direct: boolean;
}

/** Gathers the relations of a figure by the figure at the other end; relations to figures outside the content are left out. */
function collectLinks(world: World, slug: string, known: Set<string>): Map<string, Link> {
  const types = new Map(world.relationTypes.map((type) => [type.type, type]));
  const links = new Map<string, Link>();
  for (const relation of world.relations) {
    const other = otherEnd(relation, slug);
    if (other === null || !known.has(other)) continue;
    const link = links.get(other) ?? { labels: [], notes: [], direct: false };
    const type = types.get(relation.type);
    const label = type?.nameTr ?? relation.type;
    if (!link.labels.includes(label)) link.labels.push(label);
    link.notes.push(relation.note);
    // A relation of a kind the content does not describe is not taken for an influence.
    link.direct ||= type?.mode !== 'influence';
    links.set(other, link);
  }
  return links;
}

/** The figure at the other end of a relation of the given figure; null when the relation is not its own, or loops back to it. */
export function otherEnd(relation: Relation, slug: string): string | null {
  if (relation.from === slug) return relation.to === slug ? null : relation.to;
  return relation.to === slug ? relation.from : null;
}

function placed(figure: World['figures'][number], x: number, y: number): GraphFigure {
  return { slug: figure.slug, name: figure.nameTr, kind: figure.kind, birthYear: figure.birthYear, deathYear: figure.deathYear, x, y };
}
