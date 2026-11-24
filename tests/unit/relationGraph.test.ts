import { describe, expect, it } from 'vitest';
import { buildRelationGraph } from '../../src/domain/relationGraph';
import { sampleWorld } from './fixtures';

describe('the relations of a figure as a graph', () => {
  it('puts the figure in the centre and every related figure around it once', () => {
    const graph = buildRelationGraph(sampleWorld(), 'a');
    expect(graph?.centre).toMatchObject({ slug: 'a', name: 'A', x: 0, y: 0 });
    expect(graph?.nodes.map((node) => node.slug).sort()).toEqual(['b', 'd', 'v']);
  });

  it('spreads the related figures evenly on a circle of radius one, the first one at the top', () => {
    const graph = buildRelationGraph(sampleWorld(), 'a');
    for (const node of graph!.nodes) expect(Math.hypot(node.x, node.y)).toBeCloseTo(1);
    expect(graph!.nodes[0]).toMatchObject({ x: expect.closeTo(0), y: expect.closeTo(-1) });
    const positions = new Set(graph!.nodes.map((node) => `${node.x.toFixed(3)},${node.y.toFixed(3)}`));
    expect(positions.size).toBe(3);
  });

  it('names the kinds of relation and tells direct relations from influences', () => {
    const graph = buildRelationGraph(sampleWorld(), 'a');
    const d = graph!.nodes.find((node) => node.slug === 'd');
    expect(d).toMatchObject({ labels: ['Etki'], mode: 'influence' });
    const b = graph!.nodes.find((node) => node.slug === 'b');
    expect(b).toMatchObject({ labels: ['Taht sırası'], mode: 'direct', notes: ['a → b'] });
  });

  it('joins several relations with the same figure into one link', () => {
    const world = sampleWorld();
    world.relations.push({ from: 'a', to: 'b', type: 'child_of', note: 'a, b çocuğu' }, { from: 'b', to: 'a', type: 'influenced', note: 'b etkiledi' });
    const b = buildRelationGraph(world, 'a')!.nodes.find((node) => node.slug === 'b');
    expect(b?.labels).toEqual(['Taht sırası', 'Ebeveyn ve çocuk', 'Etki']);
    // A link that has a direct relation is a direct link, whatever else it carries.
    expect(b?.mode).toBe('direct');
  });

  it('orders the related figures by time', () => {
    const graph = buildRelationGraph(sampleWorld(), 'c');
    expect(graph!.nodes.map((node) => node.slug)).toEqual(['v', 'b', 'd']);
  });

  it('gives no graph for a figure that is not in the content', () => {
    expect(buildRelationGraph(sampleWorld(), 'nobody')).toBeNull();
  });

  it('gives a centre without links for a figure that has no relations', () => {
    expect(buildRelationGraph(sampleWorld(), 'lonely')?.nodes).toEqual([]);
  });
});
