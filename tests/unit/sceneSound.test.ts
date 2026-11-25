import { describe, expect, it } from 'vitest';
import rawBriefing from '../../content/scenes/mehmed-ii.json';
import { ambienceLevel } from '../../src/scene3d/audio/ambienceLevel';
import {
  DEFAULT_SOUND_SETTINGS,
  SOUND_CHANNELS,
  SOUND_SETTINGS_KEY,
  heardLevel,
  loadSoundSettings,
  saveSoundSettings,
  setLevel,
  toggleMuted,
  type SettingsStore,
} from '../../src/audio/soundSettings';
import { createSoundBoard } from '../../src/audio/soundBoard';
import { pickVoice, splitSentences, type VoiceInfo } from '../../src/scene3d/audio/voiceChoice';
import { parseBriefing } from '../../src/scene3d/briefing/briefingSchema';

function memoryStore(initial: Record<string, string> = {}): SettingsStore & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

describe('the sound setting', () => {
  it('is on until the player turns it off', () => {
    expect(loadSoundSettings(memoryStore()).muted).toBe(false);
  });

  it('is kept: what is saved is what is loaded', () => {
    const store = memoryStore();
    saveSoundSettings(store, toggleMuted(loadSoundSettings(store)));
    expect(loadSoundSettings(store).muted).toBe(true);
    saveSoundSettings(store, toggleMuted(loadSoundSettings(store)));
    expect(loadSoundSettings(store).muted).toBe(false);
  });

  it('falls back to its defaults when what was saved cannot be read', () => {
    for (const broken of ['', 'not json', '{"muted":"yes"}', '[]', 'null']) {
      expect(loadSoundSettings(memoryStore({ [SOUND_SETTINGS_KEY]: broken })), broken).toEqual(DEFAULT_SOUND_SETTINGS);
    }
  });

  it('works without a store, as in a private window', () => {
    expect(loadSoundSettings(null)).toEqual(DEFAULT_SOUND_SETTINGS);
    expect(() => saveSoundSettings(null, { ...DEFAULT_SOUND_SETTINGS, muted: true })).not.toThrow();
  });

  it('survives a store that refuses to be written', () => {
    const refusing: SettingsStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(() => saveSoundSettings(refusing, { ...DEFAULT_SOUND_SETTINGS, muted: true })).not.toThrow();
  });
});

