import { emblemSvg } from '../ui/emblems';
import { portraitSrc } from '../ui/portraits';
import type { CityMarker, FigureMarker, StopMarker } from './MapView';

/**
 * Plain DOM elements for map markers. They are created outside React because
 * the map libraries own these nodes; their look lives in ui/theme/map.css.
 */

function element(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Stacking order of the marker kinds: figures stand above stops, stops above city labels. */
export const MARKER_LAYERS = { city: 1, stop: 2, figure: 3 } as const;

/**
 * Wraps a marker in a zero-sized anchor. The map renderer moves the anchor to
 * the place on the map; the marker positions itself around it with CSS, so
 * both renderers show markers the same way.
 */
export function createAnchor(marker: HTMLElement, layer: number): HTMLElement {
  const anchor = element('div', 'map-anchor');
  anchor.style.zIndex = String(layer);
  anchor.append(marker);
  return anchor;
}

/** The marker inside an anchor created by createAnchor. */
export function markerOf(anchor: HTMLElement): HTMLElement | null {
  return anchor.firstElementChild instanceof HTMLElement ? anchor.firstElementChild : null;
}

/** City labels have this many sizes in ui/theme/map.css (data-rank 1 to 3); less visited cities share the smallest. */
const MAX_STYLED_RANK = 3;

export function createCityElement(city: CityMarker): HTMLElement {
  const root = element('div', 'map-city');
  updateCityElement(root, city);
  root.append(element('span', 'map-city__dot'), element('span', 'map-city__name', city.name));
  return root;
}

/** A city keeps its marker while its label size changes with how many other labels are shown. */
export function updateCityElement(root: HTMLElement, city: CityMarker): void {
  root.dataset.rank = String(Math.min(city.rank, MAX_STYLED_RANK));
}

export function updateStopElement(root: HTMLElement, stop: StopMarker): void {
  root.dataset.kind = stop.order === null ? 'place' : 'journey';
  root.dataset.reached = String(stop.reached);
  root.dataset.current = String(stop.current);
  root.dataset.crowded = String(stop.crowded);
}

/** The numbered pin of a journey stop: a button that goes to the stop. */
function createStopPin(stop: StopMarker, target: NonNullable<StopMarker['target']>, onClick: StopClickHandler): HTMLElement {
  const pin = element('button', 'map-stop__pin', String(stop.order));
  pin.setAttribute('type', 'button');
  pin.setAttribute('aria-label', `${stop.order}. durak: ${stop.name}, ${stop.years}. ${stop.event}`);
  pin.addEventListener('click', (event) => {
    event.stopPropagation();
    onClick(target.figure, target.stopIndex);
  });
  return pin;
}

/** The small card of a journey stop, shown while the pointer or the keyboard focus is on its pin. */
function createStopCard(stop: StopMarker): HTMLElement {
  const card = element('span', 'map-stop__card');
  const place = stop.historicName && stop.historicName !== stop.name ? `${stop.name} (${stop.historicName})` : stop.name;
  card.append(
    element('span', 'map-stop__card-title', `${stop.order}. ${place}`),
    element('span', 'map-stop__card-years', stop.years),
    element('span', 'map-stop__card-text', stop.event),
  );
  return card;
}

export type StopClickHandler = (figure: string, stopIndex: number) => void;

export function createStopElement(stop: StopMarker, onClick: StopClickHandler): HTMLElement {
  const root = element('div', 'map-stop');
  const label = element('span', 'map-stop__label');
  label.append(element('span', 'map-stop__name', stop.name), element('span', 'map-stop__years', stop.years));
  if (stop.target) root.append(createStopCard(stop), createStopPin(stop, stop.target, onClick), label);
  else root.append(element('span', 'map-stop__pin'), label);
  updateStopElement(root, stop);
  return root;
}

/** Horizontal distance in pixels between figures standing at the same place. */
const STACK_OFFSET_PX = 34;

export function updateFigureElement(root: HTMLElement, figure: FigureMarker): void {
  root.dataset.focused = String(figure.focused);
  root.style.setProperty('--stack-offset', `${figure.stackIndex * STACK_OFFSET_PX}px`);
}

/** The banner of a figure without a portrait: the emblem of its kind on a pennant. */
function createBanner(figure: FigureMarker): HTMLElement {
  const banner = element('span', 'map-figure__banner');
  // emblemSvg returns fixed markup from a table in the code; no content text reaches innerHTML.
  banner.innerHTML = emblemSvg(figure.kind);
  return banner;
}

/** The head of a figure with a portrait: the picture in a gold ring. A picture that cannot be loaded gives way to the banner. */
function createPortraitHead(figure: FigureMarker): HTMLElement {
  const head = element('span', 'map-figure__portrait');
  const image = document.createElement('img');
  image.alt = '';
  image.decoding = 'async';
  image.addEventListener('error', () => head.replaceWith(createBanner(figure)), { once: true });
  image.src = portraitSrc(figure.slug);
  head.append(image);
  return head;
}

export function createFigureElement(figure: FigureMarker, onClick: (slug: string) => void): HTMLElement {
  const root = element('button', 'map-figure');
  root.setAttribute('type', 'button');
  root.setAttribute('aria-label', `${figure.name} kartını aç`);
  root.dataset.slug = figure.slug;
  root.append(figure.portrait ? createPortraitHead(figure) : createBanner(figure), element('span', 'map-figure__pole'), element('span', 'map-figure__name', figure.name));
  root.addEventListener('click', (event) => {
    event.stopPropagation();
    onClick(figure.slug);
  });
  updateFigureElement(root, figure);
  return root;
}
