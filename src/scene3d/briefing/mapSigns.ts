import { arcPoints, ink, wash, type Pen, type Stroke } from './inkPen';
import type { PlaceKind } from './mapDefinition';

/**
 * The signs of the places on a chart, each a small drawing in ink as the chart makers drew them: a castle, a
 * city, a camp, a gun, ships. They are drawn around the origin, about sixty units wide, in the colour of the pen.
 */
export interface SignColours {
  /** Washes laid inside the drawings: stone, roofs and cloth, and the dark of iron. */
  stone: string;
  roof: string;
  cloth: string;
  iron: string;
}

const GROUND = 10;

function tower(pen: Pen, x: number, width: number, height: number, colours: SignColours): void {
  const half = width / 2;
  const top = GROUND - height;
  const body: Stroke = [
    [x - half * 1.1, GROUND],
    [x - half, top],
    [x + half, top],
    [x + half * 1.1, GROUND],
  ];
  wash(pen, body, colours.stone);
  ink(pen, body);
  // Battlements: three merlons along the top.
  for (const dx of [-half, -half / 4, half / 2]) {
    ink(pen, [
      [x + dx, top],
      [x + dx, top - 4],
      [x + dx + half / 2, top - 4],
      [x + dx + half / 2, top],
    ]);
  }
}

/** A castle on the strait: a tall tower with a pennant and a lower one, on one line of ground. */
function fort(pen: Pen, colours: SignColours): void {
  tower(pen, -7, 11, 26, colours);
  tower(pen, 10, 9, 17, colours);
  ink(pen, [
    [-18, GROUND],
    [18, GROUND],
  ]);
  ink(pen, [
    [-7, -20],
    [-7, -30],
    [1, -27],
    [-7, -24],
  ]);
}

/** The city: its walls with a gate, and above them the great dome with its half-domes and a minaret. */
function city(pen: Pen, colours: SignColours): void {
  const dome = arcPoints([0, -6], [15, 16], Math.PI, Math.PI * 2, 10);
  wash(pen, dome, colours.roof);
  ink(pen, dome);
  ink(pen, arcPoints([-17, -5], [8, 9], Math.PI, Math.PI * 1.75, 5));
  ink(pen, arcPoints([17, -5], [8, 9], Math.PI * 1.25, Math.PI * 2, 5));
  ink(pen, [
    [0, -22],
    [0, -29],
  ]);
  ink(pen, [
    [26, GROUND],
    [26, -24],
    [28, -30],
    [30, -24],
    [30, GROUND],
  ]);
  ink(pen, [
    [-30, GROUND],
    [-30, -5],
    [34, -5],
    [34, GROUND],
  ]);
  ink(pen, [
    [-30, GROUND],
    [34, GROUND],
  ]);
  ink(pen, [[-4, GROUND], ...arcPoints([0, 2], [4, 5], Math.PI, Math.PI * 2, 4), [4, GROUND]]);
}

/** The camp of the army: three tents, the middle one the largest, each with its pole and pennant. */
function camp(pen: Pen, colours: SignColours): void {
  for (const [dx, size] of [
    [-24, 0.8],
    [0, 1.1],
    [24, 0.8],
  ] as const) {
    const tent: Stroke = [
      [dx - 13 * size, GROUND],
      [dx - 4 * size, -4 * size],
      [dx, -15 * size],
      [dx + 4 * size, -4 * size],
      [dx + 13 * size, GROUND],
    ];
    wash(pen, tent, colours.cloth);
    ink(pen, tent, true);
    ink(pen, [
      [dx, -15 * size],
      [dx, -23 * size],
      [dx + 6 * size, -20 * size],
    ]);
    ink(pen, [
      [dx, -4 * size],
      [dx, GROUND],
    ]);
  }
}

/** The great gun: a long barrel, thicker at the breech, lying on a carriage with two wheels. */
function cannon(pen: Pen, colours: SignColours): void {
  const barrel: Stroke = [
    [-20, -3],
    [16, -9],
    [18, -3],
    [-18, 5],
  ];
  wash(pen, barrel, colours.iron);
  ink(pen, barrel, true);
  ink(pen, [
    [-9, -5],
    [-7, 3],
  ]);
  for (const cx of [-10, 6]) {
    ink(pen, arcPoints([cx, 9], [7, 7], 0, Math.PI * 2, 10));
    ink(pen, [
      [cx - 5, 9],
      [cx + 5, 9],
    ]);
    ink(pen, [
      [cx, 4],
      [cx, 14],
    ]);
  }
}

/** Ships: three galleys, each a curved hull with a mast, a lateen sail and oars. */
function fleet(pen: Pen, colours: SignColours): void {
  for (const [dx, dy] of [
    [-22, 7],
    [0, -7],
    [22, 7],
  ] as const) {
    ink(pen, [
      [dx - 13, dy - 2],
      [dx - 8, dy + 5],
      [dx + 8, dy + 5],
      [dx + 14, dy - 4],
      [dx - 13, dy - 2],
    ]);
    const sail: Stroke = [
      [dx, dy - 3],
      [dx - 1, dy - 19],
      [dx + 11, dy - 7],
    ];
    wash(pen, sail, colours.stone);
    ink(pen, sail, true);
    for (const oar of [-6, 0, 6]) {
      ink(pen, [
        [dx + oar, dy + 5],
        [dx + oar - 2, dy + 10],
      ]);
    }
  }
}

/** Every kind of place has its sign; a new kind does not compile until it is drawn here. */
export const PLACE_SIGNS: Readonly<Record<PlaceKind, (pen: Pen, colours: SignColours) => void>> = { fort, city, camp, cannon, fleet };
