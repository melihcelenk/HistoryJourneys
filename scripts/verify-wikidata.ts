/**
 * Compares the birth and death years in the content files with Wikidata (DR-1).
 * Figures are matched by the title of their Turkish Wikipedia article. The
 * script only reports; it never changes content.
 *
 * Usage: tsx scripts/verify-wikidata.ts
 * Writes the report to tmp/wikidata-report.md and prints a summary.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from './loadContent';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const reportPath = join(root, 'tmp', 'wikidata-report.md');

const API_URL = 'https://www.wikidata.org/w/api.php';
/** Wikidata allows up to 50 titles per request. */
const BATCH_SIZE = 40;
const BIRTH_PROPERTY = 'P569';
const DEATH_PROPERTY = 'P570';
/** Wikidata normally answers within a second; give up rather than wait forever. */
const REQUEST_TIMEOUT_MS = 30_000;
const USER_AGENT = 'HistoryJourneysContentCheck/0.1 (open-source content verification script)';

/** Wikipedia treats underscores as spaces and ignores the case of the first letter; compare titles the same way. */
function normalizeTitle(title: string): string {
  const spaced = title.replaceAll('_', ' ').trim();
  return spaced.charAt(0).toLocaleUpperCase('tr') + spaced.slice(1);
}

interface WikidataEntity {
  id?: string;
  missing?: string;
  sitelinks?: { trwiki?: { title: string } };
  claims?: Record<string, { mainsnak?: { datavalue?: { value?: { time?: string } } } }[]>;
}

/** Years of all the values of a date property; Wikidata may record several competing dates. */
function yearsOf(entity: WikidataEntity, property: string): number[] {
  const years = (entity.claims?.[property] ?? []).flatMap((claim) => {
    const time = claim.mainsnak?.datavalue?.value?.time;
    const match = time ? /^([+-]\d+)-/.exec(time) : null;
    return match?.[1] ? [Number(match[1])] : [];
  });
  return [...new Set(years)];
}

async function fetchEntities(titles: string[]): Promise<Map<string, WikidataEntity>> {
  const params = new URLSearchParams({
    action: 'wbgetentities',
    sites: 'trwiki',
    titles: titles.join('|'),
    props: 'claims|sitelinks',
    sitefilter: 'trwiki',
    format: 'json',
  });
  const response = await fetch(`${API_URL}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Wikidata answered HTTP ${response.status}`);
  const body = (await response.json()) as {
    entities?: Record<string, WikidataEntity>;
    normalized?: { n?: { from: string; to: string } } | { from: string; to: string }[];
    error?: { code?: string; info?: string };
  };
  // Wikidata reports rate limits and bad parameters with HTTP 200 and an error object.
  if (body.error) throw new Error(`Wikidata error ${body.error.code ?? '?'}: ${body.error.info ?? 'no details'}`);
  const byTitle = new Map<string, WikidataEntity>();
  for (const entity of Object.values(body.entities ?? {})) {
    const title = entity.sitelinks?.trwiki?.title;
    if (title) byTitle.set(normalizeTitle(title), entity);
  }
  return byTitle;
}

interface Finding {
  slug: string;
  status: 'match' | 'mismatch' | 'not-found' | 'no-data';
  detail: string;
}

function compare(slug: string, label: string, ours: number, theirs: number[]): Finding | null {
  if (theirs.length === 0 || theirs.includes(ours)) return null;
  return { slug, status: 'mismatch', detail: `${label}: content ${ours}, Wikidata ${theirs.join(' / ')}` };
}

const { seed, errors } = loadContent(join(root, 'content'));
if (errors.length > 0) {
  console.error(`Content files break the schema; fix them before verifying:\n${errors.map((error) => `  - ${error}`).join('\n')}`);
  process.exit(1);
}
const findings: Finding[] = [];

/** Set when Wikidata could not be reached for some figures; the report then says it is incomplete. */
let failure: string | null = null;

for (let start = 0; start < seed.figures.length && failure === null; start += BATCH_SIZE) {
  const batch = seed.figures.slice(start, start + BATCH_SIZE);
  let entities: Map<string, WikidataEntity>;
  try {
    entities = await fetchEntities(batch.map((figure) => figure.wikiTitleTr));
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
    break;
  }
  for (const figure of batch) {
    const entity = entities.get(normalizeTitle(figure.wikiTitleTr));
    if (!entity) {
      findings.push({ slug: figure.slug, status: 'not-found', detail: `no Wikidata item for trwiki title "${figure.wikiTitleTr}"` });
      continue;
    }
    const births = yearsOf(entity, BIRTH_PROPERTY);
    const deaths = yearsOf(entity, DEATH_PROPERTY);
    const problems = [
      compare(figure.slug, 'birth', figure.birth.year, births),
      compare(figure.slug, 'death', figure.death.year, deaths),
    ].filter((finding): finding is Finding => finding !== null);
    if (problems.length > 0) findings.push(...problems);
    else if (births.length === 0 || deaths.length === 0) {
      // Nothing to compare against is not the same as a match.
      findings.push({ slug: figure.slug, status: 'no-data', detail: `Wikidata item ${entity.id ?? '?'} has no birth or death year` });
    } else findings.push({ slug: figure.slug, status: 'match', detail: entity.id ?? '' });
  }
}

const count = (status: Finding['status']): number => findings.filter((finding) => finding.status === status).length;
const lines = [
  '# Wikidata check',
  '',
  `Retrieved: ${new Date().toISOString()} · source: Wikidata (CC0)`,
  ...(failure ? ['', `**Incomplete:** Wikidata could not be queried for every figure (${failure}).`] : []),
  '',
  `- Figures whose years match: ${count('match')}`,
  `- Differences: ${count('mismatch')}`,
  `- Not found: ${count('not-found')}`,
  `- No year in Wikidata to compare with: ${count('no-data')}`,
  '',
  ...findings.filter((finding) => finding.status !== 'match').map((finding) => `- **${finding.slug}** — ${finding.detail}`),
  '',
];
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, lines.join('\n'));
console.log(lines.join('\n'));
if (failure) process.exit(1);
