import { formatYearRange } from '../domain/calendar';
import type { FigureSummary } from '../domain/types';

/**
 * The two lines written under the name of a figure, on its card and on its marker on the map: what the figure
 * was, and when the figure lived and held office.
 */
export function rolesLine(figure: FigureSummary): string {
  return figure.roles.join(' · ');
}

export function lifespan(figure: FigureSummary): string {
  const life = formatYearRange(figure.birthYear, figure.deathYear);
  return figure.reign ? `${life} · görevde ${formatYearRange(figure.reign.from, figure.reign.to)}` : life;
}
