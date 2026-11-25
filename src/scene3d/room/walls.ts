/**
 * The masonry shell of the room: the four walls with their bands of decoration, the reveals of the openings and
 * the back panels of the niches.
 */
import type * as THREE from 'three';
import { GeometryBatch, soupToGeometry, wallMatrix } from './geometryTools';
import { ROOM_SIZE, WALLS, WALL_BANDS, type Opening, type OpeningKind } from './layout';
import { meshOpeningPanel, meshReveal, meshWallFace, type Band } from './wallMesher';

const BANDS: readonly (Band & { material: string })[] = [
  { name: 'plinth', material: 'marble', bottom: 0, top: WALL_BANDS.plinthTop },
  { name: 'tiles', material: 'tileField', bottom: WALL_BANDS.plinthTop, top: WALL_BANDS.tileTop },
  { name: 'border', material: 'tileBorder', bottom: WALL_BANDS.tileTop, top: WALL_BANDS.borderTop },
  { name: 'scroll', material: 'scrollBand', bottom: WALL_BANDS.borderTop, top: WALL_BANDS.scrollTop },
  { name: 'plaster', material: 'plaster', bottom: WALL_BANDS.scrollTop, top: WALL_BANDS.friezeBottom },
  { name: 'frieze', material: 'frieze', bottom: WALL_BANDS.friezeBottom, top: WALL_BANDS.friezeTop },
  { name: 'top', material: 'plaster', bottom: WALL_BANDS.friezeTop, top: ROOM_SIZE.height },
];

/** Material of the sides of an opening, by what the opening is. */
const REVEAL_MATERIAL: Readonly<Record<OpeningKind, string>> = {
  window: 'marble',
  upperWindow: 'plaster',
  niche: 'plaster',
  cupboard: 'walnut',
  door: 'marble',
  hearth: 'soot',
};

/** Material of the panel that closes the back of an opening; openings without an entry stay open. */
const BACK_MATERIAL: Readonly<Partial<Record<OpeningKind, string>>> = {
  niche: 'nichePaint',
  hearth: 'soot',
  cupboard: 'walnutDark',
  door: 'starPanel',
};

function addOpening(batch: GeometryBatch, opening: Opening, wallLength: number, matrix: THREE.Matrix4): void {
  const hasSill = opening.kind !== 'door';
  batch.add(REVEAL_MATERIAL[opening.kind], soupToGeometry(meshReveal(opening, wallLength, hasSill)), matrix);
  const back = BACK_MATERIAL[opening.kind];
  if (back) batch.add(back, soupToGeometry(meshOpeningPanel(opening, wallLength, opening.depth)), matrix);
}

/** Adds the wall faces, the reveals and the niche backs of all four walls to the batch. */
export function addWalls(batch: GeometryBatch): void {
  for (const wall of WALLS) {
    const matrix = wallMatrix(wall);
    const faces = meshWallFace(wall.length, ROOM_SIZE.height, wall.openings, BANDS);
    for (const band of BANDS) {
      const soup = faces.get(band.name);
      if (soup && soup.positions.length > 0) batch.add(band.material, soupToGeometry(soup), matrix);
    }
    for (const opening of wall.openings) addOpening(batch, opening, wall.length, matrix);
  }
}
