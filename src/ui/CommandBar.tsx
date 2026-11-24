import { useEffect } from 'react';
import { useAppStore, useRouteFigureSlugs } from '../app/store';
import { toHijriYear } from '../domain/calendar';
import type { World } from '../domain/types';
import { Icon } from './Icon';

/** How long one year lasts while the timeline is playing. */
const PLAY_INTERVAL_MS = 140;
/** Shown only while the content has no figures at all. */
const EMPTY_YEAR_RANGE = { min: 1400, max: 1950 };

/** The span of years the timeline covers: the lives of the route figures, or of everyone. */
function useYearRange(world: World | null): { min: number; max: number } {
  const routeFigures = useRouteFigureSlugs();
  const active = useAppStore((state) => state.detour.at(-1) ?? state.from);
  const slugs = new Set([...routeFigures, ...(active ? [active] : [])]);
  const figures = world?.figures.filter((figure) => slugs.size === 0 || slugs.has(figure.slug)) ?? [];
  if (figures.length === 0) return EMPTY_YEAR_RANGE;
  return {
    min: Math.min(...figures.map((figure) => figure.birthYear)),
    max: Math.max(...figures.map((figure) => figure.deathYear)),
  };
}

/** Timeline that drives the map: scrub or play through the years (FR-14, FR-26). */
function Timeline() {
  const world = useAppStore((state) => state.world);
  const year = useAppStore((state) => state.year);
  const playing = useAppStore((state) => state.playing);
  const setYear = useAppStore((state) => state.setYear);
  const setPlaying = useAppStore((state) => state.setPlaying);
  const { min, max } = useYearRange(world);
  const shown = Math.min(Math.max(year, min), max);
  const hijri = toHijriYear(shown);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      const state = useAppStore.getState();
      if (state.year >= max) state.setPlaying(false);
      else state.setYear(Math.max(state.year, min) + 1);
    }, PLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [playing, min, max]);

  const togglePlay = (): void => {
    if (!playing && year >= max) setYear(min);
    setPlaying(!playing);
  };

  return (
    <div className="timeline">
      <button
        type="button"
        className="btn btn--icon btn--wax"
        data-testid="play"
        aria-label={playing ? 'Zamanı durdur' : 'Zamanı oynat'}
        onClick={togglePlay}
      >
        <Icon name={playing ? 'pause' : 'play'} />
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
