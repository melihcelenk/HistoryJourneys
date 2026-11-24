import { useMemo, useState } from 'react';
import { type EndpointSlot, useAppStore } from '../../app/store';
import { formatYearRange } from '../../domain/calendar';
import type { FigureSummary, World } from '../../domain/types';
import { Medallion } from '../Medallion';
import { RouteKindChooser } from '../RouteKindChooser';
import { DialogShell } from './DialogShell';

const TITLES: Record<EndpointSlot, string> = {
  from: 'Başlangıç figürünü seç',
  to: 'Varış figürünü seç',
};

interface FigureGroup {
  key: string;
  name: string;
  note: string;
  figures: FigureSummary[];
}

/** Groups figures by the line they belong to; figures outside every line come last. */
function groupByLine(world: World, matches: (figure: FigureSummary) => boolean): FigureGroup[] {
  const bySlug = new Map(world.figures.map((figure) => [figure.slug, figure]));
  const placed = new Set<string>();
  const groups: FigureGroup[] = world.lines.map((line) => {
    const figures = line.members.flatMap((slug) => {
      const figure = bySlug.get(slug);
      if (!figure || placed.has(slug)) return [];
      placed.add(slug);
      return [figure];
    });
    return { key: line.slug, name: line.nameTr, note: line.description, figures: figures.filter(matches) };
  });
  const others = world.figures.filter((figure) => !placed.has(figure.slug) && matches(figure));
  return [...groups, { key: 'others', name: 'Diğer figürler', note: '', figures: others }].filter(
    (group) => group.figures.length > 0,
  );
}

function normalize(value: string): string {
  return value.toLocaleLowerCase('tr');
}

/** Chooses the start or the destination of a journey, grouped by line. */
export function FigurePickerDialog({ slot }: { slot: EndpointSlot }) {
  const world = useAppStore((state) => state.world);
  const current = useAppStore((state) => state[slot]);
  const other = useAppStore((state) => state[slot === 'from' ? 'to' : 'from']);
  const setEndpoint = useAppStore((state) => state.setEndpoint);
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    if (!world) return [];
    const needle = normalize(query.trim());
    return groupByLine(
      world,
      (figure) =>
        figure.slug !== other &&
        (needle === '' || normalize(figure.nameTr).includes(needle) || normalize(figure.nameEn).includes(needle)),
    );
  }, [world, query, other]);

  return (
    <DialogShell title={TITLES[slot]} wide testId="figure-picker">
      <RouteKindChooser />
      <input
        type="search"
        className="picker__search"
        placeholder="Figür ara…"
        aria-label="Figür ara"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {groups.length === 0 && <p>Bu aramaya uyan figür yok.</p>}
      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="display picker__line">
            {group.name} {group.note && <span className="picker__line-note">· {group.note}</span>}
          </h3>
          <ul className="picker__grid">
            {group.figures.map((figure) => (
              <li key={figure.slug}>
                <button
                  type="button"
                  className="picker__figure"
                  data-testid={`pick-${figure.slug}`}
                  aria-current={figure.slug === current}
                  onClick={() => setEndpoint(slot, figure.slug)}
                >
                  <Medallion kind={figure.kind} />
                  <span>
                    <span className="picker__name">{figure.nameTr}</span>
                    <span className="picker__years">{formatYearRange(figure.birthYear, figure.deathYear)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </DialogShell>
  );
}
