import * as THREE from 'three';
import { arrowHead, ink, seededRandom, tick, type Pen } from './inkPen';
import { nameIn, type MapDefinition, type MapName, type MapPlace, type MapPoint, type MapRoute, type Script } from './mapDefinition';
import { PLACE_SIGNS, type SignColours } from './mapSigns';

/**
 * Draws a map definition the way sea charts of the fifteenth century were drawn: on a skin of vellum with an
 * uneven edge, with rhumb lines spreading from painted wind roses and coasts drawn as a thin line of red-brown
 * ink. Land and sea are not coloured in; the skin shows through both, as on the charts of Pîrî Reis. Names are
 * written in the script asked for. What the briefing points at is ringed in red ink.
 *
 * The parts of the map are separate only here, where they are drawn. The result is one picture on one sheet: the
 * base of each script is painted once and kept, and the rings are painted over a copy of it when the marks change.
 */
export interface MapBoard {
  texture: THREE.CanvasTexture;
  /**
   * Shows the sheet in a script, with the given places and routes ringed. The whole sheet is one picture; call
   * this only when what it shows changes, because each call sends that picture to the graphics card again.
   */
  show(marks: readonly string[], script: Script): void;
}

const SHEET = { width: 1600, height: 1000 } as const;
const INK = '#2f2014';
const COLOURS = { vellum: '#d6bd86', vellumEdge: '#a8834c', shore: '#b98a3c', coast: '#7a2a18', wall: '#7a1f1a', mark: '#b3261a', city: '#8f1f17', roseGold: '#c9a23e' } as const;
/** The washes inside the signs of the places. */
const SIGN_COLOURS: SignColours = { stone: COLOURS.shore, roof: COLOURS.city, cloth: COLOURS.wall, iron: INK };
/** The points of a wind rose are painted in turn in these colours. */
const ROSE_COLOURS = ['#9c2a1e', '#2f4c7a', '#c9a23e', '#2f4c7a'] as const;
/** The line of a coast: its width, the length of one of its little bays and how far they wander, in pixels. */
const COAST = { width: 5.5, scallop: 30, wobble: 7 } as const;
const FONTS: Readonly<Record<Script, { label: string; title: string }>> = {
  ottoman: { label: "700 64px Amiri, 'Traditional Arabic', serif", title: "700 72px Amiri, 'Traditional Arabic', serif" },
  latin: { label: "italic 48px 'EB Garamond', Georgia, serif", title: "700 40px Cinzel, 'EB Garamond', Georgia, serif" },
};
/** The signs and lines are drawn this much larger than their plain size: the sheet is read from across a table. */
const SIGN_SCALE = 1.7;
/** How far under its sign the name of a place is written, and where the title stands. */
const PLACE_LABEL_DROP = 36;
const TITLE_AT: MapPoint = [0.74, 0.9];
/** How far the edge of the skin wanders from a straight line, in pixels, and how far it stays from the canvas edge. */
const EDGE = { inset: 26, wander: 15, steps: 46 } as const;
/** The winds of the rose and the ring of smaller roses around it, as on portolan charts. */
const WINDS = 16;
const ROSE_RING = 0.4;
/** The shading along the shore: bands of ochre, each a width in pixels and a strength, the widest the faintest. */
const SHORE_BANDS: readonly (readonly [number, number])[] = [
  [120, 0.16],
  [60, 0.24],
  [26, 0.3],
];
/** Smaller wind roses stand on the ring of the large one, at these of its sixteen winds. */
const SMALL_ROSES = [3, 9, 13] as const;
/** Radius of the ring of red ink around a marked place, and how much wider a marked route is drawn. */
const MARK = { ring: 54, routeWiden: 1.7 } as const;

