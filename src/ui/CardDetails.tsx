import { type ReactNode, useEffect, useRef } from 'react';
import { CARD_TABS, type CardTab, useAppStore } from '../app/store';
import { formatYearRange } from '../domain/calendar';
import { currentStopIndex } from '../domain/journey';
import { otherEnd } from '../domain/relationGraph';
import type { FigureCard, Precision, Relation } from '../domain/types';
import { Icon, type IconName } from './Icon';

const PRECISION_LABELS: Record<Precision, string> = {
  building: 'yapı kesin',
  district: 'semt düzeyinde',
  city: 'şehir düzeyinde',
  region: 'yaklaşık bölge',
};

/** Index of the stop the figure is at on the map; -1 when no stop is recorded for the year. */
function useCurrentStopIndex(card: FigureCard): number {
  const year = useAppStore((state) => state.year);
  const told = useAppStore((state) => (state.spotlight?.figure === card.slug ? state.spotlight.stopIndex : undefined));
  return currentStopIndex(card, card.journey, year, told);
}

/**
 * The journey of the figure as a list that moves with the map (FR-13): the
 * stop the figure is at is marked, and choosing an entry goes to that stop.
 */
function JourneyList({ card }: { card: FigureCard }) {
  const goToStop = useAppStore((state) => state.goToStop);
  const current = useCurrentStopIndex(card);
  const currentRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [current]);

  return (
    <ol className="journey" data-testid="journey-list">
      {card.journey.map((stop, index) => (
        <li key={index}>
          <button
            type="button"
            className="journey__stop"
            ref={index === current ? currentRef : undefined}
            aria-current={index === current ? 'true' : undefined}
            onClick={() => goToStop(card.slug, index)}
          >
            <span className="journey__number">{index + 1}</span>
            <span className="journey__body">
              <span className="journey__years">{formatYearRange(stop.from, stop.to)}</span>{' '}
              <span className="journey__place">
                {stop.place.nameTr}
                {stop.place.historicName && stop.place.historicName !== stop.place.nameTr && ` (${stop.place.historicName})`}
              </span>{' '}
              <span className="journey__precision">{PRECISION_LABELS[stop.precision]}</span>
              <span className="journey__event">{stop.event}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function RelationList({ slug }: { slug: string }) {
  const world = useAppStore((state) => state.world);
  const openFigure = useAppStore((state) => state.openFigure);
  const openDialog = useAppStore((state) => state.openDialog);
  if (!world) return null;
  const names = new Map(world.figures.map((figure) => [figure.slug, figure.nameTr]));
  const typeNames = new Map(world.relationTypes.map((type) => [type.type, type.nameTr]));
  // The same relations as the graph shows: those of this figure with another figure of the content.
  const related: { relation: Relation; other: string }[] = world.relations.flatMap((relation) => {
    const other = otherEnd(relation, slug);
    return other !== null && names.has(other) ? [{ relation, other }] : [];
  });
  if (related.length === 0) return <p>Bu figür için kayıtlı ilişki yok.</p>;
  return (
    <>
      <button type="button" className="ink-btn" data-testid="open-relation-graph" onClick={() => openDialog({ kind: 'relations', figure: slug })}>
        <Icon name="graph" />
        Graf olarak gör
      </button>
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
    </>
  );
}

/** Where the portrait comes from: the work, its maker, its date and its licence (DR-5). */
function PortraitCredit({ card }: { card: FigureCard }) {
  const portrait = card.portrait;
  if (!portrait) return null;
  return (
    <p className="portrait-credit" data-testid="portrait-credit">
      <strong>Portre:</strong>{' '}
      <a href={portrait.sourceUrl} target="_blank" rel="noreferrer">
        {portrait.title}
      </a>
      . {portrait.author}, {portrait.created}. <span className="journey__precision">{portrait.license} · Wikimedia Commons</span>
      {portrait.representative && (
        <span className="portrait-credit__note" data-testid="portrait-representative">
          {' '}
          Temsilî: kişinin yaşadığı dönemde yapıldığı bilinmiyor.
        </span>
      )}
    </p>
  );
}

function SourceList({ card }: { card: FigureCard }) {
  return (
    <div className="sources">
      <PortraitCredit card={card} />
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
        Bu kart yapay zekâ ile üretildi ({card.generation.model}, kural seti {card.generation.ruleset}, {card.generation.date}); insan onayından geçmedi.
      </p>
    </div>
  );
}

/** How each tab is presented; the record must name every tab of the store. */
const TAB_LABELS: Record<CardTab, { label: string; icon: IconName }> = {
  overview: { label: 'Özet', icon: 'crest' },
  journey: { label: 'Yolculuğu', icon: 'journey' },
  relations: { label: 'İlişkileri', icon: 'graph' },
  sources: { label: 'Kaynaklar', icon: 'details' },
};

function TabPanel({ tab, card, overview }: { tab: CardTab; card: FigureCard; overview: ReactNode }) {
  switch (tab) {
    case 'overview':
      return overview;
    case 'journey':
      return <JourneyList card={card} />;
    case 'relations':
      return <RelationList slug={card.slug} />;
    case 'sources':
      return <SourceList card={card} />;
    default: {
      // A new tab must be handled here; the compiler reports it on this line.
      const unhandled: never = tab;
      throw new Error(`Unhandled tab: ${String(unhandled)}`);
    }
  }
}

/**
 * The parts of a card as tabs right under its heading (FR-1, FR-3, FR-6): the
 * overview with the summary and the actions, the journey, the relations and
 * the sources. One tab is always open, and the choice is kept from one card
 * to the next: a reader who follows journeys keeps seeing journeys.
 */
export function CardTabs({ card, overview }: { card: FigureCard; overview: ReactNode }) {
  const open = useAppStore((state) => state.cardTab);
  const setCardTab = useAppStore((state) => state.setCardTab);
  return (
    <div className="card-tabs">
      <div className="card-tabs__bar" role="tablist" aria-label={`${card.nameTr}: kartın bölümleri`}>
        {CARD_TABS.map((tab) => (
          <button key={tab} type="button" role="tab" className="card-tab" data-testid={`tab-${tab}`} aria-selected={open === tab} onClick={() => setCardTab(tab)}>
            <Icon name={TAB_LABELS[tab].icon} />
            {TAB_LABELS[tab].label}
          </button>
        ))}
      </div>
      <div className="card-tabs__panel" role="tabpanel" data-tab={open}>
        <TabPanel tab={open} card={card} overview={overview} />
      </div>
    </div>
  );
}
