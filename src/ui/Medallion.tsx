import type { FigureKind } from '../domain/types';
import { emblemPath } from './emblems';
import { Icon } from './Icon';

interface MedallionProps {
  /** Kind of the figure; an empty medallion with a plus sign is shown when absent. */
  kind?: FigureKind;
}

/** A gold coin with the emblem of a figure's kind. */
export function Medallion({ kind }: MedallionProps) {
  if (!kind) {
    return (
      <span className="medallion medallion--empty">
        <Icon name="plus" />
      </span>
    );
  }
  return (
    <span className="medallion">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d={emblemPath(kind)} />
      </svg>
    </span>
  );
}