/** Width of the nib for the signs (in the units of a sign) and for the routes (in pixels of the sheet). */
const NIB = { sign: 2.3, route: 5.5 } as const;
/** Routes: the distance between two wavers of the line, and the sizes of towers, links and arrow heads, in pixels. */
const ROUTE = { stride: 34, tower: 11, link: 9, arrow: 30 } as const;

type Context = CanvasRenderingContext2D;
type Pixel = [number, number];

const px = ([x, y]: MapPoint): Pixel => [x * SHEET.width, y * SHEET.height];

const random = seededRandom;

function createCanvas(): { canvas: HTMLCanvasElement; context: Context } {
  const canvas = document.createElement('canvas');
  canvas.width = SHEET.width;
  canvas.height = SHEET.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A 2D canvas is needed to draw the map.');
  return { canvas, context };
}

/** Traces a closed outline through the middles of its sides, so that its corners are rounded as a pen rounds them. */
function traceSmooth(context: Context, points: readonly MapPoint[]): void {
  const at = (index: number): Pixel => px(points[(index + points.length) % points.length] as MapPoint);
  const middle = (a: Pixel, b: Pixel): Pixel => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  context.beginPath();
  context.moveTo(...middle(at(-1), at(0)));
  for (let i = 0; i < points.length; i += 1) {
    const corner = at(i);
    context.quadraticCurveTo(corner[0], corner[1], ...middle(corner, at(i + 1)));
  }
  context.closePath();
}

/** The outline of the skin: a rectangle whose edge wanders, as a cut hide does. */
function skinOutline(): Pixel[] {
  const next = random(41);
  const wander = (): number => (next() - 0.5) * 2 * EDGE.wander;
  const { inset, steps } = EDGE;
  const wide = SHEET.width - 2 * inset;
  const high = SHEET.height - 2 * inset;
  const outline: Pixel[] = [];
  for (let i = 0; i < steps; i += 1) outline.push([inset + (wide * i) / steps, inset + wander()]);
  for (let i = 0; i < steps; i += 1) outline.push([SHEET.width - inset + wander(), inset + (high * i) / steps]);
  for (let i = 0; i < steps; i += 1) outline.push([SHEET.width - inset - (wide * i) / steps, SHEET.height - inset + wander()]);
  for (let i = 0; i < steps; i += 1) outline.push([inset + wander(), SHEET.height - inset - (high * i) / steps]);
  return outline;
}

function paintVellum(context: Context): void {
  context.beginPath();
  skinOutline().forEach(([x, y], index) => (index === 0 ? context.moveTo(x, y) : context.lineTo(x, y)));
  context.closePath();
  // Everything that follows stays on the skin; outside it the canvas is left clear.
  context.clip();
  const tone = context.createRadialGradient(SHEET.width / 2, SHEET.height / 2, SHEET.height * 0.2, SHEET.width / 2, SHEET.height / 2, SHEET.width * 0.62);
  tone.addColorStop(0, COLOURS.vellum);
  tone.addColorStop(1, COLOURS.vellumEdge);
  context.fillStyle = tone;
  context.fillRect(0, 0, SHEET.width, SHEET.height);
  const next = random(23);
  for (let i = 0; i < 70; i += 1) {
    const x = next() * SHEET.width;
    const y = next() * SHEET.height;
    const radius = 30 + next() * 170;
    const stain = context.createRadialGradient(x, y, 0, x, y, radius);
    stain.addColorStop(0, `rgba(110, 72, 30, ${0.04 + next() * 0.07})`);
    stain.addColorStop(1, 'rgba(110, 72, 30, 0)');
    context.fillStyle = stain;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  // Fine grain of the skin.
  context.strokeStyle = 'rgba(95, 65, 30, 0.07)';
  context.lineWidth = 1;
  for (let i = 0; i < 900; i += 1) {
    const x = next() * SHEET.width;
    const y = next() * SHEET.height;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + (next() - 0.5) * 60, y + (next() - 0.5) * 14);
    context.stroke();
  }
}

