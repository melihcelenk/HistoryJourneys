import type { FigureSeed } from '../../src/domain/contentSchema';
import type { ContentSeed } from '../../src/data/contentValidation';
import type { FigureCard, FigureSummary, RelationType, World } from '../../src/domain/types';

/** Build time stamp used wherever a test builds a database. */
export const BUILT_AT = '2026-01-01T00:00:00Z';

export const RELATION_TYPES: RelationType[] = [
  { type: 'succeeded', nameTr: 'Taht sırası', weight: 1, mode: 'direct' },
  { type: 'child_of', nameTr: 'Ebeveyn ve çocuk', weight: 1.2, mode: 'direct' },
  { type: 'served_under', nameTr: 'Hizmet', weight: 1.4, mode: 'direct' },
  { type: 'taught', nameTr: 'Hoca ve öğrenci', weight: 1.4, mode: 'direct' },
  { type: 'influenced', nameTr: 'Etki', weight: 1.8, mode: 'influence' },
];

export function figure(slug: string, birthYear: number, deathYear: number, reignFrom?: number): FigureSummary {
  return {
    slug,
    nameTr: slug.toUpperCase(),
    nameEn: slug,
    kind: reignFrom ? 'sultan' : 'statesman',
    roles: ['rol'],
    birthYear,
    birthPlace: 'İstanbul',
    deathYear,
    deathPlace: 'İstanbul',
    reign: reignFrom ? { from: reignFrom, to: deathYear } : undefined,
  };
}

/** A card with nothing on it but the summary data; tests add what they need. */
export function figureCard(summary: FigureSummary, overrides: Partial<FigureCard> = {}): FigureCard {
  return {
    ...summary,
    summary: ['', '', ''],
    actions: [],
    journey: [],
    sources: [],
    generation: { model: '', ruleset: '', date: '', status: 'generated' },
    ...overrides,
  };
}

/**
 * Four rulers in a row (a, b, c, d) and two officials: v served under a and c,
 * w served under b and d; a also influenced d, three generations later. This
 * gives a route of direct relations (a-b-c-d) and a route of influences (a-d).
 */
export function sampleWorld(): World {
  return {
    figures: [
      figure('a', 1400, 1450, 1430),
      figure('b', 1430, 1480, 1450),
      figure('c', 1460, 1510, 1480),
      figure('d', 1490, 1540, 1510),
      figure('v', 1420, 1490),
      figure('w', 1450, 1530),
      figure('lonely', 1500, 1550),
    ],
    relations: [
      { from: 'b', to: 'a', type: 'succeeded', note: 'a → b' },
      { from: 'c', to: 'b', type: 'succeeded', note: 'b → c' },
      { from: 'd', to: 'c', type: 'succeeded', note: 'c → d' },
      { from: 'v', to: 'a', type: 'served_under', note: 'v served a' },
      { from: 'v', to: 'c', type: 'served_under', note: 'v served c' },
      { from: 'w', to: 'b', type: 'served_under', note: 'w served b' },
      { from: 'w', to: 'd', type: 'served_under', note: 'w served d' },
      { from: 'a', to: 'd', type: 'influenced', note: 'a influenced d' },
    ],
    places: [],
    relationTypes: RELATION_TYPES.map((type) => ({ ...type })),
    lines: [{ slug: 'line', nameTr: 'Hat', description: 'Sıra', members: ['a', 'b', 'c', 'd'] }],
  };
}

export function figureSeed(slug: string, overrides: Partial<FigureSeed> = {}): FigureSeed {
  return {
    slug,
    nameTr: `Figür ${slug}`,
    nameEn: `Figure ${slug}`,
    wikiTitleTr: slug,
    kind: 'sultan',
    roles: ['padişah'],
    birth: { year: 1500, place: 'Manisa' },
    death: { year: 1560, place: 'İstanbul' },
    reign: { from: 1530, to: 1560 },
    summary: ['Bir.', 'İki.', 'Üç.'],
    actions: [
      { id: 'ilk', year: 1531, text: 'İlk işi yaptı.', cause: 'İlk neden.', consequence: 'İlk sonuç.', depth: 'Derin not.', sources: ['s1'] },
      { id: 'ikinci', year: 1540, text: 'İkinci işi yaptı.', cause: 'İkinci neden.', consequence: 'İkinci sonuç.', sources: ['s1'] },
    ],
    journey: [
      { place: { slug: 'manisa', nameTr: 'Manisa', lat: 38.61, lon: 27.43 }, precision: 'city', from: 1500, to: 1529, event: 'Doğdu.' },
      { place: { slug: 'istanbul', nameTr: 'İstanbul', historicName: 'Kostantiniyye', lat: 41.01, lon: 28.98 }, precision: 'city', from: 1530, to: 1559, event: 'Tahta çıktı.' },
      { place: { slug: 'edirne', nameTr: 'Edirne', lat: 41.68, lon: 26.56 }, precision: 'city', from: 1560, to: 1560, event: 'Öldü.' },
    ],
    relations: [],
    concepts: [],
    sources: [
      { id: 's1', title: 'Kaynak 1', publisher: 'Yayıncı', url: 'https://example.org/1' },
      { id: 's2', title: 'Kaynak 2', publisher: 'Yayıncı', url: 'https://example.org/2' },
    ],
    generation: { model: 'test', ruleset: '0.0.0', date: '2026-01-01', status: 'generated' },
    ...overrides,
  };
}

export function sampleSeed(): ContentSeed {
  return {
    figures: [
      figureSeed('x', {
        relations: [{ to: 'y', type: 'child_of', note: 'x, y çocuğudur.' }],
        concepts: [{ slug: 'kavram', term: 'Kavram', meaning: 'Anlam', root: { letters: 'k-v-m', language: 'Arapça', meaning: 'kalkmak' }, related: [{ term: 'kıyam', meaning: 'ayağa kalkma' }] }],
        actions: [
          { id: 'ilk', year: 1531, text: 'İlk işi yaptı.', cause: '[[f:y|Y]] yüzünden; [[c:kavram|kavram]].', consequence: 'Sonuç.', sources: ['s1'] },
          { id: 'ikinci', year: 1540, text: 'İkinci işi yaptı.', cause: 'Neden.', consequence: 'Sonuç.', sources: ['s2'] },
        ],
      }),
      figureSeed('y', { birth: { year: 1470, place: 'Amasya' }, death: { year: 1530, place: 'İstanbul' }, reign: { from: 1500, to: 1530 } }),
    ],
    relationTypes: RELATION_TYPES.map((type) => ({ ...type })),
    lines: [{ slug: 'hat', nameTr: 'Hat', description: 'Taht sırası', linkType: 'succeeded', members: ['y', 'x'] }],
  };
}
