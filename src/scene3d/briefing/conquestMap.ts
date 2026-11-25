import type { MapDefinition } from './mapDefinition';

/**
 * Constantinople and the Bosphorus in 1453, sketched for the briefing of Mehmed II: the city on its peninsula
 * between the Golden Horn and the Sea of Marmara, the land walls across its neck, Galata beyond the Horn, the
 * Bosphorus running north to the two castles. Shapes and distances are schematic. Every name is written twice:
 * in the Arabic letters of Ottoman Turkish, as a chart of the time would carry it, and in Latin letters.
 */
export const CONQUEST_MAP: MapDefinition = {
  // The Ottoman sheet is dated by the Hijri calendar: 857 is the year of the conquest.
  title: { latin: 'Kostantiniyye, 1453', ottoman: 'قسطنطينيه ٨٥٧' },
  windRose: [0.6, 0.78],
  land: [
    // The European shore as one piece of land: Galata and the Bosphorus coast in the north, the Golden Horn cutting
    // in from the east to its head, then the peninsula of the city and the coast of Thrace on the Marmara.
    [
      [0, 0],
      [0.62, 0],
      [0.7, 0.08],
      [0.69, 0.2],
      [0.66, 0.32],
      [0.63, 0.42],
      [0.56, 0.42],
      [0.46, 0.38],
      [0.38, 0.35],
      [0.31, 0.315],
      [0.36, 0.42],
      [0.5, 0.45],
      [0.62, 0.5],
      [0.56, 0.66],
      [0.45, 0.76],
      [0.33, 0.8],
      [0.2, 0.88],
      [0, 0.92],
    ],
    // The Asian shore.
    [
      [0.8, 0],
      [1, 0],
      [1, 0.95],
      [0.88, 0.8],
      [0.8, 0.62],
      [0.76, 0.5],
      [0.78, 0.36],
      [0.83, 0.2],
      [0.82, 0.08],
    ],
  ],
  captions: [
    { at: [0.74, 0.3], name: { latin: 'Boğaz', ottoman: 'بوغاز' }, turn: -1.35 },
    { at: [0.44, 0.415], name: { latin: 'Haliç', ottoman: 'خليج' }, turn: 0.22 },
    { at: [0.72, 0.66], name: { latin: 'Marmara', ottoman: 'مرمره' } },
    { at: [0.12, 0.5], name: { latin: 'Rumeli', ottoman: 'روم ايلى' } },
    { at: [0.91, 0.45], name: { latin: 'Anadolu', ottoman: 'اناطولى' }, turn: -1.45 },
    { at: [0.52, 0.34], name: { latin: 'Galata', ottoman: 'غلطه' } },
  ],
  places: {
    'rumeli-hisari': { at: [0.69, 0.11], label: { latin: 'Rumeli Hisarı', ottoman: 'روم ايلى حصارى' }, kind: 'fort' },
    'anadolu-hisari': { at: [0.83, 0.13], label: { latin: 'Anadolu Hisarı', ottoman: 'اناطولى حصارى' }, kind: 'fort' },
    city: { at: [0.48, 0.58], label: { latin: 'Kostantiniyye', ottoman: 'قسطنطينيه' }, kind: 'city' },
    camp: { at: [0.2, 0.6], label: { latin: 'Ordugâh', ottoman: 'اردوگاه' }, kind: 'camp' },
    cannon: { at: [0.295, 0.585], label: { latin: 'Büyük top', ottoman: 'بيوك طوپ' }, kind: 'cannon' },
    'bosphorus-fleet': { at: [0.71, 0.4], label: { latin: 'Donanma', ottoman: 'دوننما' }, kind: 'fleet' },
    'horn-fleet': { at: [0.45, 0.405], label: { latin: 'Haliç’e inen gemiler', ottoman: 'خليجه اينن كميلر' }, kind: 'fleet' },
  },
  routes: {
    'land-walls': {
      kind: 'wall',
      label: { latin: 'Kara surları', ottoman: 'قره سورلرى' },
      labelAt: [0.25, 0.74],
      points: [
        [0.36, 0.42],
        [0.345, 0.55],
        [0.34, 0.68],
        [0.33, 0.8],
      ],
    },
    chain: {
      kind: 'chain',
      label: { latin: 'Zincir', ottoman: 'زنجير' },
      labelAt: [0.7, 0.52],
      points: [
        [0.62, 0.495],
        [0.63, 0.425],
      ],
    },
    overland: {
      kind: 'haul',
      label: { latin: 'Gemilerin karadan yolu', ottoman: 'كميلرڭ قره دن يولى' },
      labelAt: [0.47, 0.2],
      points: [
        [0.66, 0.31],
        [0.61, 0.275],
        [0.54, 0.3],
        [0.5, 0.375],
      ],
    },
    assault: {
      kind: 'attack',
      label: { latin: 'Son hücum', ottoman: 'صوڭ هجوم' },
      labelAt: [0.22, 0.7],
      points: [
        [0.22, 0.6],
        [0.3, 0.6],
        [0.4, 0.6],
      ],
    },
  },
};
