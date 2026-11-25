/** The materials of the room. Each is made once and shared by everything that is built from it. */
import * as THREE from 'three';
import { FURNITURE, WALL_BANDS, type FloorRect } from './layout';
import { PALETTE } from './palette';
import type { ArchShape } from './patterns';
import { buildGlass, buildTracery } from './textures/glass';
import { buildMedallion } from './textures/medallion';
import { CEILING_BORDER_METRES, COFFER_METRES, PANEL_METRES, buildCeilingBorder, buildCoffer, buildRosette, buildStarPanel } from './textures/joinery';
import { createShadeMaterial } from './effects';
import { buildBlueAndWhite, buildBookPages, buildEmbers, buildPatina } from './textures/objects';
import { FLOOR_METRES, buildBrickFloor, buildMarble, buildWood } from './textures/natural';
import { FRIEZE_METRES, HOOD_PAINT_METRES, PLASTER_METRES, SCROLL_BAND_METRES, buildFrieze, buildHoodPaint, buildPlaster, buildScrollBand } from './textures/plaster';
import { FRINGE_METRES, buildBrocade, buildCarpet, buildStripes, buildVelvet, buildWeaveNormal, type CarpetDesign } from './textures/textiles';
import { TILE_BORDER_METRES, TILE_FIELD_METRES, buildTileBorder, buildTileField } from './textures/tiles';
import type { TextureContext, TextureSet } from './textureTools';

export type RoomMaterials = Record<string, THREE.Material>;

interface SurfaceOptions {
  roughness?: number;
  metalness?: number;
  normalScale?: number;
  color?: string;
  envMapIntensity?: number;
}

const HALF_REPEAT = 0.5;

/** Sets how many metres of surface one repeat of the textures covers; texture coordinates are in metres. */
function setMetres(set: TextureSet, width: number, height: number, offsetY = 0): void {
  for (const texture of [set.map, set.normalMap, set.surfaceMap]) {
    if (!texture) continue;
    texture.repeat.set(1 / width, 1 / height);
    texture.offset.set(0, -offsetY / height);
  }
}

/** Shifts every texture of a set by half a repeat, so that a pattern is centred on the surface; colour and relief stay together. */
function centreVertically(set: TextureSet): void {
  for (const texture of [set.map, set.normalMap, set.surfaceMap]) texture?.offset.set(0, HALF_REPEAT);
}

function surface(set: TextureSet, options: SurfaceOptions = {}): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    map: set.map,
    color: options.color ?? '#ffffff',
    roughness: options.roughness ?? 0.85,
    metalness: options.metalness ?? 0,
  });
  if (set.normalMap) {
    material.normalMap = set.normalMap;
    material.normalScale.setScalar(options.normalScale ?? 1);
  }
  if (set.surfaceMap) {
    material.roughnessMap = set.surfaceMap;
    material.metalnessMap = set.surfaceMap;
    material.roughness = 1;
    material.metalness = 1;
  }
  if (options.envMapIntensity !== undefined) material.envMapIntensity = options.envMapIntensity;
  return material;
}

function wallMaterials(context: TextureContext): RoomMaterials {
  const tileField = buildTileField(context);
  setMetres(tileField, TILE_FIELD_METRES.width, TILE_FIELD_METRES.height, WALL_BANDS.plinthTop);
  const tileBorder = buildTileBorder(context);
  setMetres(tileBorder, TILE_BORDER_METRES.width, WALL_BANDS.borderTop - WALL_BANDS.tileTop, WALL_BANDS.tileTop);
  const scrollBand = buildScrollBand(context);
  setMetres(scrollBand, SCROLL_BAND_METRES, WALL_BANDS.scrollTop - WALL_BANDS.borderTop, WALL_BANDS.borderTop);
  const frieze = buildFrieze(context);
  setMetres(frieze, FRIEZE_METRES, WALL_BANDS.friezeTop - WALL_BANDS.friezeBottom, WALL_BANDS.friezeBottom);
  const plaster = buildPlaster(context);
  setMetres(plaster, PLASTER_METRES, PLASTER_METRES);
  const hoodBand = buildFrieze(context);
  setMetres(hoodBand, 1.1, 0.22);
  const hoodPaint = buildHoodPaint(context);
  setMetres(hoodPaint, HOOD_PAINT_METRES, HOOD_PAINT_METRES);
  return {
    hoodBand: surface(hoodBand, { roughness: 0.85 }),
    hoodPlaster: surface(hoodPaint, { roughness: 0.9 }),
    tileField: surface(tileField, { normalScale: 0.9 }),
    tileBorder: surface(tileBorder, { roughness: 0.22 }),
    scrollBand: surface(scrollBand, { roughness: 0.9 }),
    frieze: surface(frieze, { roughness: 0.85 }),
    plaster: surface(plaster, { roughness: 0.93, normalScale: 0.6 }),
    nichePaint: surface(plaster, { roughness: 0.93, normalScale: 0.6, color: '#c9d6d2' }),
    soot: surface(plaster, { roughness: 0.97, color: '#241a15' }),
  };
}

