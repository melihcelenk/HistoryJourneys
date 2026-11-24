import { useEffect, useMemo } from 'react';
import { activeFigureSlug, useAppStore, useRouteCards } from '../app/store';
import { buildChronicle, type ChronicleEvent, planPlayback } from '../domain/chronicle';

/** How long playback stays on one event at normal speed, so that the reader can take it in. */
const DWELL_MS = 2600;

/**
 * The events time moves through, by playback or step by step: the journey of
 * the figure whose card is open, or of every figure on the route in the overview.
 */
export function useChronicle(): ChronicleEvent[] {
  const routeCards = useRouteCards();
  const activeSlug = useAppStore(activeFigureSlug);
  const activeCard = useAppStore((state) => (activeSlug ? state.cards[activeSlug] : undefined));
  return useMemo(() => {
    // A figure is in front of the reader: only its journey counts, even while its card is still loading.
    if (activeSlug) return buildChronicle(activeCard ? [activeCard] : []);
    return buildChronicle(routeCards);
  }, [activeSlug, activeCard, routeCards]);
}

/**
 * Plays journeys as a chronicle (FR-14): the journey of the figure whose card
 * is open, or of every figure on the route in the overview. Time jumps from one
 * recorded event to the next and rests on each, instead of running through the
 * years. The length of each rest follows the speed chosen at that moment, so
 * changing the speed never cuts the current event short.
 */
export function usePlayback(events: ChronicleEvent[]): void {
  const playing = useAppStore((state) => state.playing);

  useEffect(() => {
    if (!playing) return undefined;
    const { spotlight, year, setPlaying } = useAppStore.getState();
    const plan = planPlayback(events, spotlight, year);
    if (!plan) {
      setPlaying(false);
      return undefined;
    }
    let index = plan.index;
    let timer = 0;
    const rest = (): void => {
      timer = window.setTimeout(step, DWELL_MS / useAppStore.getState().speed);
    };
    const step = (): void => {
      const event = events[index];
      if (!event) {
        useAppStore.getState().setPlaying(false);
        return;
      }
      useAppStore.getState().tell(event);
      index += 1;
      rest();
    };
    if (plan.tellNow) step();
    else rest();
    return () => window.clearTimeout(timer);
  }, [playing, events]);
}
