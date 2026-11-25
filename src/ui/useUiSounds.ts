import { useEffect, useSyncExternalStore } from 'react';
import { activeFigureSlug, useAppStore } from '../app/store';
import { browserSettingsStore, createSoundBoard } from '../audio/soundBoard';
import { heardLevel, toggleMuted, type SoundSettings } from '../audio/soundSettings';
import { createUiSounds, tapOnEveryPress } from '../audio/uiSounds';

/**
 * Sound on the map side of the game: the tap of every press and the rustle of a parchment whenever a card or a
 * dialog is opened. The choices are the ones the 3D scene uses; both pages keep them in the same place.
 */
const board = createSoundBoard(browserSettingsStore());

/** The sound choices of the player, and the switch that turns all sound off and on. */
export function useSoundSettings(): { settings: SoundSettings; toggleMuted: () => void } {
  const settings = useSyncExternalStore(board.subscribe, board.settings);
  return { settings, toggleMuted: () => board.change(toggleMuted) };
}

/** Lets the interface sound for as long as the component that calls it is on the screen. */
export function useUiSounds(): void {
  useEffect(() => {
    const sounds = createUiSounds(() => heardLevel(board.settings(), 'effects'));
    const stopTapping = tapOnEveryPress(sounds);
    // What is open when the game starts is not announced; every card and dialog opened after that is.
    let shown = shownNow();
    const stopListening = useAppStore.subscribe(() => {
      const next = shownNow();
      if (next !== shown && next !== NOTHING) sounds.play('parchment');
      shown = next;
    });
    return () => {
      stopListening();
      stopTapping();
      sounds.dispose();
    };
  }, []);
}

const NOTHING = '|';

/** What parchment lies open: the card of a figure and the dialog over it. */
function shownNow(): string {
  const state = useAppStore.getState();
  return `${activeFigureSlug(state) ?? ''}|${state.dialog?.kind ?? ''}`;
}
