import type { Concept } from '../../domain/types';
import { DialogShell } from './DialogShell';

/** A word or term with its origin and the words that share its root (FR-5). */
export function ConceptDialog({ concept }: { concept: Concept }) {
  return (
    <DialogShell title={concept.term} testId="concept-dialog">
      <p>{concept.meaning}</p>
      {concept.root && (
        <div className="concept__root">
          <span className="concept__letters" data-testid="concept-root">
            {concept.root.letters}
          </span>
          <p>
            <strong>{concept.root.language} kök:</strong> {concept.root.meaning}
          </p>
        </div>
      )}
      {concept.related.length > 0 && (
        <>
          <h3 className="display card__section-title">Aynı kökten</h3>
          <ul className="concept__related">
            {concept.related.map((word) => (
              <li key={word.term} className="concept__word">
                <span className="concept__term">{word.term}</span>
                <span className="concept__meaning">{word.meaning}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </DialogShell>
  );
}
