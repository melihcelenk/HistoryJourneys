import { activeYear } from './journey';
import type { Relation, RelationType, World } from './types';

/**
 * The two ways of travelling between two figures (FR-8):
 * - `direct`: only through people who had to do with each other (succession,
 *   family, service, teaching, conflict);
 * - `influence`: through influences, which may jump over centuries.
 */
export const ROUTE_KINDS = ['direct', 'influence'] as const;
export type RouteKind = (typeof ROUTE_KINDS)[number];

/** One card on a route and the relation that leads to the next card. */
export interface RouteStep {
  figure: string;
  /** Relation between this figure and the next one on the route; absent on the last step. */
  linkToNext?: Relation;
}

export interface Route {
  /** Stable id built from the kind and the figures on the route. */
  id: string;
  kind: RouteKind;
  steps: RouteStep[];
  /** Sum of the base weights of the relations on the route; lower means more direct. */
  cost: number;
}

/** Two figures this many years apart or closer count as contemporaries. */
const CONTEMPORARY_TOLERANCE_YEARS = 25;
/** On a route of influences an influence is this much cheaper than its base weight ... */
const INFLUENCE_DISCOUNT = 0.25;
/** ... and a direct relation this much dearer, so that it is used only to bridge a gap. */
const DIRECT_SURCHARGE = 3;

interface Edge {
  to: string;
  relation: Relation;
  type: RelationType;
}

type Graph = Map<string, Edge[]>;

/**
 * Builds the undirected relation graph. Relations with an unknown type or
 * figure cannot be part of it; content validation rejects them at build time,
 * so they are only skipped here.
 */
function buildGraph(world: World, types: Map<string, RelationType>): Graph {
  const graph: Graph = new Map(world.figures.map((figure) => [figure.slug, []]));
  for (const relation of world.relations) {
    const type = types.get(relation.type);
    const fromEdges = graph.get(relation.from);
    const toEdges = graph.get(relation.to);
    if (!type || !fromEdges || !toEdges) continue;
    fromEdges.push({ to: relation.to, relation, type });
    toEdges.push({ to: relation.from, relation, type });
  }
  return graph;
}

interface SearchContext {
  graph: Graph;
  years: Map<string, number>;
  /** +1 when the route moves forward in time, -1 when it moves backward. */
  direction: number;
  kind: RouteKind;
}

/** A step may not move against the route's direction in time by more than the tolerance (FR-12). */
function respectsChronology(context: SearchContext, from: string, to: string): boolean {
  const delta = ((context.years.get(to) ?? 0) - (context.years.get(from) ?? 0)) * context.direction;
  return delta >= -CONTEMPORARY_TOLERANCE_YEARS;
}

/** Cost of a link while searching, or null when the kind of route may not use the link at all. */
function searchCost(kind: RouteKind, type: RelationType): number | null {
  switch (kind) {
    case 'direct':
      return type.mode === 'direct' ? type.weight : null;
    case 'influence':
      return type.weight * (type.mode === 'influence' ? INFLUENCE_DISCOUNT : DIRECT_SURCHARGE);
    default: {
      // A new kind of route must get its own pricing; the compiler reports it on this line.
      const unknown: never = kind;
      throw new Error(`Unknown kind of route: ${String(unknown)}`);
    }
  }
}

/** Cost of going from a figure along an edge, or null when the route may not take that step. */
function stepCost(context: SearchContext, from: string, edge: Edge): number | null {
  return respectsChronology(context, from, edge.to) ? searchCost(context.kind, edge.type) : null;
}

interface PathResult {
  figures: string[];
  links: Relation[];
}

function closestUnvisited(distance: Map<string, number>, visited: Set<string>): string | null {
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const [node, value] of distance) {
    if (!visited.has(node) && value < bestDistance) {
      best = node;
      bestDistance = value;
    }
  }
  return best;
}

/** Dijkstra over the relation graph; the graph is small, so a linear scan for the next node is enough. */
function shortestPath(context: SearchContext, start: string, goal: string): PathResult | null {
  const distance = new Map<string, number>([[start, 0]]);
  const previous = new Map<string, { node: string; relation: Relation }>();
  const visited = new Set<string>();

  for (let current = closestUnvisited(distance, visited); current !== null; current = closestUnvisited(distance, visited)) {
    if (current === goal) break;
    visited.add(current);
    const currentDistance = distance.get(current) ?? Infinity;
    for (const edge of context.graph.get(current) ?? []) {
      const cost = visited.has(edge.to) ? null : stepCost(context, current, edge);
      if (cost === null) continue;
      if (currentDistance + cost < (distance.get(edge.to) ?? Infinity)) {
        distance.set(edge.to, currentDistance + cost);
        previous.set(edge.to, { node: current, relation: edge.relation });
      }
    }
  }

  if (!distance.has(goal)) return null;
  const figures = [goal];
  const links: Relation[] = [];
  for (let step = previous.get(goal); step !== undefined; step = previous.get(step.node)) {
    figures.unshift(step.node);
    links.unshift(step.relation);
  }
  return { figures, links };
}

function toRoute(kind: RouteKind, path: PathResult, types: Map<string, RelationType>): Route {
  return {
    id: `${kind}:${path.figures.join('>')}`,
    kind,
    steps: path.figures.map((figure, index) => ({ figure, linkToNext: path.links[index] })),
    // The search cost depends on the kind of route; the reported cost does not.
    cost: path.links.reduce((sum, link) => sum + (types.get(link.type)?.weight ?? 0), 0),
  };
}

/** A route of influences must contain an influence; without one it is just a worse direct route. */
function isWorthOffering(kind: RouteKind, path: PathResult, types: Map<string, RelationType>): boolean {
  return kind === 'direct' || path.links.some((link) => types.get(link.type)?.mode === 'influence');
}

/**
 * Computes the routes between two figures (FR-7, FR-8, FR-12): at most one of
 * each kind, the route through direct relations first. Presentation (names of
 * the kinds, card counts) is left to the interface.
 */
export function findRoutes(world: World, from: string, to: string): Route[] {
  const years = new Map(world.figures.map((figure) => [figure.slug, activeYear(figure)]));
  const startYear = years.get(from);
  const goalYear = years.get(to);
  if (startYear === undefined || goalYear === undefined || from === to) return [];

  const types = new Map(world.relationTypes.map((type) => [type.type, type]));
  const graph = buildGraph(world, types);
  const direction = goalYear >= startYear ? 1 : -1;
  return ROUTE_KINDS.flatMap((kind) => {
    const path = shortestPath({ graph, years, direction, kind }, from, to);
    return path && isWorthOffering(kind, path, types) ? [toRoute(kind, path, types)] : [];
  });
}
