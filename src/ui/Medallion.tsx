import { useState } from 'react';
import type { FigureSummary } from '../domain/types';
import { emblemPath } from './emblems';
import { Icon } from './Icon';
import { portraitSrc } from './portraits';

/** What a medallion needs of a figure: its kind for the emblem, and its slug and portrait record for the picture. */
export type MedallionFigure = Pick<FigureSummary, 'kind' | 'slug' | 'portrait'>;

interface MedallionProps {
  /** The figure shown; an empty medallion with a plus sign is shown when absent. */
  figure?: MedallionFigure;
}

/**
 * A gold coin with the face of a figure: its portrait when the content has
 * one, otherwise the emblem of its kind. A portrait that cannot be loaded
 * gives way to the emblem, so that a medallion is never empty.
 */
export function Medallion({ figure }: MedallionProps) {
  // Remembered by figure: the same medallion may show another figure later, whose picture is fine.
  const [failedSlug, setFailedSlug] = useState<string | null>(null);
  if (!figure) {
    return (
      <span className="medallion medallion--empty">
        <Icon name="plus" />
      </span>
    );
  }
  if (figure.portrait && failedSlug !== figure.slug) {
    return (
      <span className="medallion medallion--portrait" data-representative={figure.portrait.representative}>
        <img src={portraitSrc(figure.slug)} alt="" loading="lazy" decoding="async" onError={() => setFailedSlug(figure.slug)} />
      </span>
    );
  }
  return (
    <span className="medallion">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d={emblemPath(figure.kind)} />
      </svg>
    </span>
  );
}
