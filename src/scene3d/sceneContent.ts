import figure from '../../content/figures/mehmed-ii.json';
import rawBriefing from '../../content/scenes/mehmed-ii.json';
import { parseBriefing, type Briefing } from './briefing/briefingSchema';
import { CONQUEST_MAP } from './briefing/conquestMap';
import type { MapDefinition } from './briefing/mapDefinition';

/**
 * What this scene shows, gathered from the content of the game: who the figure is, what he tells and the map he
 * tells it on. The rest of the scene works with these values and does not know which figure it is; a scene for
 * another figure is another such record.
 */
export interface SceneContent {
  /** Name of the figure, one line about him and the address of his card in the game. */
  name: string;
  note: string;
  cardHref: string;
  briefing: Briefing;
  map: MapDefinition;
}

/** Reads the content of the scene; throws when the briefing file is not valid. */
export function loadSceneContent(): SceneContent {
  return {
    name: figure.nameTr,
    note: `${figure.birth.year}–${figure.death.year} · saltanatı ${figure.reign.from}–${figure.reign.to}`,
    cardHref: `./#/yol/${figure.slug}`,
    briefing: parseBriefing(rawBriefing),
    map: CONQUEST_MAP,
  };
}
