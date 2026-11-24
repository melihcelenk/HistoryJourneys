import { describe, expect, it } from 'vitest';
import { findRoutes } from '../../src/domain/routeEngine';
import { sampleWorld } from './fixtures';

const figuresOf = (route: { steps: { figure: string }[] }) => route.steps.map((step) => step.figure);
const linkTypesOf = (route: { steps: { linkToNext?: { type: string } }[] }) =>
  route.steps.flatMap((step) => (step.linkToNext ? [step.linkToNext.type] : []));

describe('findRoutes', () => {
  it('offers a route through direct relations first', () => {
    const [direct] = findRoutes(sampleWorld(), 'a', 'd');
    expect(direct!.kind).toBe('direct');
    expect(figuresOf(direct!)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('never uses an influence in the route through direct relations', () => {
    const direct = findRoutes(sampleWorld(), 'a', 'd').find((route) => route.kind === 'direct');
    expect(linkTypesOf(direct!)).not.toContain('influenced');
  });

  it('offers a second route through influences, which may jump over generations', () => {
    const influence = findRoutes(sampleWorld(), 'a', 'd').find((route) => route.kind === 'influence');
    expect(figuresOf(influence!)).toEqual(['a', 'd']);
    expect(linkTypesOf(influence!)).toEqual(['influenced']);
  });

  it('offers at most the two kinds of route', () => {
    const routes = findRoutes(sampleWorld(), 'a', 'd');
    expect(routes.map((route) => route.kind)).toEqual(['direct', 'influence']);
  });

  it('does not offer a route of influences that contains no influence', () => {
    const routes = findRoutes(sampleWorld(), 'a', 'c');
    expect(routes.map((route) => route.kind)).toEqual(['direct']);
  });

  it('lets influences bridge figures that no direct relation connects', () => {
    const world = sampleWorld();
    world.relations.push({ from: 'd', to: 'lonely', type: 'influenced', note: 'd, lonely üzerinde etkili oldu' });
    const routes = findRoutes(world, 'a', 'lonely');
    expect(routes.map((route) => route.kind)).toEqual(['influence']);
    expect(figuresOf(routes[0]!).at(-1)).toBe('lonely');
  });

  it('names the relation between consecutive cards', () => {
    const [route] = findRoutes(sampleWorld(), 'a', 'd');
    const steps = route!.steps;
    expect(steps.slice(0, -1).every((step) => step.linkToNext !== undefined)).toBe(true);
    expect(steps.at(-1)!.linkToNext).toBeUndefined();
    expect(steps[0]!.linkToNext!.type).toBe('succeeded');
  });

  it('works backward in time as well', () => {
    const [route] = findRoutes(sampleWorld(), 'd', 'a');
    expect(figuresOf(route!)).toEqual(['d', 'c', 'b', 'a']);
  });

  it('never moves against the direction of time by more than a generation', () => {
    const world = sampleWorld();
    // A shortcut that jumps far back in time and forward again must not be used.
    world.figures.push({ ...world.figures[0]!, slug: 'ancient', birthYear: 1200, deathYear: 1260, reign: { from: 1230, to: 1260 } });
    world.relations.push({ from: 'a', to: 'ancient', type: 'child_of', note: '' }, { from: 'd', to: 'ancient', type: 'child_of', note: '' });
    const routes = findRoutes(world, 'a', 'd');
    expect(routes.length).toBeGreaterThan(0);
    for (const route of routes) {
      expect(figuresOf(route)).not.toContain('ancient');
    }
  });

  it('returns no route when the figures are not connected', () => {
    expect(findRoutes(sampleWorld(), 'a', 'lonely')).toEqual([]);
  });

  it('returns no route for the same or an unknown figure', () => {
    expect(findRoutes(sampleWorld(), 'a', 'a')).toEqual([]);
    expect(findRoutes(sampleWorld(), 'a', 'nobody')).toEqual([]);
    expect(findRoutes(sampleWorld(), 'nobody', 'a')).toEqual([]);
  });

  it('reports the plain sum of the relation weights as the cost of every route', () => {
    const world = sampleWorld();
    const weights = new Map(world.relationTypes.map((type) => [type.type, type.weight]));
    const routes = findRoutes(world, 'a', 'd');
    expect(routes).toHaveLength(2);
    for (const route of routes) {
      const expected = linkTypesOf(route).reduce((sum, type) => sum + weights.get(type)!, 0);
      expect(route.cost).toBeCloseTo(expected, 6);
    }
  });
});
