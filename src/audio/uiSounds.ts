/**
 * The sounds of the interface, made in code and not from recordings: the dull tap of a button being pressed and
 * the rustle of a parchment being unrolled. Shared by the map and the 3D scene. Each sound is built on any audio
 * context, so that it can also be rendered offline and measured.
 */
export type UiSound = 'click' | 'parchment';

/** A repeatable random number in [0, 1): the same sound every time, which also makes it testable. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function noise(context: BaseAudioContext, seconds: number, seed: number): AudioBuffer {
  const next = seededRandom(seed);
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * seconds), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = next() * 2 - 1;
  return buffer;
}

/** A tap: a short, low knock, like a finger on wood, with only a trace of noise at its start. */
const CLICK = { seconds: 0.07, fromHz: 210, toHz: 120, level: 0.5, noiseLevel: 0.12, noiseHz: 900 } as const;

function playClick(context: BaseAudioContext, output: AudioNode, at: number): void {
  const tone = context.createOscillator();
  tone.type = 'sine';
  tone.frequency.setValueAtTime(CLICK.fromHz, at);
  tone.frequency.exponentialRampToValueAtTime(CLICK.toHz, at + CLICK.seconds);
  const body = context.createGain();
  body.gain.setValueAtTime(0, at);
  body.gain.linearRampToValueAtTime(CLICK.level, at + 0.003);
  body.gain.exponentialRampToValueAtTime(0.0005, at + CLICK.seconds);
  tone.connect(body).connect(output);
  tone.start(at);
  tone.stop(at + CLICK.seconds + 0.01);

  const touch = context.createBufferSource();
  touch.buffer = noise(context, 0.02, 7);
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = CLICK.noiseHz;
  const edge = context.createGain();
  edge.gain.setValueAtTime(CLICK.noiseLevel, at);
  edge.gain.exponentialRampToValueAtTime(0.0005, at + 0.018);
  touch.connect(filter).connect(edge).connect(output);
  touch.start(at);
}

/**
 * A parchment: a soft rustle in a few uneven strokes, as a stiff sheet makes when it is unrolled. It is kept in
 * the middle of the hearing range and quiet; high, loud noise would hiss.
 */
const PARCHMENT = { seconds: 0.34, strokes: 4, centreHz: 1500, sharpness: 0.6, ceilingHz: 3200, level: 0.2 } as const;

function playParchment(context: BaseAudioContext, output: AudioNode, at: number): void {
  const next = seededRandom(31);
  const source = context.createBufferSource();
  source.buffer = noise(context, PARCHMENT.seconds + 0.05, 19);
  const band = context.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = PARCHMENT.centreHz;
  band.Q.value = PARCHMENT.sharpness;
  const ceiling = context.createBiquadFilter();
  ceiling.type = 'lowpass';
  ceiling.frequency.value = PARCHMENT.ceilingHz;
  const strokes = context.createGain();
  strokes.gain.setValueAtTime(0, at);
  const each = PARCHMENT.seconds / PARCHMENT.strokes;
  for (let stroke = 0; stroke < PARCHMENT.strokes; stroke += 1) {
    const begins = at + stroke * each;
    // Each stroke swells and dies; they grow weaker as the sheet comes to rest.
    const loudness = PARCHMENT.level * (0.45 + 0.55 * next()) * (1 - (0.6 * stroke) / PARCHMENT.strokes);
    strokes.gain.linearRampToValueAtTime(loudness, begins + each * (0.25 + 0.2 * next()));
    strokes.gain.linearRampToValueAtTime(loudness * 0.12, begins + each);
  }
  strokes.gain.linearRampToValueAtTime(0, at + PARCHMENT.seconds + 0.04);
  source.connect(band).connect(ceiling).connect(strokes).connect(output);
  source.start(at);
}

const PLAYERS: Readonly<Record<UiSound, (context: BaseAudioContext, output: AudioNode, at: number) => void>> = { click: playClick, parchment: playParchment };
/** How long each sound lasts, for measuring it. */
const SECONDS: Readonly<Record<UiSound, number>> = { click: CLICK.seconds, parchment: PARCHMENT.seconds };

export interface UiSounds {
  play(sound: UiSound): void;
  dispose(): void;
}

/**
 * The sounds of the interface on a page. Nothing sounds before the player has pressed something, as browsers
 * require; the first press creates what is needed. `level` is asked each time, so that a change of the settings
 * is heard at once.
 */
export function createUiSounds(level: () => number): UiSounds {
  let context: AudioContext | null = null;
  return {
    play(sound) {
      const volume = level();
      if (volume <= 0) return;
      try {
        context ??= new AudioContext();
        if (context.state === 'suspended') void context.resume();
        const output = context.createGain();
        output.gain.value = volume;
        output.connect(context.destination);
        PLAYERS[sound](context, output, context.currentTime);
      } catch {
        // A page without sound (no audio device, a blocked context) stays silent; the interface works without it.
      }
    },
    dispose() {
      void context?.close();
      context = null;
    },
  };
}

export interface UiSoundMeasure {
  /** The loudest sample and the mean level over the length of the sound, as shares of full scale. */
  peak: number;
  rms: number;
  /** For how long the sound is audible, in seconds. */
  seconds: number;
}

/** Renders one sound offline and measures it, for checking that it is audible, not clipped and short. */
export async function measureUiSound(sound: UiSound): Promise<UiSoundMeasure> {
  const sampleRate = 22050;
  const context = new OfflineAudioContext(1, Math.ceil(sampleRate * 1), sampleRate);
  PLAYERS[sound](context, context.destination, 0);
  const data = (await context.startRendering()).getChannelData(0);
  const audible = 0.003;
  let last = 0;
  let peak = 0;
  let squares = 0;
  data.forEach((sample, index) => {
    peak = Math.max(peak, Math.abs(sample));
    squares += sample * sample;
    if (Math.abs(sample) > audible) last = index;
  });
  const length = Math.max(1, Math.ceil(SECONDS[sound] * sampleRate));
  return { peak, rms: Math.sqrt(squares / length), seconds: last / sampleRate };
}

/** What counts as pressing something: a button, a link, a slider, or anything that plays their part. */
const PRESSABLE = 'button, a[href], input[type="range"], [role="button"], [role="tab"]';

/** Plays the tap for every press on a page; the returned function stops it. */
export function tapOnEveryPress(sounds: UiSounds): () => void {
  const onClick = (event: MouseEvent): void => {
    if (event.target instanceof Element && event.target.closest(PRESSABLE)) sounds.play('click');
  };
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}
