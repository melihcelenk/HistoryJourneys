import type { MapKind } from '../app/urlState';

/** How the two maps are named and described to the reader; a new kind of map does not compile until it is named here. */
export const MAP_KIND_LABELS: Record<MapKind, { name: string; note: string }> = {
  pixi: { name: 'Boyalı harita', note: 'Kabartmalı arazi ve bulut gölgeleri; oyun haritası görünümü.' },
  maplibre: { name: 'Sade harita', note: 'Hızlı ve hafif; her cihazda çalışır.' },
};