/**
 * Land and sea share the bare skin, as on the charts of the time: nothing is filled in. Only a faint band of ochre
 * follows the shore on its landward side, the way a chart maker shaded a coast with a dry brush.
 */
function paintShoreShading(context: Context, map: MapDefinition): void {
  for (const outline of map.land) {
    context.save();
    traceSmooth(context, outline);
    context.clip();
    context.strokeStyle = COLOURS.shore;
    context.lineJoin = 'round';
    for (const [width, strength] of SHORE_BANDS) {
      context.globalAlpha = strength;
      context.lineWidth = width;
      traceSmooth(context, outline);
      context.stroke();
    }
    context.restore();
  }
}

/** A wind rose: a ring and a star of sixteen points in the reds, blues and golds of the charts. */
function paintRose(context: Context, cx: number, cy: number, size: number): void {
  context.strokeStyle = INK;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
  context.stroke();
  for (let point = 0; point < 16; point += 1) {
    const angle = (point / 16) * Math.PI * 2;
    const long = size * (point % 4 === 0 ? 1 : point % 2 === 0 ? 0.74 : 0.5);
    context.fillStyle = ROSE_COLOURS[point % ROSE_COLOURS.length] as string;
    context.beginPath();
    context.moveTo(cx + Math.sin(angle) * long, cy - Math.cos(angle) * long);
    context.lineTo(cx + Math.sin(angle + 0.2) * size * 0.3, cy - Math.cos(angle + 0.2) * size * 0.3);
    context.lineTo(cx + Math.sin(angle - 0.2) * size * 0.3, cy - Math.cos(angle - 0.2) * size * 0.3);
    context.closePath();
    context.fill();
    context.stroke();
  }
  context.fillStyle = COLOURS.roseGold;
  context.beginPath();
  context.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

/** The network of rhumb lines: from the wind rose along its sixteen winds, and between the points of a ring around it. */
function paintRhumbLines(context: Context, map: MapDefinition): void {
  const [cx, cy] = px(map.windRose);
  const reach = SHEET.height * ROSE_RING;
  const far = SHEET.width * 2;
  const direction = (index: number): Pixel => [Math.sin((index / WINDS) * Math.PI * 2), -Math.cos((index / WINDS) * Math.PI * 2)];
  const ring = Array.from({ length: WINDS }, (_, index): Pixel => [cx + direction(index)[0] * reach, cy + direction(index)[1] * reach]);
  context.lineWidth = 1.6;
  ring.forEach(([x, y], index) => {
    // The eight winds in black, the half-winds between them in green, as on the charts.
    context.strokeStyle = index % 2 === 0 ? 'rgba(40, 28, 16, 0.42)' : 'rgba(46, 84, 60, 0.4)';
    context.beginPath();
    context.moveTo(cx, cy);
    context.lineTo(cx + direction(index)[0] * far, cy + direction(index)[1] * far);
    context.stroke();
    context.strokeStyle = 'rgba(120, 40, 30, 0.22)';
    for (let other = index + 2; other < WINDS; other += 3) {
      const [ox, oy] = ring[other] as Pixel;
      context.beginPath();
      context.moveTo(x - (ox - x) * 3, y - (oy - y) * 3);
      context.lineTo(ox + (ox - x) * 3, oy + (oy - y) * 3);
      context.stroke();
    }
  });
  for (const wind of SMALL_ROSES) paintRose(context, ...(ring[wind] as Pixel), 30);
  paintRose(context, cx, cy, 66);
}

/**
 * The points of an outline with a small wobble added between them: a coast drawn by hand is never straight, and
 * the charts show it as a line of little bays.
 */
function scalloped(outline: readonly MapPoint[], seed: number): MapPoint[] {
  const next = random(seed);
  const points: MapPoint[] = [];
  outline.forEach((from, index) => {
    const to = outline[(index + 1) % outline.length] as MapPoint;
    const length = Math.hypot((to[0] - from[0]) * SHEET.width, (to[1] - from[1]) * SHEET.height);
    const steps = Math.max(1, Math.round(length / COAST.scallop));
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      const wobbleX = step === 0 ? 0 : ((next() - 0.5) * 2 * COAST.wobble) / SHEET.width;
      const wobbleY = step === 0 ? 0 : ((next() - 0.5) * 2 * COAST.wobble) / SHEET.height;
      points.push([from[0] + (to[0] - from[0]) * t + wobbleX, from[1] + (to[1] - from[1]) * t + wobbleY]);
    }
  });
  return points;
}

