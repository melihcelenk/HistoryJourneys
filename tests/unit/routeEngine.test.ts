import { describe, expect, it } from 'vitest';
import { findRoutes, ROUTE_LABELS } from '../../src/domain/routeEngine';
import { sampleWorld } from './fixtures';

const figuresOf = (route: { steps: { figure: string }[] }) => route.steps.map((step) => step.figure);

describe('findRoutes', () => {
  it('offers the succession route first', () => {
    const routes = findRoutes(sampleWorld(), 'a', 'd');
    expect(figuresOf(routes[0]!)).toEqual(['a', 'b', 'c', 'd']);
    expect(routes[0]!.label).toBe(ROUTE_LABELS.succession);
  });

  it('offers at least one different alternative route', () => {
    const routes = findRoutes(sampleWorld(), 'a', 'd');
    expect(routes.length).toBeGreaterThanOrEqual(2);
    const ids = new Set(routes.map((route) => route.id));
    expect(ids.size).toBe(routes.length);
    expect(routes.some((route) => figuresOf(route).includes('v') || figuresOf(route).includes('w'))).toBe(true);
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

  it('gives routes with the same label a distinguishing name', () => {
    const routes = findRoutes(sampleWorld(), 'a', 'd');
    expect(routes.length).toBeGreaterThanOrEqual(2);
    expect(new Set(routes.map((route) => route.label)).size).toBe(routes.length);
  });
});