describe('the levels of the sound', () => {
  it('has a level for everything together, one for voices, one for the room and one for the interface', () => {
    expect(SOUND_CHANNELS).toEqual(['master', 'voice', 'ambience', 'effects']);
    for (const channel of SOUND_CHANNELS) {
      expect(DEFAULT_SOUND_SETTINGS[channel], channel).toBeGreaterThan(0);
      expect(DEFAULT_SOUND_SETTINGS[channel], channel).toBeLessThanOrEqual(1);
    }
  });

  it('opens with the room quieter than the voices', () => {
    expect(DEFAULT_SOUND_SETTINGS.ambience).toBeLessThan(DEFAULT_SOUND_SETTINGS.voice);
  });

  it('sets one level without touching the others, and keeps it between 0 and 1', () => {
    const quieter = setLevel(DEFAULT_SOUND_SETTINGS, 'ambience', 0.2);
    expect(quieter).toEqual({ ...DEFAULT_SOUND_SETTINGS, ambience: 0.2 });
    expect(setLevel(DEFAULT_SOUND_SETTINGS, 'voice', 7).voice).toBe(1);
    expect(setLevel(DEFAULT_SOUND_SETTINGS, 'voice', -3).voice).toBe(0);
    expect(setLevel(DEFAULT_SOUND_SETTINGS, 'master', Number.NaN).master).toBe(DEFAULT_SOUND_SETTINGS.master);
  });

  it('plays a channel at its own level times the level of everything', () => {
    const settings = { muted: false, master: 0.5, voice: 0.8, ambience: 0.4, effects: 0.6 };
    expect(heardLevel(settings, 'effects')).toBeCloseTo(0.3, 6);
    expect(heardLevel(settings, 'voice')).toBeCloseTo(0.4, 6);
    expect(heardLevel(settings, 'ambience')).toBeCloseTo(0.2, 6);
    expect(heardLevel(settings, 'master')).toBeCloseTo(0.5, 6);
  });

  it('plays nothing while the sound is off, and keeps the levels for when it is on again', () => {
    const muted = { muted: true, master: 0.5, voice: 0.8, ambience: 0.4, effects: 0.6 };
    for (const channel of SOUND_CHANNELS) expect(heardLevel(muted, channel)).toBe(0);
    expect(toggleMuted(muted)).toEqual({ ...muted, muted: false });
  });

  it('keeps the levels between visits', () => {
    const store = memoryStore();
    saveSoundSettings(store, setLevel(setLevel(DEFAULT_SOUND_SETTINGS, 'voice', 0.3), 'master', 0.6));
    expect(loadSoundSettings(store)).toEqual({ ...DEFAULT_SOUND_SETTINGS, voice: 0.3, master: 0.6 });
  });

  it('reads what an earlier version saved: the switch alone, or levels out of range', () => {
    expect(loadSoundSettings(memoryStore({ [SOUND_SETTINGS_KEY]: '{"muted":true}' }))).toEqual({ ...DEFAULT_SOUND_SETTINGS, muted: true });
    const odd = loadSoundSettings(memoryStore({ [SOUND_SETTINGS_KEY]: '{"muted":false,"master":4,"voice":"loud","ambience":-1}' }));
    expect(odd).toEqual({ ...DEFAULT_SOUND_SETTINGS, master: 1, ambience: 0 });
  });
});

describe('choosing the voice of the narrator', () => {
  const voice = (name: string, lang: string): VoiceInfo => ({ name, lang });

  it('takes a Turkish voice and no other', () => {
    expect(pickVoice([voice('Microsoft David', 'en-US'), voice('Google Türkçe', 'tr-TR')])?.name).toBe('Google Türkçe');
    expect(pickVoice([voice('Microsoft David', 'en-US'), voice('Anna', 'de-DE')])).toBeNull();
    expect(pickVoice([])).toBeNull();
  });

  it('reads the language however the device writes it', () => {
    for (const lang of ['tr-TR', 'tr_TR', 'tr', 'TR-tr']) expect(pickVoice([voice('Ses', lang)])?.name, lang).toBe('Ses');
    // Other languages whose code only starts with the same letters are not Turkish.
    expect(pickVoice([voice('Ses', 'trv')])).toBeNull();
  });

  it('prefers a voice known to be a man over the first Turkish voice', () => {
    const voices = [voice('Microsoft Emel Online (Natural) - Turkish (Türkiye)', 'tr-TR'), voice('Microsoft Ahmet Online (Natural) - Turkish (Türkiye)', 'tr-TR')];
    expect(pickVoice(voices)?.name).toContain('Ahmet');
    expect(pickVoice([voice('Yelda', 'tr-TR'), voice('Microsoft Tolga - Turkish (Turkey)', 'tr-TR')])?.name).toContain('Tolga');
  });

  it('falls back to the first Turkish voice when none is known to be a man', () => {
    expect(pickVoice([voice('Yelda', 'tr-TR'), voice('Google Türkçe', 'tr-TR')])?.name).toBe('Yelda');
  });
});

