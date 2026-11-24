import { useAppStore } from '../app/store';
import { parseMarkup } from '../domain/markup';

interface RichTextProps {
  text: string;
}

/**
 * Renders generated text with its links: figures open their card, concepts
 * open their origin (FR-4, FR-5). Links to figures that are not in the content
 * are shown as plain text.
 */
export function RichText({ text }: RichTextProps) {
  const openFigure = useAppStore((state) => state.openFigure);
  const openConcept = useAppStore((state) => state.openConcept);
  const figures = useAppStore((state) => state.world?.figures);

  return (
    <>
      {parseMarkup(text).map((segment, index) => {
        if (segment.kind === 'text') return segment.text;
        if (segment.target === 'concept') {
          return (
            <button key={index} type="button" className="link link--concept" onClick={() => void openConcept(segment.slug)}>
              {segment.text}
            </button>
          );
        }
        if (!figures?.some((figure) => figure.slug === segment.slug)) return segment.text;
        return (
          <button key={index} type="button" className="link" onClick={() => openFigure(segment.slug)}>
            {segment.text}
          </button>
        );
      })}
    </>
  );
}
