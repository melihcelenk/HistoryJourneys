import { useMemo } from 'react';
import { useAppStore } from '../../app/store';
import { formatYearRange } from '../../domain/calendar';
import { buildRelationGraph, type GraphFigure } from '../../domain/relationGraph';
import type { RelationMode } from '../../domain/types';
import { Medallion } from '../Medallion';
import { DialogShell } from './DialogShell';

/** Radius of the circle of related figures, in percent of the width and of the height of the board. */
const RADIUS_PERCENT = 38;
/** How far along a link, from the centre, its label sits; past the middle so that labels do not crowd the centre. */
const LABEL_POSITION = 0.58;

const MODE_LABELS: Record<RelationMode, string> = { direct: 'Doğrudan ilişki', influence: 'Etki' };

/** Position on the board, in percent, of a point given in units of the circle radius. */
function percent(value: number, scale = 1): string {
  return `${50 + value * RADIUS_PERCENT * scale}%`;
}

function FigureBadge({ figure }: { figure: GraphFigure }) {
  return (
    <>
      <Medallion kind={figure.kind} />
      <span className="graph__name">{figure.name}</span>
      <span className="graph__years">{formatYearRange(figure.birthYear, figure.deathYear)}</span>
    </>
  );
}

/**
 * The relations of one figure as a graph (FR-11): the figure in the centre,
 * the figures it has to do with around it. Choosing a figure opens its card.
 */
export function RelationGraphDialog({ figure }: { figure: string }) {
  const world = useAppStore((state) => state.world);
  const openFigure = useAppStore((state) => state.openFigure);
  const graph = useMemo(() => (world ? buildRelationGraph(world, figure) : null), [world, figure]);
  if (!graph) return null;

  return (
    <DialogShell title={`${graph.centre.name}: ilişkileri`} wide testId="relation-graph">
      <div className="graph">
        <svg className="graph__links" aria-hidden="true">
          {graph.nodes.map((node) => (
            <line key={node.slug} x1="50%" y1="50%" x2={percent(node.x)} y2={percent(node.y)} data-mode={node.mode} />
          ))}
        </svg>
        {graph.nodes.map((node) => (
          <span
            key={node.slug}
            className="graph__label"
            data-mode={node.mode}
            style={{ left: percent(node.x, LABEL_POSITION), top: percent(node.y, LABEL_POSITION) }}
          >
            {node.labels.join(' · ')}
          </span>
        ))}
        <div className="graph__figure graph__figure--centre" data-testid="graph-centre">
          <FigureBadge figure={graph.centre} />
        </div>
        {graph.nodes.map((node) => (
          <button
            key={node.slug}
            type="button"
            className="graph__figure"
            data-testid={`graph-node-${node.slug}`}
            title={node.notes.join(' ')}
            style={{ left: percent(node.x), top: percent(node.y) }}
            onClick={() => openFigure(node.slug)}
          >
            <FigureBadge figure={node} />
          </button>
        ))}
      </div>
      <p className="graph__legend">
        {(Object.keys(MODE_LABELS) as RelationMode[]).map((mode) => (
          <span key={mode} className="graph__legend-item" data-mode={mode}>
            {MODE_LABELS[mode]}
          </span>
        ))}
        <span>Bir kişiye tıklayınca kartı açılır.</span>
      </p>
    </DialogShell>
  );
}