function naturalMaterials(context: TextureContext): RoomMaterials {
  const floor = buildBrickFloor(context);
  setMetres(floor, FLOOR_METRES.width, FLOOR_METRES.height);
  const marble = buildMarble(context);
  setMetres(marble, 1.3, 1.3);
  const walnut = buildWood(context, PALETTE.walnut);
  setMetres(walnut, 0.9, 0.9);
  return {
    floor: surface(floor, { roughness: 0.82, normalScale: 0.8 }),
    marble: surface(marble, { roughness: 0.38 }),
    walnut: surface(walnut, { roughness: 0.58, normalScale: 0.7 }),
    walnutDark: surface(walnut, { roughness: 0.6, normalScale: 0.7, color: '#8a7a70' }),
  };
}

function woodworkMaterials(context: TextureContext): RoomMaterials {
  const starPanel = buildStarPanel(context);
  setMetres(starPanel, PANEL_METRES, PANEL_METRES);
  const coffer = buildCoffer(context);
  setMetres(coffer, COFFER_METRES, COFFER_METRES);
  centreVertically(coffer);
  const ceilingBorder = buildCeilingBorder(context);
  setMetres(ceilingBorder, CEILING_BORDER_METRES.length, CEILING_BORDER_METRES.width);
  centreVertically(ceilingBorder);
  return {
    starPanel: surface(starPanel, { roughness: 0.5, normalScale: 1.1 }),
    coffer: surface(coffer, { roughness: 0.62 }),
    ceilingBorder: surface(ceilingBorder, { roughness: 0.62 }),
    rosette: surface(buildRosette(context), { roughness: 0.55 }),
  };
}

function metalMaterials(context: TextureContext): RoomMaterials {
  const patina = buildPatina(context);
  return {
    charredWood: new THREE.MeshStandardMaterial({ color: '#1c1512', roughness: 0.95, emissive: '#ff4a10', emissiveIntensity: 0.06 }),
    iron: new THREE.MeshStandardMaterial({ color: PALETTE.iron, roughness: 0.62, metalness: 0.75 }),
    brass: surface(patina, { color: PALETTE.brass }),
    gilt: surface(patina, { color: PALETTE.gold }),
  };
}

