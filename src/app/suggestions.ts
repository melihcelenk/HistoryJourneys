/** Journeys offered on the start screen; entries whose figures are missing from the content are skipped. */
export interface SuggestedJourney {
  from: string;
  to: string;
  hint: string;
}

export const SUGGESTED_JOURNEYS: SuggestedJourney[] = [
  { from: 'ataturk', to: 'mehmed-ii', hint: 'Cumhuriyet’ten fethe, beş yüzyıl geriye.' },
  { from: 'mimar-sinan', to: 'ataturk', hint: 'Bir mimardan bir kurucuya, devletin içinden.' },
  { from: 'hurrem-sultan', to: 'kosem-sultan', hint: 'Sarayda sözü geçen iki kadın.' },
  { from: 'aksemseddin', to: 'ibrahim-muteferrika', hint: 'Fethin hocasından matbaanın kurucusuna.' },
];
