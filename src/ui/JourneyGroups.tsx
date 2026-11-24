import { activeFigureSlug, useAppStore } from '../app/store';
import { type JourneyGroup, journeyGroups, shownGroup } from '../domain/journey';
import type { FigureCard } from '../domain/types';

interface ShownJourney {
  card: FigureCard;
  groups: JourneyGroup[];
  /** Index of the group that is on the map. */
  active: number;
}

/** The journey that is on the map and the group of its stops that is shown; null when no journey is shown. */
export function useShownJourney(): ShownJourney | null {
  const card = useAppStore((state) => {
    const slug = activeFigureSlug(state);
    return slug ? state.cards[slug] : undefined;
  });
  const shown = useAppStore((state) => state.showJourney);
  const year = useAppStore((state) => state.year);
  const told = useAppStore((state) => (state.spotlight?.figure === card?.slug ? state.spotlight?.stopIndex : undefined));
  if (!card || !shown || card.journey.length === 0) return null;
  return {
    card,
    groups: journeyGroups(card.journey.length),
    active: shownGroup(card, card.journey, year, told)?.index ?? 0,
  };
}

/** Chooses which group of stops of a long journey is on the map (FR-13). */
export function JourneyGroups() {
  const journey = useShownJourney();
  const goToStop = useAppStore((state) => state.goToStop);
  if (!journey || journey.groups.length < 2) return null;
  const { card, groups, active } = journey;
  return (
    <div className="journey-groups stone" role="group" aria-label={`${card.nameTr}: durak grupları`}>
      <span className="display journey-groups__label">Duraklar</span>
      {groups.map((group) => (
        <button
          key={group.index}
          type="button"
          className="journey-groups__btn"
          data-testid={`journey-group-${group.index}`}
          aria-pressed={group.index === active}
          onClick={() => goToStop(card.slug, group.first)}
        >
          {group.first + 1}–{group.last + 1}
        </button>
      ))}
    </div>
  );
}
