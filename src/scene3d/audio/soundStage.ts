import { createAmbience, type Ambience } from './ambience';
import { ambienceLevel, type Listening } from './ambienceLevel';
import { createNarrator, type Narrator } from './narrator';
import { SOUND_CHANNELS, heardLevel, loadSoundSettings, saveSoundSettings, setLevel, toggleMuted, type SettingsStore, type SoundChannel } from './soundSettings';

/**
 * Everything the scene sounds like, behind one set of controls: the voice of the figure, the sound of the room,
 * the switch that turns both off and a level for everything together, for voices and for the room. Sound starts
 * with the first thing the player presses, as browsers require, stops while the page is in the background, and
 * the player's choices are remembered.
 */
export interface SoundStage {
  narrator: Narrator;
  /** Sets how loud the room is for where the player stands; call it every frame. */
  update(listening: Omit<Listening, 'speaking'>): void;
  dispose(): void;
}

const LABELS = { on: 'Ses: açık  ·  M', off: 'Ses: kapalı  ·  M', levels: 'Ses ayarları', levelsTitle: 'Ses düzeyleri' } as const;
/** How each level is named to the player; a new channel does not compile until it is named here. */
const CHANNEL_LABELS: Readonly<Record<SoundChannel, string>> = { master: 'Ana ses', voice: 'Konuşma', ambience: 'Ortam' };
const NO_VOICE_NOTE = 'Bu cihazda Türkçe ses bulunamadı; anlatım yazıyla sürüyor.';
const MUTE_KEY = 'KeyM';
/** How quickly the level of the room follows the player and the sliders, as a time constant in seconds. */
const LEVEL_GLIDE = 0.4;
/** How often the pops of the fire are scheduled ahead, in milliseconds. */
const CRACKLE_EVERY_MS = 250;
/** The sliders move in steps of one hundredth and show whole per cent. */
const SLIDER_STEPS = 100;

/** The browser's storage, or nothing where it may not be used (a private window, a blocked site). */
function settingsStore(): SettingsStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, testId: string, text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  node.dataset.testid = testId;
  node.textContent = text;
  return node;
}

interface LevelSlider {
  row: HTMLElement;
  show(level: number): void;
}

function createSlider(channel: SoundChannel, onChange: (level: number) => void): LevelSlider {
  const row = element('label', 'sound-level', `volume-row-${channel}`);
  const name = element('span', 'sound-level__name', `volume-name-${channel}`, CHANNEL_LABELS[channel]);
  const input = element('input', 'sound-level__slider', `volume-${channel}`);
  input.type = 'range';
  input.min = '0';
  input.max = String(SLIDER_STEPS);
  input.step = '1';
  const value = element('output', 'sound-level__value', `volume-value-${channel}`);
  input.addEventListener('input', () => onChange(Number(input.value) / SLIDER_STEPS));
  row.append(name, input, value);
  return {
    row,
    show(level) {
      const shown = Math.round(level * SLIDER_STEPS);
      input.value = String(shown);
      value.textContent = `%${shown}`;
    },
  };
}

export function createSoundStage(root: HTMLElement): SoundStage {
  const store = settingsStore();
  let settings = loadSoundSettings(store);
  let context: AudioContext | null = null;
  let ambience: Ambience | null = null;
  let room: GainNode | null = null;
  let crackling: number | null = null;

  const controls = element('div', 'sound-controls', 'sound-controls');
  const mute = element('button', 'sound-toggle', 'sound-toggle');
  mute.type = 'button';
  const open = element('button', 'sound-toggle sound-toggle--levels', 'sound-levels-toggle', LABELS.levels);
  open.type = 'button';
  open.setAttribute('aria-expanded', 'false');
  const panel = element('section', 'sound-panel', 'sound-panel');
  panel.hidden = true;
  panel.setAttribute('aria-label', LABELS.levelsTitle);
  const note = element('p', 'sound-note', 'voice-note', NO_VOICE_NOTE);
  note.hidden = true;
  controls.append(mute, open, panel, note);
  root.append(controls);

  const narrator = createNarrator({
    volume: () => heardLevel(settings, 'voice'),
    onVoiceMissing: (missing) => {
      note.hidden = !missing;
    },
  });

  const sliders = SOUND_CHANNELS.map((channel) => {
    const slider = createSlider(channel, (level) => apply(setLevel(settings, channel, level)));
    panel.append(slider.row);
    return { channel, slider };
  });

  function show(): void {
    mute.textContent = settings.muted ? LABELS.off : LABELS.on;
    mute.dataset.muted = String(settings.muted);
    mute.setAttribute('aria-pressed', String(!settings.muted));
    for (const { channel, slider } of sliders) slider.show(settings[channel]);
  }

  /** Starts the sound of the room. Browsers allow this only once the player has pressed something. */
  function wake(): void {
    if (context || heardLevel(settings, 'ambience') <= 0) return;
    context = new AudioContext();
    ambience = createAmbience(context);
    room = context.createGain();
    room.gain.value = 0;
    ambience.output.connect(room).connect(context.destination);
    const playing = ambience;
    crackling = window.setInterval(() => playing.crackle(), CRACKLE_EVERY_MS);
  }

  function sleep(): void {
    if (crackling !== null) window.clearInterval(crackling);
    crackling = null;
    ambience?.stop();
    ambience = null;
    room = null;
    void context?.close();
    context = null;
  }

  /** Takes new settings: keeps them, shows them, and silences or starts what they say should be silent or sound. */
  function apply(next: typeof settings): void {
    settings = next;
    saveSoundSettings(store, settings);
    show();
    // A voice already speaking keeps the level it started with; with no level left for voices it stops at once.
    if (heardLevel(settings, 'voice') <= 0) narrator.hush();
    if (heardLevel(settings, 'ambience') <= 0) sleep();
    else wake();
  }

  const onMute = (): void => apply(toggleMuted(settings));
  const onOpen = (): void => {
    panel.hidden = !panel.hidden;
    open.setAttribute('aria-expanded', String(!panel.hidden));
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.code === MUTE_KEY) onMute();
    else wake();
  };
  const onPointer = (): void => wake();
  // A page in the background is silent: nothing speaks and nothing burns for a player who is not there.
  const onVisibility = (): void => {
    if (document.hidden) {
      narrator.hush();
      void context?.suspend();
    } else void context?.resume();
  };

  mute.addEventListener('click', onMute);
  open.addEventListener('click', onOpen);
  window.addEventListener('keydown', onKey);
  window.addEventListener('pointerdown', onPointer);
  document.addEventListener('visibilitychange', onVisibility);
  show();

  return {
    narrator,
    update(listening) {
      if (!context || !room) return;
      const level = ambienceLevel({ ...listening, speaking: narrator.isSpeaking() }) * heardLevel(settings, 'ambience');
      room.gain.setTargetAtTime(level, context.currentTime, LEVEL_GLIDE);
    },
    dispose() {
      mute.removeEventListener('click', onMute);
      open.removeEventListener('click', onOpen);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      narrator.dispose();
      sleep();
      controls.remove();
    },
  };
}
