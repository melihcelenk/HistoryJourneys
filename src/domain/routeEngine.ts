import { activeYear } from './journey';
import type { Relation, RelationGroup, RelationType, World } from './types';

/** One card on a route and the relation that leads to the next card. */
export interface RouteStep {
  figure: string;
  /** Relation between this figure and the next one on the route; absent on the last step. */
  linkToNext?: Relation;
}

export interface Route {
  /** Stable id built from the figures on the route. */
  id: string;
  label: string;
  description: string;
  steps: RouteStep[];
  /** Sum of the base weights of the relations on the route; lower means more direct. */
  cost: number;
}

/** A way of weighting relation groups, producing one flavor of route. */
interface RouteProfile {
  key: string;
  multipliers: Record<RelationGroup, number>;
}

const PROFILES: RouteProfile[] = [
  // The primary line: follow the succession and take another kind of link only where there is no other way.
  { key: 'succession', multipliers: { succession: 1, family: 8, service: 3, ideas: 4, conflict: 4 } },
  { key: 'people', multipliers: { succession: 3.2, family: 1.4, service: 0.8, ideas: 0.8, conflict: 1.2 } },
  { key: 'family', multipliers: { succession: 2.2, family: 0.6, service: 2.5, ideas: 2.5, conflict: 2 } },
];

/** How a route is described to the reader, by the kind of relation that dominates it. */
export const ROUTE_LABELS: Record<RelationGroup, string> = {
  succession: 'Taht sırası üzerinden',
  family: 'Hanedan ailesi üzerinden',
  service: 'Devlet adamları üzerinden',
  ideas: 'Hocalar ve fikirler üzerinden',
  conflict: 'Çatışmalar üzerinden',
};

/** Two figures this many years apart or closer count as contemporaries. */
const CONTEMPORARY_TOLERANCE_YEARS = 25;
/** Cost multiplier applied to already used links when looking for a different route. */
const REUSE_PENALTY = 4;
/** Searches per profile: the best route, then one alternative that avoids its links. */
const ATTEMPTS_PER_PROFILE = 2;
const MAX_ROUTES = 4;

interface Edge {
  to: string;
  relation: Relation;
  type: RelationType;
}

type Graph = Map<string, Edge[]>;

/** Lookups built once per search and shared by every step of it. */
interface Lookups {
  names: Map<string, string>;
  types: Map<string, RelationType>;
  years: Map<string, number>;
}

function buildLookups(world: World): Lookups {
  return {
    names: new Map(world.figures.map((figure) => [figure.slug, figure.nameTr])),
    types: new Map(world.relationTypes.map((type) => [type.type, type])),
    years: new Map(world.figures.map((figure) => [figure.slug, activeYear(figure)])),
  };
}

/**
 * Builds the undirected relation graph. Relations with an unknown type or
 * figure cannot be part of it; content validation rejects them at build time,
 * so they are only skipped here.
 */
