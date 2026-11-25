/**
 * Choosing the voice the device reads the narration with, and preparing the text for it. Pure functions on plain
 * data, so that the choice can be tested without a browser.
 */

/** What is known of a voice of the device. */
export interface VoiceInfo {
  name: string;
  /** Language tag as the device gives it: "tr-TR", "tr_TR", "tr"... */
  lang: string;
}

/** The language of the narration. */
const LANGUAGE = 'tr';

/**
 * Names of Turkish voices known to be a man's, as browsers and systems list them. The narrator is a man; a voice
 * of the device says nothing of itself but its name, so the names are what there is to go by. A device with none
 * of these still reads the text, with its first Turkish voice.
 */
const MALE_VOICE_NAMES = ['ahmet', 'tolga', 'cem', 'kerem', 'onur', 'murat'] as const;

function isTurkish(voice: VoiceInfo): boolean {
  return voice.lang.toLowerCase().split(/[-_]/)[0] === LANGUAGE;
}

function isKnownMale(voice: VoiceInfo): boolean {
  const name = voice.name.toLocaleLowerCase('tr');
  return MALE_VOICE_NAMES.some((known) => name.includes(known));
}

/** The voice to read with: a Turkish man's voice if the device has one, else its first Turkish voice, else none. */
export function pickVoice<V extends VoiceInfo>(voices: readonly V[]): V | null {
  const turkish = voices.filter(isTurkish);
  return turkish.find(isKnownMale) ?? turkish[0] ?? null;
}

/** The end of a sentence: its mark, then a space, then a capital letter; a stop after a number is an ordinal or a date. */
const SENTENCE_END = /(?<![0-9])([.!?…])\s+(?=\p{Lu}|[0-9"“'‘])/gu;

/**
 * Cuts a text into its sentences. Some browsers stop reading a long text part of the way through; read sentence
 * by sentence, nothing is lost.
 */
export function splitSentences(text: string): string[] {
  return text
    .replace(SENTENCE_END, '$1\n')
    .split('\n')
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}
