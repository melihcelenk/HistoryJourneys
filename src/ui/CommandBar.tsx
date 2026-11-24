import { activeFigureSlug, useAppStore, useRouteFigureSlugs } from '../app/store';
import { toHijriYear } from '../domain/calendar';
import { type ChronicleEvent, neighbourEvent, type StepDirection } from '../domain/chronicle';
import type { World } from '../domain/types';
import { Icon } from './Icon';
import { useChronicle, usePlayback } from './usePlayback';

/** Shown only while the content has no figures at all. */
const EMPTY_YEAR_RANGE = { min: 1400, max: 1950 };

/**
 * The span of years the timeline covers: the life of the figure whose card is
 * open, so that its years can be told apart; in the overview the lives of all
 * the figures on the route; before any figure is chosen, of everyone.
 */
function useYearRange(world: World | null): { min: number; max: number } {
  const routeFigures = useRouteFigureSlugs();
  const active = useAppStore(activeFigureSlug);
  const slugs = new Set(active ? [active] : routeFigures);
  const figures = world?.figures.filter((figure) => slugs.size === 0 || slugs.has(figure.slug)) ?? [];
  if (figures.length === 0) return EMPTY_YEAR_RANGE;
  return {
    min: Math.min(...figures.map((figure) => figure.birthYear)),
    max: Math.max(...figures.map((figure) => figure.deathYear)),
  };
}

const STEP_LABELS: Record<StepDirection, string> = { previous: 'Önceki olay', next: 'Sonraki olay' };

/** Goes to the event before or after the current one by hand; playback stops (FR-14). */
function StepButton({ events, direction }: { events: ChronicleEvent[]; direction: StepDirection }) {
  const target = useAppStore((state) => neighbourEvent(events, state.spotlight, state.year, direction));
  const tell = useAppStore((state) => state.tell);
  const setPlaying = useAppStore((state) => state.setPlaying);
  return (
    <button
      type="button"
      className="btn btn--icon timeline__step"
      data-testid={`${direction}-event`}
      aria-label={STEP_LABELS[direction]}
      title={STEP_LABELS[direction]}
      disabled={target === null}
      onClick={() => {
        if (!target) return;
        setPlaying(false);
        tell(target);
      }}
    >
      <Icon name={direction} />
    </button>
  );
}

/** Timeline that drives the map: scrub through the years, or play the recorded events one by one (FR-14, FR-26). */
function Timeline() {
  const world = useAppStore((state) => state.world);
  const year = useAppStore((state) => state.year);
  const playing = useAppStore((state) => state.playing);
  const setYear = useAppStore((state) => state.setYear);
  const setPlaying = useAppStore((state) => state.setPlaying);
  const speed = useAppStore((state) => state.speed);
  const cycleSpeed = useAppStore((state) => state.cycleSpeed);
  const { min, max } = useYearRange(world);
  const shown = Math.min(Math.max(year, min), max);
  const hijri = toHijriYear(shown);
  const speedLabel = `${speed.toLocaleString('tr-TR')}×`;
  const events = useChronicle();
  usePlayback(events);

  return (
    <div className="timeline">
      <StepButton events={events} direction="previous" />
      <button
        type="button"
        className="btn btn--icon btn--wax"
        data-testid="play"
        aria-label={playing ? 'Zamanı durdur' : 'Zamanı oynat'}
        onClick={() => setPlaying(!playing)}
      >
        <Icon name={playing ? 'pause' : 'play'} />
      </button>
      <StepButton events={events} direction="next" />
      <button type="button" className="btn timeline__speed" data-testid="speed" aria-label={`Oynatma hızı: ${speedLabel}`} onClick={cycleSpeed}>
        {speedLabel}
      </button>
      <output className="timeline__year" data-testid="year" aria-live="off">
        {shown}
        {hijri !== null && <span className="timeline__hijri"> · H. {hijri}</span>}
      </output>
      <div className="timeline__rail">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={shown}
          aria-label="Yıl"
          data-testid="year-slider"
          onChange={(event) => {
            setPlaying(false);
            setYear(Number(event.target.value));
          }}
        />
        <div className="timeline__ends" aria-hidden="true">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}

/** Bottom of the game screen: commands and the timeline (FR-32). */
export function CommandBar() {
  const openDialog = useAppStore((state) => state.openDialog);
  const clearJourney = useAppStore((state) => state.clearJourney);
  return (
    <footer className="command-bar stone">
      <div className="command-bar__group">
        <button type="button" className="btn" data-testid="new-journey" onClick={clearJourney} aria-label="Yeni yolculuk">
          <Icon name="compass" />
          <span className="btn__label">Yeni yolculuk</span>
        </button>
        <button type="button" className="btn" data-testid="open-quiz" onClick={() => openDialog({ kind: 'quiz' })} aria-label="Oyun">
          <Icon name="game" />
          <span className="btn__label">Oyun</span>
        </button>
      </div>
      <Timeline />
      <div className="command-bar__group">
        <button type="button" className="btn" data-testid="open-settings" onClick={() => openDialog({ kind: 'settings' })} aria-label="Harita ve bilgi">
          <Icon name="map" />
          <span className="btn__label">Harita</span>
        </button>
      </div>
    </footer>
  );
}