function buildGraph(world: World, lookups: Lookups): Graph {
  const graph: Graph = new Map(world.figures.map((figure) => [figure.slug, []]));
  for (const relation of world.relations) {
    const type = lookups.types.get(relation.type);
    const fromEdges = graph.get(relation.from);
    const toEdges = graph.get(relation.to);
    if (!type || !fromEdges || !toEdges) continue;
    fromEdges.push({ to: relation.to, relation, type });
    toEdges.push({ to: relation.from, relation, type });
  }
  return graph;
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

interface SearchContext {
  graph: Graph;
  years: Map<string, number>;
  /** +1 when the route moves forward in time, -1 when it moves backward. */
  direction: number;
  profile: RouteProfile;
  penalized: Set<string>;
}

/** A step may not move against the route's direction in time by more than the tolerance (FR-12). */
function respectsChronology(context: SearchContext, from: string, to: string): boolean {
  const delta = ((context.years.get(to) ?? 0) - (context.years.get(from) ?? 0)) * context.direction;
  return delta >= -CONTEMPORARY_TOLERANCE_YEARS;
}

/** Cost used while searching: the profile shapes it and reused links are penalized. */
function searchCost(context: SearchContext, from: string, edge: Edge): number {
  const base = edge.type.weight * context.profile.multipliers[edge.type.group];
  return context.penalized.has(edgeKey(from, edge.to)) ? base * REUSE_PENALTY : base;
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
      if (visited.has(edge.to) || !respectsChronology(context, current, edge.to)) continue;
      const candidate = currentDistance + searchCost(context, current, edge);
      if (candidate < (distance.get(edge.to) ?? Infinity)) {
        distance.set(edge.to, candidate);
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

function dominantGroup(links: Relation[], types: Map<string, RelationType>): RelationGroup {
  const counts = new Map<RelationGroup, number>();
  for (const link of links) {
    const group = types.get(link.type)?.group;
    if (group) counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  let best: RelationGroup = 'succession';
  let bestCount = -1;
  for (const [group, count] of counts) {
    if (count > bestCount) {
      best = group;
      bestCount = count;
    }
  }
  return best;
}

function toRoute(path: PathResult, lookups: Lookups): Route {
  const steps: RouteStep[] = path.figures.map((figure, index) => ({ figure, linkToNext: path.links[index] }));
  const first = lookups.names.get(path.figures[0] ?? '') ?? '';
  const last = lookups.names.get(path.figures.at(-1) ?? '') ?? '';
  return {
    id: path.figures.join('>'),
    label: ROUTE_LABELS[dominantGroup(path.links, lookups.types)],
    description: `${first} → ${last} · ${path.figures.length} kart`,
    steps,
    // The search cost depends on the profile and on penalties; the reported cost does not.
    cost: path.links.reduce((sum, link) => sum + (lookups.types.get(link.type)?.weight ?? 0), 0),
  };
}

/** Names the figures that make a route different from the others, so equal labels can be told apart. */
function distinguishLabels(routes: Route[], names: Map<string, string>): Route[] {
  return routes.map((route) => {
    const sameLabel = routes.filter((other) => other.label === route.label);
    if (sameLabel.length < 2) return route;
    const others = new Set(sameLabel.filter((other) => other !== route).flatMap((other) => other.steps.map((step) => step.figure)));
    const unique = route.steps.map((step) => step.figure).find((figure) => !others.has(figure));
    // A route whose figures all appear on the other routes is told apart by its length.
    const distinction = unique ? (names.get(unique) ?? unique) : `${route.steps.length} kart`;
    return { ...route, label: `${route.label} · ${distinction}` };
  });
}

/**
 * Computes up to four different, meaningful routes between two figures (FR-7,
 * FR-8, FR-12). Each profile prefers a different kind of relation; a second
 * pass per profile penalizes the links already used to find an alternative.
 * Routes are ordered so that the route along the primary line comes first.
 */
export function findRoutes(world: World, from: string, to: string): Route[] {
  const lookups = buildLookups(world);
  const startYear = lookups.years.get(from);
  const goalYear = lookups.years.get(to);
  if (startYear === undefined || goalYear === undefined || from === to) return [];

  const graph = buildGraph(world, lookups);
  const direction = goalYear >= startYear ? 1 : -1;
  const found = new Map<string, Route>();
  const penalizedByProfile = new Map(PROFILES.map((profile) => [profile, new Set<string>()]));
  // The best route of every profile comes first, the alternatives after them, so that no profile is
  // crowded out when the list is cut to its maximum length.
  for (let attempt = 0; attempt < ATTEMPTS_PER_PROFILE; attempt += 1) {
    for (const [profile, penalized] of penalizedByProfile) {
      const path = shortestPath({ graph, years: lookups.years, direction, profile, penalized }, from, to);
      if (!path) continue;
      const route = toRoute(path, lookups);
      if (!found.has(route.id)) found.set(route.id, route);
      path.figures.slice(1).forEach((figure, index) => penalized.add(edgeKey(path.figures[index] ?? '', figure)));
    }
  }
  return distinguishLabels([...found.values()].slice(0, MAX_ROUTES), lookups.names);
}
