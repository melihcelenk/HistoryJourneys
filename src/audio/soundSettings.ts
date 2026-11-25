/**
 * What the player has chosen about sound, and where the choice is kept between visits: a switch for all of it and
 * a level for everything together, for voices, for the room and for the interface. The map and the 3D scene share them. Pure functions; the place the choice is kept in
 * is handed in, so that it can be the browser's storage, a test's memory or nothing at all.
 */

/** What has a level of its own: everything together, the voices of the figures, the sound of the room, the sounds of the interface. */
export const SOUND_CHANNELS = ['master', 'voice', 'ambience', 'effects'] as const;
export type SoundChannel = (typeof SOUND_CHANNELS)[number];

export type SoundSettings = { muted: boolean } & Record<SoundChannel, number>;

/** The part of the browser's storage this needs. */
export interface SettingsStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const SOUND_SETTINGS_KEY = 'hj.scene.sound';

/** The room is a background to the voices and opens well below them. */
export const DEFAULT_SOUND_SETTINGS: SoundSettings = { muted: false, master: 0.8, voice: 1, ambience: 0.5, effects: 0.6 };

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

/** A level as it was saved, or the default where what was saved is not a number. */
function levelFrom(saved: unknown, channel: SoundChannel): number {
  return typeof saved === 'number' && Number.isFinite(saved) ? clamp(saved) : DEFAULT_SOUND_SETTINGS[channel];
}

/** Reads the choice; whatever cannot be read (no store, nothing saved, a damaged entry) gives the defaults. */
export function loadSoundSettings(store: SettingsStore | null): SoundSettings {
  try {
    const parsed: unknown = JSON.parse(store?.getItem(SOUND_SETTINGS_KEY) ?? 'null');
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { ...DEFAULT_SOUND_SETTINGS };
    const saved = parsed as Partial<Record<keyof SoundSettings, unknown>>;
    if (typeof saved.muted !== 'boolean') return { ...DEFAULT_SOUND_SETTINGS };
    return {
      muted: saved.muted,
      master: levelFrom(saved.master, 'master'),
      voice: levelFrom(saved.voice, 'voice'),
      ambience: levelFrom(saved.ambience, 'ambience'),
      effects: levelFrom(saved.effects, 'effects'),
    };
  } catch {
    return { ...DEFAULT_SOUND_SETTINGS };
  }
}

/** Keeps the choice. A store that is missing or refuses (a private window, a full disk) loses it without harm. */
export function saveSoundSettings(store: SettingsStore | null, settings: SoundSettings): void {
  try {
    store?.setItem(SOUND_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // The choice then lasts for this visit only.
  }
}

export function toggleMuted(settings: SoundSettings): SoundSettings {
  return { ...settings, muted: !settings.muted };
}

/** Sets the level of one channel, kept between 0 and 1; a value that is not a number changes nothing. */
export function setLevel(settings: SoundSettings, channel: SoundChannel, level: number): SoundSettings {
  return Number.isFinite(level) ? { ...settings, [channel]: clamp(level) } : settings;
}

/** How loud a channel is actually played: its own level times the level of everything, and nothing while muted. */
export function heardLevel(settings: SoundSettings, channel: SoundChannel): number {
  if (settings.muted) return 0;
  return channel === 'master' ? settings.master : settings.master * settings[channel];
}