function paintCoasts(context: Context, map: MapDefinition): void {
  context.strokeStyle = COLOURS.coast;
  context.lineWidth = COAST.width;
  context.lineJoin = 'round';
  map.land.forEach((outline, index) => {
    traceSmooth(context, scalloped(outline, 90 + index));
    context.stroke();
  });
}

interface Writing {
  at: MapPoint;
  turn?: number;
  drop?: number;
  title?: boolean;
}

function writeName(context: Context, name: MapName, script: Script, writing: Writing): void {
  const [x, y] = px(writing.at);
  const text = nameIn(name, script);
  context.save();
  context.translate(x, y + (writing.drop ?? 0));
  context.rotate(writing.turn ?? 0);
  context.font = writing.title ? FONTS[script].title : FONTS[script].label;
  context.direction = script === 'ottoman' ? 'rtl' : 'ltr';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  // A pale edge around the letters keeps them readable where lines run under them.
  context.lineWidth = 7;
  context.lineJoin = 'round';
  context.strokeStyle = 'rgba(214, 189, 134, 0.9)';
  context.strokeText(text, 0, 0);
  context.fillStyle = INK;
  context.fillText(text, 0, 0);
  context.restore();
}

/** A pen whose hand shakes the same way every time for the same spot, so that the sheet never changes. */
function penAt(context: Context, at: MapPoint, width: number): Pen {
  return { context, next: seededRandom(Math.round(at[0] * 7919 + at[1] * 104729)), width };
}

function paintPlace(context: Context, place: MapPlace): void {
  const [x, y] = px(place.at);
  context.save();
  context.translate(x, y);
  context.scale(SIGN_SCALE, SIGN_SCALE);
  context.strokeStyle = INK;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  PLACE_SIGNS[place.kind](penAt(context, place.at, NIB.sign), SIGN_COLOURS);
  context.restore();
}

function namePlace(context: Context, place: MapPlace, script: Script): void {
  writeName(context, place.label, script, { at: place.at, drop: PLACE_LABEL_DROP * SIGN_SCALE });
}

const ROUTE_COLOURS: Readonly<Record<MapRoute['kind'], string>> = { wall: COLOURS.wall, chain: INK, haul: '#5a3d1e', attack: COLOURS.mark };

/** The points of a route in pixels, with more points put between them so that a long stroke also wavers. */
function routeStroke(route: MapRoute): Pixel[] {
  const stroke: Pixel[] = [];
  route.points.forEach((point, index) => {
    const [x, y] = px(point);
    const before = route.points[index - 1];
    if (before) {
      const [bx, by] = px(before);
      const steps = Math.max(1, Math.round(Math.hypot(x - bx, y - by) / ROUTE.stride));
      for (let step = 1; step < steps; step += 1) stroke.push([bx + ((x - bx) * step) / steps, by + ((y - by) * step) / steps]);
    }
    stroke.push([x, y]);
  });
  return stroke;
}

