import { type ReactNode, useEffect, useRef, useState } from 'react';
import { type AppState, currentRoute, type EndpointSlot, useAppStore } from '../app/store';
import { SUGGESTED_JOURNEYS } from '../app/suggestions';
import { formatYearRange } from '../domain/calendar';
import type { Route, RouteStep } from '../domain/routeEngine';
import type { FigureSummary, World } from '../domain/types';
import { EMPTY_SLOT_LABEL, SLOT_LABELS } from './endpointLabels';
import { FigureCard } from './FigureCard';
import { Icon } from './Icon';
import { Medallion } from './Medallion';
import { RouteKindChooser } from './RouteKindChooser';

function findFigure(world: World, slug: string | null | undefined): FigureSummary | undefined {
  return world.figures.find((figure) => figure.slug === slug);
}

/** One end of the journey on the start screen; shows the chosen figure or asks for one. */
function EndpointSlotButton({ slot, world }: { slot: EndpointSlot; world: World }) {
  const figure = useAppStore((state) => findFigure(world, state[slot]));
  const openDialog = useAppStore((state) => state.openDialog);
  return (
    <button type="button" className="slot" data-testid={`slot-${slot}`} onClick={() => openDialog({ kind: 'picker', slot })}>
      <Medallion kind={figure?.kind} />
      <span className="slot__label">{SLOT_LABELS[slot]}</span>
      <span className="slot__name">{figure?.nameTr ?? EMPTY_SLOT_LABEL}</span>
    </button>
  );
}

/** Shown in place of a card that could not be loaded, with a way to try again. */
function CardLoadError({ slug }: { slug: string }) {
  const openFigure = useAppStore((state) => state.openFigure);
  return (
    <section className="notice parchment parchment--framed" role="alert" data-testid={`card-error-${slug}`}>
      <h2 className="display notice__title">Kart açılamadı</h2>
      <p>Bu figürün kartı yüklenemedi.</p>
      <button type="button" className="ink-btn" onClick={() => openFigure(slug)}>
        Yeniden dene
      </button>
    </section>
  );
}

/** The card of a figure once it has loaded, or the reason it is not there. */
function LoadedCard({ slug, footer, onClose }: { slug: string; footer?: ReactNode; onClose?: () => void }) {
  const card = useAppStore((state) => state.cards[slug]);
  const failed = useAppStore((state) => state.failedCards.includes(slug));
  if (card) return <FigureCard card={card} footer={footer} onClose={onClose} />;
  return failed ? <CardLoadError slug={slug} /> : null;
}

