/**
 * The sound of the room, made in code and not from recordings: the low, soft roar of the fire in the hearth and,
 * now and then, the dull pop of its wood. Built on any audio context, so that it can also be rendered offline and
 * measured.
 *
 * The sound is deliberately plain. An earlier version gated bursts of high, bright noise several times a second;
 * that rang like metal being struck, not like wood. A pop here is a short, low thud that dies away softly, and
 * there are few of them.
 */
export interface Ambience {
  /** Where the sound leaves; connect it to a gain that sets how loud the room is. */
  output: AudioNode;
  /**
   * Schedules the pops of the fire up to a moment of the context's clock, by default a little ahead of now; call
   * it regularly while the sound plays.
   */
  crackle(until?: number): void;
  stop(): void;
}

/** The roar: a long loop of noise (long, so that its repeating is not heard as a rhythm) kept below this pitch. */
const ROAR = { seconds: 11, cutoffHz: 260, level: 0.5, swellHz: 0.13, swellDepth: 0.25 } as const;
/** The pops: how many a second on average, the pitch they are centred on, how long they ring and how loud they may be. */
const POP = { perSecond: 0.55, lowHz: 320, highHz: 900, sharpness: 0.9, attack: 0.006, shortest: 0.07, longest: 0.16, level: 0.22 } as const;
/** How far ahead pops are scheduled, in seconds. */
const AHEAD = 0.8;

/** A repeatable random number in [0, 1): the same fire every time, which also makes its level testable. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** A stretch of "brown" noise: noise that wanders slowly and so sounds like a roar and not like a hiss. */
function brownNoise(context: BaseAudioContext, next: () => number, seconds: number): AudioBuffer {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    last = (last + 0.02 * (next() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  // The end is faded into the beginning, so that the loop closes without a click.
  const fade = Math.floor(context.sampleRate * 0.5);
  for (let i = 0; i < fade; i += 1) {
    const share = i / fade;
    data[length - fade + i] = (data[length - fade + i] as number) * (1 - share) + (data[i] as number) * share;
  }
  return buffer;
}

/** Builds the sound of the room on an audio context. */
export function createAmbience(context: BaseAudioContext): Ambience {
  const next = seededRandom(1453);
  const output = context.createGain();

  const roarSource = context.createBufferSource();
  roarSource.buffer = brownNoise(context, next, ROAR.seconds);
  roarSource.loop = true;
  const roarFilter = context.createBiquadFilter();
  roarFilter.type = 'lowpass';
  roarFilter.frequency.value = ROAR.cutoffHz;
  const roar = context.createGain();
  roar.gain.value = ROAR.level;
  // The fire breathes: its roar swells and sinks slowly.
  const swell = context.createOscillator();
  swell.frequency.value = ROAR.swellHz;
  const swellDepth = context.createGain();
  swellDepth.gain.value = ROAR.level * ROAR.swellDepth;
  swell.connect(swellDepth).connect(roar.gain);
  roarSource.connect(roarFilter).connect(roar).connect(output);
  roarSource.start();
  swell.start();

  const popNoise = brownNoise(context, next, 1);
  let scheduledUntil = context.currentTime;

  /** One pop of the wood: a short stretch of low noise through a narrow filter, struck and left to die away. */
  function pop(at: number): void {
    const source = context.createBufferSource();
    source.buffer = popNoise;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = POP.lowHz + (POP.highHz - POP.lowHz) * next();
    filter.Q.value = POP.sharpness;
    const envelope = context.createGain();
    const rings = POP.shortest + (POP.longest - POP.shortest) * next();
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(POP.level * (0.3 + 0.7 * next() ** 2), at + POP.attack);
    envelope.gain.exponentialRampToValueAtTime(0.0005, at + rings);
    source.connect(filter).connect(envelope).connect(output);
    source.start(at, next() * 0.8, rings + 0.02);
  }

  function crackle(until = context.currentTime + AHEAD): void {
    while (scheduledUntil < until) {
      // The gaps between pops are uneven, as those of burning wood are.
      scheduledUntil += -Math.log(1 - next() * 0.98) / POP.perSecond;
      if (scheduledUntil < until + AHEAD) pop(scheduledUntil);
    }
  }

  function stop(): void {
    roarSource.stop();
    swell.stop();
    output.disconnect();
  }
  return { output, crackle, stop };
}

export interface AmbienceMeasure {
  /** The loudest sample and the mean level, as shares of full scale. */
  peak: number;
  rms: number;
  /** The share of the sound's energy that lies above 2 kHz: high for a hiss or a metallic ring, low for a fire. */
  brightness: number;
}

/** Measures a stretch of the room's sound, for checking that it is neither silent, nor clipped, nor harsh. */
export async function measureAmbience(seconds: number): Promise<AmbienceMeasure> {
  const sampleRate = 22050;
  const render = async (highPassHz: number | null): Promise<Float32Array> => {
    const context = new OfflineAudioContext(1, Math.floor(sampleRate * seconds), sampleRate);
    const ambience = createAmbience(context);
    let tail: AudioNode = ambience.output;
    if (highPassHz !== null) {
      const filter = context.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = highPassHz;
      tail = tail.connect(filter);
    }
    tail.connect(context.destination);
    // Offline there is no clock to wait for: all the pops of the stretch are scheduled at once.
    ambience.crackle(seconds);
    return (await context.startRendering()).getChannelData(0);
  };
  const energy = (data: Float32Array): number => data.reduce((sum, sample) => sum + sample * sample, 0);
  const whole = await render(null);
  const high = await render(2000);
  const peak = whole.reduce((most, sample) => Math.max(most, Math.abs(sample)), 0);
  return { peak, rms: Math.sqrt(energy(whole) / whole.length), brightness: energy(high) / (energy(whole) || 1) };
}