/** How each kind of route is drawn in ink. */
const ROUTE_PAINTERS: Readonly<Record<MapRoute['kind'], (pen: Pen, stroke: Pixel[]) => void>> = {
  /** A wall: a line with its towers across it. */
  wall(pen, stroke) {
    ink(pen, stroke);
    tick(pen, stroke, ROUTE.tower);
  },
  /** A chain: its links, one beside the other. */
  chain(pen, stroke) {
    tick(pen, stroke, ROUTE.link);
  },
  /** A haul over land: dashes, ending in an arrow. */
  haul(pen, stroke) {
    for (let i = 0; i + 1 < stroke.length; i += 2) ink(pen, [stroke[i] as Pixel, stroke[i + 1] as Pixel]);
    arrowHead(pen, stroke, ROUTE.arrow);
  },
  /** An attack: one bold arrow. */
  attack(pen, stroke) {
    ink(pen, stroke);
    arrowHead(pen, stroke, ROUTE.arrow);
  },
};

function paintRoute(context: Context, route: MapRoute, widen = 1): void {
  context.save();
  context.strokeStyle = ROUTE_COLOURS[route.kind];
  context.lineCap = 'round';
  context.lineJoin = 'round';
  // A marked route is gone over with a wider nib.
  ROUTE_PAINTERS[route.kind](penAt(context, route.points[0] as MapPoint, NIB.route * widen), routeStroke(route));
  context.restore();
}

function paintSheet(map: MapDefinition, script: Script): HTMLCanvasElement {
  const { canvas, context } = createCanvas();
  paintVellum(context);
  paintShoreShading(context, map);
  paintRhumbLines(context, map);
  paintCoasts(context, map);
  for (const caption of map.captions) writeName(context, caption.name, script, { at: caption.at, turn: caption.turn });
  // An attack is part of the telling, not of the land: it is drawn only while it is told.
  for (const route of Object.values(map.routes)) if (route.kind !== 'attack') paintRoute(context, route);
  // Every place has its sign; only the city is always named. The other names appear when the telling comes to
  // them, so that the middle of the sheet, where most of it happens, stays readable.
  for (const place of Object.values(map.places)) {
    paintPlace(context, place);
    if (place.kind === 'city') namePlace(context, place, script);
  }
  writeName(context, map.title, script, { at: TITLE_AT, title: true });
  return canvas;
}

function paintMark(context: Context, map: MapDefinition, id: string, script: Script): void {
  const place = map.places[id];
  if (place) {
    const [x, y] = px(place.at);
    context.strokeStyle = COLOURS.mark;
    context.lineWidth = 10;
    context.beginPath();
    context.arc(x, y, MARK.ring * SIGN_SCALE, 0, Math.PI * 2);
    context.stroke();
    namePlace(context, place, script);
    return;
  }
  const route = map.routes[id];
  if (!route) return;
  paintRoute(context, route, MARK.routeWiden);
  if (route.label && route.labelAt) writeName(context, route.label, script, { at: route.labelAt });
}

/** Waits for the faces the sheet is written in; a canvas drawn before they arrive would use a fallback face. */
async function loadFaces(): Promise<void> {
  const faces = Object.values(FONTS).flatMap((font) => [font.label, font.title]);
  // A face that cannot be loaded is not fatal: the browser then writes in a face of its own.
  await Promise.all(faces.map((face) => document.fonts.load(face, 'قسطنطينيه Kostantiniyye').catch(() => [])));
}

/** Builds the sheets of a map and the texture that shows them. */
export async function createMapBoard(map: MapDefinition): Promise<MapBoard> {
  await loadFaces();
  const sheets = new Map<Script, HTMLCanvasElement>();
  const sheetIn = (script: Script): HTMLCanvasElement => {
    let sheet = sheets.get(script);
    if (!sheet) {
      sheet = paintSheet(map, script);
      sheets.set(script, sheet);
    }
    return sheet;
  };
  const { canvas, context } = createCanvas();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  function show(marks: readonly string[], script: Script): void {
    context.clearRect(0, 0, SHEET.width, SHEET.height);
    context.drawImage(sheetIn(script), 0, 0);
    for (const id of marks) paintMark(context, map, id, script);
    texture.needsUpdate = true;
  }
  return { texture, show };
}
