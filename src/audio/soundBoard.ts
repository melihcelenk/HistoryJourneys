import { loadSoundSettings, saveSoundSettings, type SettingsStore, type SoundSettings } from './soundSettings';

/**
 * The sound choices of the player as one thing that can be read, changed and listened to. The map and the 3D
 * scene are two pages; each builds a board on the same storage, so a choice made on one holds on the other.
 */
export interface SoundBoard {
  settings(): SoundSettings;
  /** Changes the choices, keeps them and tells everyone who listens. */
  change(change: (settings: SoundSettings) => SoundSettings): void;
  /** Listens for changes; the returned function stops listening. */
  subscribe(listener: () => void): () => void;
}

export function createSoundBoard(store: SettingsStore | null): SoundBoard {
  let settings = loadSoundSettings(store);
  const listeners = new Set<() => void>();
  return {
    settings: () => settings,
    change(change) {
      settings = change(settings);
      saveSoundSettings(store, settings);
      for (const listener of [...listeners]) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** The browser's storage, or nothing where it may not be used (a private window, a blocked site). */
export function browserSettingsStore(): SettingsStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
