/**
 * The 3D scenes of the game: which figure has one and on which page it opens. A figure gets the link to its
 * scene on its card by being listed here.
 */
const SCENE_PAGES: Readonly<Record<string, string>> = {
  'mehmed-ii': 'sahne.html',
};

/** The page of the 3D scene of a figure, or null when the figure has none. */
export function scenePageOf(slug: string): string | null {
  return Object.hasOwn(SCENE_PAGES, slug) ? (SCENE_PAGES[slug] ?? null) : null;
}
