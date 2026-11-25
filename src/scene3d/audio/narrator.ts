import { pickVoice, splitSentences } from './voiceChoice';

/**
 * The voice of the figure. A line is spoken from its recording when it has one; otherwise the device reads it
 * with its own Turkish voice (the speech synthesis of the browser), so that no sound file has to be shipped.
 */
export interface Narrator {
  /** Speaks a line, cutting off whatever was being spoken. */
  say(line: SpokenLine): void;
  /** Stops speaking at once. */
  hush(): void;
  isSpeaking(): boolean;
  dispose(): void;
}

export interface SpokenLine {
  text: string;
  /** Path of a recording of the line, if there is one. */
  audio?: string | undefined;
}

export interface NarratorOptions {
  /** How loud voices are played, from 0 (not at all) to 1; asked each time a line is to be spoken. */
  volume(): number;
  /** Called when a line cannot be spoken because the device has no Turkish voice, and when it can again. */
  onVoiceMissing(missing: boolean): void;
}

/**
 * How the device voice is asked to read: clearly lower than its default and a little slower, for a man of about
 * forty who speaks with authority and without haste; not so low that it growls. What that sounds like depends on
 * the voice of the device, and some voices do not follow the pitch they are asked for at all.
 */
const DELIVERY = { lang: 'tr-TR', rate: 0.88, pitch: 0.55 } as const;

/**
 * Review aid: `?pitch=0.6&rate=0.9` in the address try another delivery without changing the code, because the
 * right one can only be found by ear.
 */
function delivery(): { rate: number; pitch: number } {
  const params = new URLSearchParams(window.location.search);
  const read = (name: 'rate' | 'pitch'): number => {
    const value = Number(params.get(name));
    return params.has(name) && Number.isFinite(value) && value > 0 && value <= 2 ? value : DELIVERY[name];
  };
  return { rate: read('rate'), pitch: read('pitch') };
}

function synthesis(): SpeechSynthesis | null {
  return 'speechSynthesis' in window ? window.speechSynthesis : null;
}

export function createNarrator(options: NarratorOptions): Narrator {
  const speech = synthesis();
  const { rate, pitch } = delivery();
  let recording: HTMLAudioElement | null = null;
  /** Sentences handed to the device and not yet finished. */
  let pending = 0;
  /** Raised by every new line and every hush, so that the sentences of an abandoned line stop counting. */
  let turn = 0;

  function hush(): void {
    turn += 1;
    pending = 0;
    speech?.cancel();
    recording?.pause();
    recording = null;
  }

  function read(text: string, volume: number): void {
    const voice = speech ? pickVoice(speech.getVoices()) : null;
    options.onVoiceMissing(voice === null);
    if (!speech || !voice) return;
    const mine = turn;
    const done = (): void => {
      if (mine === turn) pending = Math.max(0, pending - 1);
    };
    for (const sentence of splitSentences(text)) {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.voice = voice;
      utterance.lang = DELIVERY.lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      utterance.onend = done;
      utterance.onerror = done;
      pending += 1;
      speech.speak(utterance);
    }
  }

  function play(line: SpokenLine, url: string, volume: number): void {
    const mine = turn;
    const audio = new Audio(url);
    audio.volume = volume;
    recording = audio;
    pending = 1;
    const done = (): void => {
      if (mine === turn) pending = 0;
    };
    audio.addEventListener('ended', done);
    // A recording that cannot be played (missing file, refused by the browser) is read by the device instead.
    audio.play().catch(() => {
      if (mine !== turn) return;
      pending = 0;
      recording = null;
      read(line.text, volume);
    });
  }

  function say(line: SpokenLine): void {
    hush();
    const volume = options.volume();
    if (volume <= 0) return;
    if (line.audio) play(line, line.audio, volume);
    else read(line.text, volume);
  }

  // Some browsers hand over their list of voices late; asking once wakes it.
  speech?.getVoices();

  return { say, hush, isSpeaking: () => pending > 0, dispose: hush };
}