describe('cutting what is said into sentences', () => {
  it('cuts at the end of each sentence and keeps its mark', () => {
    expect(splitSentences('Şehir alındı. O gün yirmi bir yaşındaydım; bana Fatih dediler.')).toEqual(['Şehir alındı.', 'O gün yirmi bir yaşındaydım; bana Fatih dediler.']);
    expect(splitSentences('Kim durdurabilir? Hiç kimse!')).toEqual(['Kim durdurabilir?', 'Hiç kimse!']);
  });

  it('does not cut at the stop of a date or an ordinal', () => {
    expect(splitSentences("6 Nisan 1453'te başladı. 29. gün bitti.")).toEqual(["6 Nisan 1453'te başladı.", '29. gün bitti.']);
  });

  it('gives nothing for nothing and trims what it gives', () => {
    expect(splitSentences('')).toEqual([]);
    expect(splitSentences('   ')).toEqual([]);
    expect(splitSentences('  Tek cümle  ')).toEqual(['Tek cümle']);
  });

  it('loses no word of the briefing', () => {
    for (const step of parseBriefing(rawBriefing).steps) {
      const sentences = splitSentences(step.text);
      expect(sentences.length, step.id).toBeGreaterThan(1);
      expect(sentences.join(' '), step.id).toBe(step.text);
    }
  });
});

describe('how loud the room is', () => {
  it('is louder near the hearth than at the door', () => {
    expect(ambienceLevel({ distanceToHearth: 0.5, speaking: false })).toBeGreaterThan(ambienceLevel({ distanceToHearth: 8, speaking: false }));
  });

  it('never falls silent and never exceeds its ceiling', () => {
    for (const distanceToHearth of [0, 1, 4, 9, 100]) {
      const level = ambienceLevel({ distanceToHearth, speaking: false });
      expect(level).toBeGreaterThan(0.02);
      expect(level).toBeLessThanOrEqual(0.5);
    }
  });

  it('is turned down while the figure speaks', () => {
    const quiet = ambienceLevel({ distanceToHearth: 2, speaking: true });
    const loud = ambienceLevel({ distanceToHearth: 2, speaking: false });
    expect(quiet).toBeLessThan(loud * 0.6);
    expect(quiet).toBeGreaterThan(0);
  });
});

describe('recorded lines in a briefing', () => {
  it('are optional: a step may name a sound file or leave it to the voice of the device', () => {
    const withAudio = { ...rawBriefing, steps: rawBriefing.steps.map((step, index) => (index === 0 ? { ...step, audio: 'audio/mehmed-ii/bogaz.mp3' } : step)) };
    const parsed = parseBriefing(withAudio);
    expect(parsed.steps[0]?.audio).toBe('audio/mehmed-ii/bogaz.mp3');
    expect(parsed.steps[1]?.audio).toBeUndefined();
  });

  it('must be files of this site, not addresses elsewhere', () => {
    for (const audio of ['https://example.com/a.mp3', '//example.com/a.mp3', '/etc/passwd', '../secret.mp3', 'audio/a.exe']) {
      const broken = { ...rawBriefing, steps: rawBriefing.steps.map((step, index) => (index === 0 ? { ...step, audio } : step)) };
      expect(() => parseBriefing(broken), audio).toThrow();
    }
  });
});

describe('the sound choices shared by the map and the scene', () => {
  it('reads what was saved before the interface had a level of its own', () => {
    const store = memoryStore({ [SOUND_SETTINGS_KEY]: '{"muted":false,"master":0.6,"voice":1,"ambience":0.2}' });
    expect(loadSoundSettings(store)).toEqual({ ...DEFAULT_SOUND_SETTINGS, master: 0.6, ambience: 0.2 });
  });

  it('tells everyone who listens when a choice changes, and keeps it', () => {
    const store = memoryStore();
    const board = createSoundBoard(store);
    const seen: boolean[] = [];
    const stop = board.subscribe(() => seen.push(board.settings().muted));
    board.change((settings) => toggleMuted(settings));
    board.change((settings) => setLevel(settings, 'effects', 0.3));
    expect(seen).toEqual([true, true]);
    expect(loadSoundSettings(store)).toEqual({ ...DEFAULT_SOUND_SETTINGS, muted: true, effects: 0.3 });
    stop();
    board.change((settings) => toggleMuted(settings));
    expect(seen).toHaveLength(2);
  });

  it('starts from what the other page left', () => {
    const store = memoryStore();
    createSoundBoard(store).change((settings) => toggleMuted(settings));
    expect(createSoundBoard(store).settings().muted).toBe(true);
  });
});