function windowMaterials(context: TextureContext, upperWindow: ArchShape): RoomMaterials {
  const tracery = new THREE.MeshStandardMaterial({ map: buildTracery(upperWindow, context), alphaTest: 0.5, roughness: 0.9 });
  const glass = new THREE.MeshBasicMaterial({ map: buildGlass(upperWindow, context), toneMapped: false });
  for (const texture of [tracery.map, glass.map]) {
    if (!texture) continue;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
  }
  const medallion = new THREE.MeshStandardMaterial({
    map: buildMedallion(context),
    transparent: true,
    depthWrite: false,
    roughness: 0.85,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  if (medallion.map) {
    medallion.map.wrapS = THREE.ClampToEdgeWrapping;
    medallion.map.wrapT = THREE.ClampToEdgeWrapping;
  }
  return { tracery, glass, medallion, trim: new THREE.MeshStandardMaterial({ color: '#efe9dc', roughness: 0.8 }) };
}

const PILE_METRES = 0.22;

function carpetDesign(rect: FloorRect, borderMetres: number, repeatMetres: number, palette: readonly string[], seed: number): CarpetDesign {
  return { width: rect.sizeX, length: rect.sizeZ - FRINGE_METRES * 2, borderMetres, repeatMetres, palette, seed };
}

function carpetMaterial(rect: FloorRect, design: CarpetDesign, pile: THREE.Texture, context: TextureContext): THREE.MeshStandardMaterial {
  const normalMap = pile.clone();
  normalMap.repeat.set(rect.sizeX / PILE_METRES, rect.sizeZ / PILE_METRES);
  const material = new THREE.MeshStandardMaterial({ map: buildCarpet(design, context), normalMap, roughness: 0.96, alphaTest: 0.5 });
  material.normalScale.setScalar(0.55);
  return material;
}

function textileMaterials(context: TextureContext): RoomMaterials {
  const pile = buildWeaveNormal(context, 48, 1.6, 31);
  const mainPalette = [PALETTE.carpetRed, PALETTE.carpetBlue, PALETTE.carpetYellow, PALETTE.carpetIvory, PALETTE.carpetBrown, '#172447', PALETTE.carpetGreen];
  const entryPalette = [PALETTE.carpetBlue, PALETTE.carpetRed, PALETTE.carpetYellow, PALETTE.carpetIvory, PALETTE.carpetBrown, '#5a1512', '#7a2a1c'];
  const weave = buildWeaveNormal(context, 90, 1.1, 47);
  weave.repeat.set(1 / 0.12, 1 / 0.12);
  const cloth = (set: TextureSet, metres: number, roughness: number): THREE.MeshStandardMaterial => {
    setMetres(set, metres, metres);
    const material = surface(set, { roughness });
    material.normalMap = weave;
    material.normalScale.setScalar(0.5);
    return material;
  };
  return {
    mainCarpet: carpetMaterial(FURNITURE.mainCarpet, carpetDesign(FURNITURE.mainCarpet, 0.36, 0.3, mainPalette, 11), pile, context),
    entryCarpet: carpetMaterial(FURNITURE.entryCarpet, carpetDesign(FURNITURE.entryCarpet, 0.27, 0.42, entryPalette, 23), pile, context),
    velvet: cloth(buildVelvet(context), 0.42, 0.78),
    brocadeBlue: cloth(buildBrocade(context, PALETTE.silkBlue, 201), 0.36, 0.55),
    brocadeGreen: cloth(buildBrocade(context, PALETTE.silkGreen, 202), 0.36, 0.55),
    brocadeGold: cloth(buildBrocade(context, '#b98a2c', 203, PALETTE.velvetCrimson), 0.3, 0.45),
    stripeSilk: cloth(buildStripes(context, ['#7d1220', PALETTE.silkIvory, '#7d1220', PALETTE.silkGreen], 204), 0.5, 0.6),
  };
}

function objectMaterials(context: TextureContext): RoomMaterials {
  const embers = buildEmbers(context);
  for (const texture of [embers.map, embers.glow]) texture.repeat.set(3, 2);
  return {
    ember: new THREE.MeshStandardMaterial({ map: embers.map, roughness: 1, emissive: '#ffffff', emissiveMap: embers.glow, emissiveIntensity: 1.9 }),
    shade: createShadeMaterial(),
    tinted: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }),
    bookPages: surface(buildBookPages(context), { roughness: 0.9 }),
    ceramic: surface(buildBlueAndWhite(context), { roughness: 0.16 }),
  };
}

/** What the materials need to know about the room besides the texture settings. */
export interface MaterialPlan {
  upperWindow: ArchShape;
}

/** Builds every material of the room. */
export function createMaterials(context: TextureContext, plan: MaterialPlan): RoomMaterials {
  return {
    ...wallMaterials(context),
    ...naturalMaterials(context),
    ...woodworkMaterials(context),
    ...metalMaterials(context),
    ...textileMaterials(context),
    ...objectMaterials(context),
    ...windowMaterials(context, plan.upperWindow),
  };
}
