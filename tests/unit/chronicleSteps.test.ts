import { describe, expect, it } from 'vitest';
import { buildChronicle, neighbourEvent } from '../../src/domain/chronicle';
import type { JourneyStop } from '../../src/domain/types';
import { figure, figureCard } from './fixtures';

function stop(slug: string, from: number, to: number): JourneyStop {
  return { place: { slug, nameTr: slug, lat: 40, lon: 30 }, precision: 'city', from, to, event: `${slug} olayı` };
}

const events = buildChronicle([
  figureCard(figure('gezgin', 1800, 1870), { journey: [stop('a', 1800, 1810), stop('b', 1820, 1825), stop('c', 1820, 1830), stop('d', 1850, 1870)] }),
]);
const place = (event: ReturnType<typeof neighbourEvent>) => event?.place.slug ?? null;

describe('stepping through events by hand', () => {
  it('goes to the event after or before the one that is being told', () => {
    expect(place(neighbourEvent(events, events[1]!, 1820, 'next'))).toBe('c');
    expect(place(neighbourEvent(events, events[1]!, 1820, 'previous'))).toBe('a');
  });

  it('tells two events of the same year one after the other', () => {
    expect(place(neighbourEvent(events, events[2]!, 1820, 'previous'))).toBe('b');
    expect(place(neighbourEvent(events, events[2]!, 1820, 'next'))).toBe('d');
  });

  it('starts from the year when nothing is being told', () => {
    expect(place(neighbourEvent(events, null, 1815, 'next'))).toBe('b');
    expect(place(neighbourEvent(events, null, 1815, 'previous'))).toBe('a');
    // An event of the year itself has not been told yet: it comes next, and is not the previous one.
    expect(place(neighbourEvent(events, null, 1850, 'next'))).toBe('d');
    expect(place(neighbourEvent(events, null, 1850, 'previous'))).toBe('c');
  });

  it('has nowhere to go past either end, or without events', () => {
    expect(neighbourEvent(events, events[0]!, 1800, 'previous')).toBeNull();
    expect(neighbourEvent(events, events[3]!, 1850, 'next')).toBeNull();
    expect(neighbourEvent(events, null, 1790, 'previous')).toBeNull();
    expect(neighbourEvent(events, null, 1860, 'next')).toBeNull();
    expect(neighbourEvent([], null, 1800, 'next')).toBeNull();
  });
});
