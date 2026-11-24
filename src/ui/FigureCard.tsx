import { type ReactNode, useState } from 'react';
import { useAppStore } from '../app/store';
import { formatYearRange } from '../domain/calendar';
import type { FigureCard as FigureCardModel, FigureSummary, Precision, Relation } from '../domain/types';
import { ActionItem } from './ActionItem';
import { Icon } from './Icon';
import { Medallion } from './Medallion';
import { RichText } from './RichText';

const PRECISION_LABELS: Record<Precision, string> = {
  building: 'yapı kesin',
  district: 'semt düzeyinde',
  city: 'şehir düzeyinde',
  region: 'yaklaşık bölge',
};

export function lifespan(figure: FigureSummary): string {
  const life = formatYearRange(figure.birthYear, figure.deathYear);
  return figure.reign ? `${life} · görevde ${formatYearRange(figure.reign.from, figure.reign.to)}` : life;
}

function JourneyList({ card }: { card: FigureCardModel }) {
  return (
    <section>
      <h4 className="display card__section-title">Yolculuğu</h4>
      <ol>
        {card.journey.map((stop, index) => (
          <li key={index} className="journey__stop">
            <span className="journey__years">{formatYearRange(stop.from, stop.to)}</span>
            <span>
              <span className="journey__place">
                {stop.place.nameTr}
                {stop.place.historicName && stop.place.historicName !== stop.place.nameTr && ` (${stop.place.historicName})`}
              </span>{' '}
              <span className="journey__precision">{PRECISION_LABELS[stop.precision]}</span>
              <br />
              {stop.event}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RelationList({ slug }: { slug: string }) {
  const world = useAppStore((state) => state.world);
  const openFigure = useAppStore((state) => state.openFigure);
  if (!world) return null;
  const names = new Map(world.figures.map((figure) => [figure.slug, figure.nameTr]));
  const typeNames = new Map(world.relationTypes.map((type) => [type.type, type.nameTr]));
  const related: { relation: Relation; other: string }[] = world.relations
    .filter((relation) => relation.from === slug || relation.to === slug)
    .map((relation) => ({ relation, other: relation.from === slug ? relation.to : relation.from }));
  if (related.length === 0) return null;
  return (
    <section>
      <h4 className="display card__section-title">İlişkileri</h4>
      <ul>
        {related.map(({ relation, other }) => (
          <li key={`${relation.from}-${relation.to}-${relation.type}`}>
            <button type="button" className="link" onClick={() => openFigure(other)}>
              {names.get(other) ?? other}
            </button>{' '}
            <span className="journey__precision">{typeNames.get(relation.type) ?? relation.type}</span>
            <br />
            {relation.note}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SourceList({ card }: { card: FigureCardModel }) {
  return (
    <section className="sources">
      <h4 className="display card__section-title">Kaynaklar</h4>
      <ul>
        {card.sources.map((source) => (
          <li key={source.id}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.publisher}: {source.title}
            </a>
            {source.license && <span className="journey__precision"> ({source.license})</span>}
          </li>
        ))}
      </ul>
      <p className="generation-note">
        Bu kart yapay zekâ ile üretildi ({card.generation.model}, kural seti {card.generation.ruleset},{' '}
        {card.generation.date}); insan onayından geçmedi.
      </p>
    </section>
  );
}

interface FigureCardProps {
  card: FigureCardModel;
  /** Navigation shown under the card, for example previous and next on a route. */
  footer?: ReactNode;
}

/**
 * The card of a figure as an illustrated parchment page: three-sentence
 * summary, actions with causes and consequences, and details on demand
 * (FR-1 to FR-6).
 */
export function FigureCard({ card, footer }: FigureCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <article className="card parchment parchment--framed" data-testid={`card-${card.slug}`}>
      <header className="card__head">
        <Medallion kind={card.kind} />
        <div>
          <h3 className="display card__name">{card.nameTr}</h3>
          <p className="card__roles">{card.roles.join(' · ')}</p>
          <p className="card__years">{lifespan(card)}</p>
        </div>
      </header>
      <hr className="rule" />
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
      <div className="card__foot">
        <button type="button" className="ink-btn" aria-expanded={detailsOpen} onClick={() => setDetailsOpen(!detailsOpen)}>
          <Icon name="details" />
          Ayrıntılar
        </button>
        <span className="seal" title="History Journeys mührü">
          <Icon name="crest" />
        </span>
      </div>
      {detailsOpen && (
        <div className="details">
          <hr className="rule" />
          <JourneyList card={card} />
          <RelationList slug={card.slug} />
          <SourceList card={card} />
        </div>
      )}
      {footer}
    </article>
  );
}
