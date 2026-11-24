/** Gregorian year of the Hijra, the start of the Hijri calendar. */
const HIJRI_EPOCH_YEAR = 622;
/** 33 lunar Hijri years take about 32 solar years. */
const LUNAR_YEARS = 33;
const SOLAR_YEARS = 32;

/**
 * Approximate Hijri year for a Gregorian year (FR-26). A Hijri year spans parts
 * of two Gregorian years, so this is the Hijri year in which most of the
 * Gregorian year falls; it is meant for display next to the Gregorian year.
 */
export function toHijriYear(gregorianYear: number): number | null {
  if (gregorianYear < HIJRI_EPOCH_YEAR) return null;
  // The calendar starts at year one: there is no Hijri year zero.
  return Math.max(1, Math.round(((gregorianYear - HIJRI_EPOCH_YEAR) * LUNAR_YEARS) / SOLAR_YEARS));
}

/** Formats a year for the timeline, for example "1609 · H. 1018". */
export function formatYearWithHijri(gregorianYear: number): string {
  const hijri = toHijriYear(gregorianYear);
  return hijri === null ? String(gregorianYear) : `${gregorianYear} · H. ${hijri}`;
}

/** Formats a lifespan or reign, for example "1590–1617". */
export function formatYearRange(from: number, to: number): string {
  return from === to ? String(from) : `${from}–${to}`;
}
