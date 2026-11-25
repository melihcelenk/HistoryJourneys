import type { ReactNode } from 'react';
import { useAppStore } from '../app/store';
import { formatYearRange } from '../domain/calendar';
import type { FigureCard as FigureCardModel, FigureSummary } from '../domain/types';
import { ActionItem } from './ActionItem';
import { CardTabs } from './CardDetails';
import { Icon } from './Icon';
import { Medallion } from './Medallion';
import { RichText } from './RichText';
import { scenePageOf } from './scenes';

export function lifespan(figure: FigureSummary): string {
  const life = formatYearRange(figure.birthYear, figure.deathYear);
  return figure.reign ? `${life} · görevde ${formatYearRange(figure.reign.from, figure.reign.to)}` : life;
}

interface FigureCardProps {
  card: FigureCardModel;
  /** Navigation shown under the card, for example previous and next on a route. */
  footer?: ReactNode;
  /** Closes the card; when given, the heading of the card is the button that does it. */
  onClose?: () => void;
}

const SCENE_LABEL = 'Üç boyutlu sahneyi aç';

/**
 * The tools of a card, at its top corner: the link to the 3D scene of the figure, when it has one, and the two map
 * switches: the journey of the figure and the lines between stops (FR-13).
 */
function MapSwitches({ slug }: { slug: string }) {
  const showJourney = useAppStore((state) => state.showJourney);
  const showLines = useAppStore((state) => state.showLines);
  const toggleJourney = useAppStore((state) => state.toggleJourney);
  const toggleLines = useAppStore((state) => state.toggleLines);
  const journeyLabel = showJourney ? 'Yolculuğu haritada gizle' : 'Yolculuğu haritada göster';
  const linesLabel = showLines ? 'Haritadaki çizgileri gizle' : 'Haritadaki çizgileri göster';
  const scenePage = scenePageOf(slug);
  return (
    <div className="card__tools">
      {scenePage && (
        <a className="tool-btn" data-testid="open-scene" href={scenePage} aria-label={SCENE_LABEL} title={SCENE_LABEL}>
          <Icon name="scene" />
        </a>
      )}
      <button
        type="button"
        className="tool-btn"
        data-testid="toggle-journey"
        aria-pressed={showJourney}
        aria-label={journeyLabel}
        title={journeyLabel}
        onClick={toggleJourney}
      >
        <Icon name="journey" />
      </button>
      <button type="button" className="tool-btn" data-testid="toggle-lines" aria-pressed={showLines} aria-label={linesLabel} title={linesLabel} onClick={toggleLines}>
        <Icon name="lines" />
      </button>
    </div>
  );
}

function CardTitle({ card }: { card: FigureCardModel }) {
  return (
    <>
      <Medallion figure={card} />
      <span className="display card__name">{card.nameTr}</span>
    </>
  );
}

/** The first tab of a card: the three-sentence summary and what the figure did. */
function Overview({ card }: { card: FigureCardModel }) {
  return (
    <>
      <p className="card__summary">
        <RichText text={card.summary.join(' ')} />
      </p>
      <hr className="rule" />
      <h4 className="display card__section-title">Yaptıkları</h4>
      <ul className="actions">
        {card.actions.map((action) => (
          <ActionItem key={action.id} action={action} />
        ))}
      </ul>
    </>
  );
}

/**
 * The card of a figure as an illustrated parchment page (FR-1 to FR-6): the
 * heading, with the roles and the years across the whole width under the name,
 * then the parts of the card as tabs.
 */
export function FigureCard({ card, footer, onClose }: FigureCardProps) {
  return (
    <article className="card parchment parchment--framed" data-testid={`card-${card.slug}`}>
      <header className="card__head">
        <div className="card__head-top">
          <h3 className="card__heading">
            {onClose ? (
              <button
                type="button"
                className="card__title"
                data-testid="close-card"
                aria-label={`${card.nameTr}: kartı kapat, genel görünüme dön`}
                title="Kartı kapat, genel görünüme dön"
                onClick={onClose}
              >
                <CardTitle card={card} />
              </button>
            ) : (
              <span className="card__title">
                <CardTitle card={card} />
              </span>
            )}
          </h3>
          <MapSwitches slug={card.slug} />
        </div>
        <p className="card__roles">{card.roles.join(' · ')}</p>
        <p className="card__years">{lifespan(card)}</p>
      </header>
      <CardTabs card={card} overview={<Overview card={card} />} />
      {footer}
    </article>
  );
}
