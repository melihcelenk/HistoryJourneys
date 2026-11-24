import type { FigureKind } from '../domain/types';

/**
 * Original heraldic emblems, one per kind of figure, drawn on a 24x24 grid.
 * They are plain SVG path data so that both React components and map markers
 * (which are plain DOM) can use them.
 */
const EMBLEM_PATHS: Record<FigureKind, string> = {
  // Crown
  sultan: 'M3 18h18v2H3zM3 16l1.5-9 4 4L12 5l3.5 6 4-4L21 16z',
  // Star within a crescent
  leader:
    'M11 3a9 9 0 1 0 9.3 11.4A7.2 7.2 0 1 1 11 3zm6 4 .9 2.6h2.8l-2.2 1.7.8 2.7-2.3-1.6-2.3 1.6.8-2.7-2.2-1.7h2.8z',
  // Scroll with a seal
  statesman: 'M6 3h11a2 2 0 0 1 2 2v9h-2V5H8v13a3 3 0 0 1-6 0V16h4zm4 4h5v2h-5zm0 4h5v2h-5zm7 6a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
  // Crossed swords
  soldier:
    'M4 3l9.5 9.5-1.5 1.5L2.5 4.5zm16 0L10.5 12.5 12 14 21.500 4.500zM5 15l2 2-2.500 2.500 1 1L3.500 22.500l-2-2 2-2zm14 0 1.500 3.500 2 2-2 2-2-2-1-1L15 19z',
  // Open book
  scholar: 'M2 5c3-1.500 6-1.500 9 0v15c-3-1.500-6-1.500-9 0zm11 0c3-1.500 6-1.500 9 0v15c-3-1.500-6-1.500-9 0z',
  // Dome with a finial
  artist: 'M11 2h2v3.100A8 8 0 0 1 20 13v1H4v-1a8 8 0 0 1 7-7.900zM3 16h18v2H3zm2 3h14v3H5z',
  // Tulip
  royal: 'M12 2c2 2.500 3 4.500 3 6.500 1.500-1 2.500-2.500 3-4.500 1 5-1 9-5 10.500V22h-2v-7.500C7 13 5 9 6 4c.500 2 1.500 3.500 3 4.500C9 6.500 10 4.500 12 2z',
};

export function emblemPath(kind: FigureKind): string {
  return EMBLEM_PATHS[kind];
}

/** The emblem as an SVG string, for markers built outside React. */
export function emblemSvg(kind: FigureKind): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="${EMBLEM_PATHS[kind]}"/></svg>`;
}