/** Start screen: choose two figures or take a suggested journey. */
function Welcome({ world }: { world: World }) {
  const startJourney = useAppStore((state) => state.startJourney);
  const suggestions = SUGGESTED_JOURNEYS.flatMap((journey) => {
    const start = findFigure(world, journey.from);
    const end = findFigure(world, journey.to);
    return start && end ? [{ journey, start, end }] : [];
  });

  return (
    <section className="welcome parchment parchment--framed" data-testid="welcome">
      <h2 className="display welcome__title">Yolculuğunu seç</h2>
      <p className="welcome__lead">
        İki figür seç; aralarındaki insanlar, olaylar ve fikirler üzerinden bir rota çizelim.
      </p>
      <div className="welcome__slots">
        <EndpointSlotButton slot="from" world={world} />
        <Icon name="forward" className="welcome__arrow" />
        <EndpointSlotButton slot="to" world={world} />
      </div>
      <h3 className="display card__section-title">Rota türü</h3>
      <RouteKindChooser />
      <hr className="rule" />
      <h3 className="display card__section-title">Hazır yolculuklar</h3>
      <ul className="suggestions">
        {suggestions.map(({ journey, start, end }) => (
          <li key={`${journey.from}-${journey.to}`}>
            <button type="button" className="suggestion" onClick={() => startJourney(journey.from, journey.to)}>
              <span className="suggestion__names">
                {start.nameTr} → {end.nameTr}
                <span className="suggestion__hint">{journey.hint}</span>
              </span>
              <Icon name="compass" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Becomes true once web fonts have loaded; text reflows then, so scroll positions must be refreshed. */
function useFontsReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return ready;
}

interface ChainLinkProps {
  step: RouteStep;
  world: World;
}

/** The cord between two cards, tagged with the relation that connects them (FR-28). */
function ChainLink({ step, world }: ChainLinkProps) {
  const link = step.linkToNext;
  if (!link) return null;
  const typeName = world.relationTypes.find((type) => type.type === link.type)?.nameTr ?? link.type;
  return (
    <div className="chain-link">
      <span className="chain-link__tag">{typeName}</span>
      <span className="chain-link__note">{link.note}</span>
    </div>
  );
}

function CardNavigation({ route, index }: { route: Route; index: number }) {
  const world = useAppStore((state) => state.world);
  const openFigure = useAppStore((state) => state.openFigure);
  const previous = route.steps[index - 1]?.figure;
  const next = route.steps[index + 1]?.figure;
  const name = (slug: string): string => (world ? findFigure(world, slug)?.nameTr : undefined) ?? slug;
  return (
    <nav className="card__nav" aria-label="Rotada gezin">
      {previous && (
        <button type="button" className="card__back" data-testid="previous-card" onClick={() => openFigure(previous)}>
          <Icon name="up" />
          Önceki: {name(previous)}
        </button>
      )}
      {next && (
        <button type="button" className="next-card" data-testid="next-card" onClick={() => openFigure(next)}>
          <span className="next-card__label">Sıradaki</span>
          <span className="display next-card__name">{name(next)}</span>
          <Icon name="next" className="next-card__arrow" />
        </button>
      )}
    </nav>
  );
}

/**
 * The chosen route as a vertical chain; the card in focus is open, the others are strips (FR-9, FR-10).
 * In the overview no card is open and the chain is all strips.
 */
function RouteChain({ route, world }: { route: Route; world: World }) {
  const focus = useAppStore((state) => state.focus);
  const cards = useAppStore((state) => state.cards);
  const failedCards = useAppStore((state) => state.failedCards);
  const openFigure = useAppStore((state) => state.openFigure);
  const closeFigure = useAppStore((state) => state.closeFigure);
  const focusRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const unknown = route.steps.filter((step) => !findFigure(world, step.figure)).map((step) => step.figure);
    if (unknown.length > 0) console.warn(`Route ${route.id} has steps that are not figures in the content: ${unknown.join(', ')}`);
  }, [route, world]);

  // The open card replaces its strip only once it has loaded, so the scroll waits for that too.
  const focusLoaded = focus !== null && focus in cards;
  const fontsReady = useFontsReady();
  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [focus, focusLoaded, fontsReady, route.id]);

  return (
    <ol className="chain" data-testid="route-chain">
      {route.steps.map((step, index) => {
        const figure = findFigure(world, step.figure);
        if (!figure) return null;
        const open = step.figure === focus && (step.figure in cards || failedCards.includes(step.figure));
        return (
          <li key={step.figure} className="chain__item" ref={step.figure === focus ? focusRef : undefined}>
            {open ? (
              <LoadedCard slug={step.figure} footer={<CardNavigation route={route} index={index} />} onClose={closeFigure} />
            ) : (
              <button
                type="button"
                className="strip parchment"
                data-testid={`strip-${figure.slug}`}
                onClick={() => openFigure(figure.slug)}
              >
                <Medallion kind={figure.kind} />
                <span className="display strip__name">{figure.nameTr}</span>
                <span className="strip__years">{formatYearRange(figure.birthYear, figure.deathYear)}</span>
              </button>
            )}
            <ChainLink step={step} world={world} />
          </li>
        );
      })}
    </ol>
  );
}

/** A figure opened away from the route, with the way back (FR-11). */
function Detour({ slug, hasRoute }: { slug: string; hasRoute: boolean }) {
  const closeDetour = useAppStore((state) => state.closeDetour);
  const setEndpoint = useAppStore((state) => state.setEndpoint);
  const topRef = useRef<HTMLDivElement>(null);
  // The panel keeps the scroll position of the route; a detour starts at its own top.
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start' });
  }, [slug]);
  return (
    <div data-testid="detour" ref={topRef}>
      <div className="detour-bar stone">
        <button type="button" className="btn" data-testid="back-to-route" onClick={closeDetour}>
          <Icon name="back" />
          {hasRoute ? 'Rotaya dön' : 'Geri dön'}
        </button>
        <span className="detour-bar__text">Rotadan ayrıldın; kaldığın yer seni bekliyor.</span>
      </div>
      <LoadedCard
        slug={slug}
        footer={
          <nav className="card__nav">
            <span />
            <button type="button" className="ink-btn" onClick={() => setEndpoint('to', slug)}>
              <Icon name="compass" />
              Yolculuğu buraya çevir
            </button>
          </nav>
        }
      />
    </div>
  );
}

function NoRoute() {
  return (
    <section className="notice parchment parchment--framed" data-testid="no-route">
      <h2 className="display notice__title">Rota bulunamadı</h2>
      <p>Bu iki figür arasında anlamlı bir rota bulunamadı. Başka bir figür seçmeyi dene.</p>
    </section>
  );
}

/** A single figure is chosen: show its card and ask for the destination. */
function StartingPoint({ slug }: { slug: string }) {
  const openDialog = useAppStore((state) => state.openDialog);
  return (
    <div data-testid="starting-point">
      <div className="detour-bar stone">
        <button type="button" className="btn btn--wax" onClick={() => openDialog({ kind: 'picker', slot: 'to' })}>
          <Icon name="compass" />
          Varış figürünü seç
        </button>
        <span className="detour-bar__text">Bir varış seç, aradaki rotayı çizelim.</span>
      </div>
      <LoadedCard slug={slug} />
    </div>
  );
}

function selectView(state: AppState): 'welcome' | 'start' | 'none' | 'detour' | 'route' {
  if (!state.from) return 'welcome';
  if (state.detour.length > 0) return 'detour';
  if (!state.to) return 'start';
  return currentRoute(state) ? 'route' : 'none';
}

/** The scroll the player reads: start screen, route chain, detour or notices. */
export function RoutePanel() {
  const world = useAppStore((state) => state.world);
  const view = useAppStore(selectView);
  const route = useAppStore(currentRoute);
  const from = useAppStore((state) => state.from);
  const detour = useAppStore((state) => state.detour.at(-1));
  if (!world) return null;

  switch (view) {
    case 'welcome':
      return <Welcome world={world} />;
    case 'detour':
      return detour ? <Detour slug={detour} hasRoute={route !== undefined} /> : null;
    case 'start':
      return from ? <StartingPoint slug={from} /> : null;
    case 'none':
      return <NoRoute />;
    case 'route':
      return route ? <RouteChain route={route} world={world} /> : null;
  }
}
