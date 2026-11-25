import { describe, expect, it } from 'vitest';
import { createFrameMeter, nextPixelRatio } from '../../src/scene3d/dynamicResolution';
import { beardShape, browShape, smoothstep, type Vec3 } from '../../src/scene3d/figure/hairShape';
import { EYE, EYE_OPENING, FACE_CENTRE_X } from '../../src/scene3d/figure/headMetrics';
import { reshapeFace } from '../../src/scene3d/figure/faceShape';
import { BLINK, MOUTH_REST, lidOpening, mouthOpening } from '../../src/scene3d/figure/idle';
import { jawWeight } from '../../src/scene3d/figure/jaw';
import { ARM, OUTER } from '../../src/scene3d/figure/kaftan';
import { ROOM_SIZE } from '../../src/scene3d/room/layout';
import { traceryHoles } from '../../src/scene3d/room/patterns';
import { DOOR, PLAYER_START, isAtDoor } from '../../src/scene3d/exit';
import { FIGURE_SPOT, SHOTS, isShotName } from '../../src/scene3d/shots';
import { boxAround, isBlocked, walk, type WalkSpace } from '../../src/scene3d/walk';

const FORWARD: Vec3 = [0, 0, 1];

describe('walking on the floor plan', () => {
  const space: WalkSpace = {
    bounds: { minX: -3, maxX: 3, minZ: -4, maxZ: 4 },
    obstacles: [{ minX: -1, maxX: 1, minZ: -1, maxZ: 1 }],
    radius: 0.3,
  };

  it('lets the player take a free step', () => {
    expect(walk({ x: 2, z: 2 }, { x: 0.1, z: -0.2 }, space)).toEqual({ x: 2.1, z: 1.8 });
  });

  it('keeps the player a body width away from the walls', () => {
    const end = walk({ x: 2.6, z: 0 }, { x: 0.5, z: 0 }, space);
    expect(end.x).toBeLessThanOrEqual(space.bounds.maxX - space.radius);
    expect(isBlocked({ x: 2.9, z: 0 }, space)).toBe(true);
    expect(isBlocked({ x: 2.6, z: 0 }, space)).toBe(false);
  });

  it('does not let the player walk into an obstacle', () => {
    const end = walk({ x: 0, z: 1.4 }, { x: 0, z: -0.3 }, space);
    expect(end).toEqual({ x: 0, z: 1.4 });
    expect(isBlocked(end, space)).toBe(false);
  });

  it('slides along an obstacle instead of stopping at it', () => {
    const end = walk({ x: 0, z: 1.4 }, { x: 0.2, z: -0.3 }, space);
    expect(end).toEqual({ x: 0.2, z: 1.4 });
  });

  it('never ends a long walk inside a wall or an obstacle', () => {
    let point = { x: -2.5, z: 3.5 };
    for (let i = 0; i < 400; i += 1) {
      point = walk(point, { x: 0.04 * Math.cos(i * 0.37), z: -0.05 * Math.abs(Math.sin(i * 0.11)) - 0.01 }, space);
      expect(isBlocked(point, space)).toBe(false);
    }
  });

  it('builds a square obstacle around a point', () => {
    expect(boxAround({ x: 1, z: -2 }, 0.5)).toEqual({ minX: 0.5, maxX: 1.5, minZ: -2.5, maxZ: -1.5 });
  });
});

describe('where hair grows on the head', () => {
  const at = (side: number, y: number, z = 2): Vec3 => [FACE_CENTRE_X + side, y, z];

  it('leaves the lips free and covers the chin', () => {
    expect(beardShape(at(0, 0.45), FORWARD).weight).toBe(0);
    expect(beardShape(at(0, -0.2), FORWARD).weight).toBeGreaterThan(0.9);
  });

  // The moustache of the portrait: a thin line on the upper lip, under the hooked nose and never on it, whose
  // ends fall in a curve past the corners of the mouth into the beard. Heights are those of the scan as it was
  // scanned: the growth of the hair is decided there, before the face is reshaped.
  const LIP_Y = 0.75;
  const NOSE_TIP_Y = 1.1;
  const DOWNWARD: Vec3 = [0, -1, 0];

  it('grows a moustache on the upper lip', () => {
    expect(beardShape(at(0.2, LIP_Y), FORWARD).weight).toBeGreaterThan(0.5);
  });

  it('lays the moustache down over the lip, thinner in the groove under the nose', () => {
    const hair = beardShape(at(0.3, LIP_Y), FORWARD);
    expect(hair.direction[1]).toBeLessThan(-0.6);
    expect(Math.abs(hair.direction[0])).toBeLessThan(0.6);
    expect(beardShape(at(0, LIP_Y), FORWARD).weight).toBeLessThan(hair.weight);
    expect(hair.length).toBeLessThan(beardShape(at(0, -0.3), FORWARD).length / 2);
  });

  it('keeps the moustache thin and flat against the lip: it does not stand out in front of the nose', () => {
    const hair = beardShape(at(0.3, LIP_Y), FORWARD);
    expect(hair.length).toBeLessThan(0.07);
    expect(hair.direction[2]).toBeLessThan(0.35);
    // Nothing grows where the nose now is, nor on the underside of the nose.
    expect(beardShape(at(0.2, 0.93), FORWARD).weight).toBe(0);
    expect(beardShape(at(0.1, LIP_Y, 2.5), DOWNWARD).weight).toBe(0);
    // The tip of the nose and its wings: whichever way their skin faces, no hair grows on them.
    for (const side of [0, 0.15, 0.3]) {
      for (const normal of [FORWARD, DOWNWARD, [1, 0, 0] as Vec3]) expect(beardShape(at(side, NOSE_TIP_Y, 2.55), normal).weight, `side ${side}`).toBe(0);
    }
  });

  it('lets the ends of the moustache fall in a curve and join the beard beside the mouth', () => {
    const upperEdge = (side: number): number => {
      for (let y = 1; y > 0.3; y -= 0.005) if (beardShape(at(side, y), FORWARD).weight > 0.5) return y;
      return 0;
    };
    // The line falls towards the corners of the mouth, and faster the further out it gets.
    expect(upperEdge(0.2)).toBeGreaterThan(upperEdge(0.45));
    expect(upperEdge(0.45) - upperEdge(0.7)).toBeGreaterThan(upperEdge(0.2) - upperEdge(0.45));
    // No bare skin between the end of the moustache and the beard: the corner of the mouth is covered.
    for (const y of [0.5, 0.4, 0.3, 0.2]) expect(beardShape(at(0.62, y), FORWARD).weight, `y=${y}`).toBeGreaterThan(0.5);
  });

  it('keeps the cheekbones, the eyes and the forehead free of beard', () => {
    for (const y of [1.3, EYE.y, 2.4]) expect(beardShape(at(0.6, y), FORWARD).weight).toBe(0);
  });

  it('is the same on both sides of the face', () => {
    const left = beardShape(at(0.9, 0.2), FORWARD);
    const right = beardShape(at(-0.9, 0.2), FORWARD);
    expect(left.weight).toBeCloseTo(right.weight, 6);
    expect(left.direction[0]).toBeCloseTo(-right.direction[0], 6);
  });

  it('is longest at the chin and leaves the ear and the back of the head free', () => {
    expect(beardShape(at(0, -0.3), FORWARD).length).toBeGreaterThan(beardShape(at(1.2, 0.6, 1.2), FORWARD).length);
    expect(beardShape(at(1.7, 0.6, 0.2), FORWARD).weight).toBe(0);
    expect(beardShape(at(0.8, 0.2, -1), FORWARD).weight).toBe(0);
  });

  // The line of the beard in the portrait of 1480, read in profile: a narrow sideburn in front of the ear, then
  // an edge that sweeps down and forwards in a curve to the corner of the mouth, leaving the cheek bare.
  it('leaves the cheek bare between the sideburn and the mouth', () => {
    expect(beardShape(at(1.3, 0.95, 1.3), FORWARD).weight).toBe(0);
    expect(beardShape(at(1.3, 1.5, 1.3), FORWARD).weight).toBe(0);
  });

  it('covers the jaw under the bare cheek', () => {
    expect(beardShape(at(1.3, 0.4, 1.3), FORWARD).weight).toBeGreaterThan(0.8);
  });

  it('runs up in front of the ear as a narrow sideburn', () => {
    expect(beardShape(at(1.55, 1.5, 0.72), FORWARD).weight).toBeGreaterThan(0.6);
    expect(beardShape(at(1.5, 1.5, 1.15), FORWARD).weight).toBe(0);
    expect(beardShape(at(1.7, 1.5, 0.3), FORWARD).weight).toBe(0);
  });

  it('lets its edge fall in a curve from the sideburn to the mouth: steeply first, then gently', () => {
    const edge = (z: number): number => {
      for (let y = 2; y > 0; y -= 0.01) if (beardShape(at(1.3, y, z), FORWARD).weight > 0.5) return y;
      return 0;
    };
    const steep = edge(1.0) - edge(1.3);
    const gentle = edge(1.4) - edge(1.7);
    expect(steep).toBeGreaterThan(0.25);
    expect(gentle).toBeGreaterThan(0);
    expect(steep).toBeGreaterThan(gentle * 1.5);
  });

  it('comes to a long point at the chin that stands out forwards', () => {
    const chin = beardShape(at(0, -0.4, 2.2), FORWARD);
    expect(chin.length).toBeGreaterThan(0.45);
    expect(chin.direction[2]).toBeGreaterThan(0.4);
    expect(chin.length).toBeGreaterThan(beardShape(at(1.3, 0.2, 1.3), FORWARD).length * 3);
  });

  it('grows the brows above the eyes only', () => {
    expect(browShape(at(EYE.offsetX, 2.05), FORWARD).weight).toBeGreaterThan(0.5);
    expect(browShape(at(EYE.offsetX, EYE.y), FORWARD).weight).toBe(0);
    expect(browShape(at(0, 2.05), FORWARD).weight).toBe(0);
  });

  it('hands out directions of unit length', () => {
    for (const growth of [beardShape(at(0.5, 0), FORWARD), beardShape(at(0.2, 0.8), FORWARD), browShape(at(0.6, 2.05), FORWARD)]) {
      expect(Math.hypot(...growth.direction)).toBeCloseTo(1, 6);
    }
  });

  it('eases between its edges', () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(1, 0, 0.25)).toBeGreaterThan(0.5);
  });
});

describe('the eyes of the head', () => {
  it('open inside the width of the eye and around its centre', () => {
    expect(EYE_OPENING.inner).toBeLessThan(EYE.offsetX);
    expect(EYE_OPENING.outer).toBeGreaterThan(EYE.offsetX);
    expect(EYE.irisRadius).toBeLessThan(EYE.radius);
    expect(EYE.pupilRadius).toBeLessThan(EYE.irisRadius);
  });

  it('are open at the start and close in the middle of a blink', () => {
    expect(lidOpening(0)).toBe(1);
    const blink = BLINK.every / 2;
    expect(lidOpening(blink + BLINK.seconds / 2)).toBeCloseTo(0, 6);
    expect(lidOpening(blink + BLINK.seconds * 0.9)).toBeGreaterThan(0.5);
    expect(lidOpening(blink + BLINK.seconds * 2)).toBe(1);
  });

  it('blink at the same moments every time', () => {
    for (const time of [0.3, 2.4, 7.1, 123.45]) expect(lidOpening(time)).toBe(lidOpening(time));
    expect(lidOpening(1)).toBe(lidOpening(1 + BLINK.every));
  });
});

describe('the fixed cameras', () => {
  it('stand inside the room', () => {
    for (const [name, shot] of Object.entries(SHOTS)) {
      const [x, y, z] = shot.position;
      expect(Math.abs(x), name).toBeLessThan(ROOM_SIZE.width / 2);
      expect(Math.abs(z), name).toBeLessThan(ROOM_SIZE.depth / 2);
      expect(y, name).toBeGreaterThan(0);
      expect(y, name).toBeLessThan(ROOM_SIZE.height);
    }
  });

  it('are known by name', () => {
    expect(isShotName('entrance')).toBe(true);
    expect(isShotName('toString')).toBe(false);
  });

  it('show the figure where he stands', () => {
    expect(Math.abs(FIGURE_SPOT.x)).toBeLessThan(ROOM_SIZE.width / 2);
    expect(SHOTS.portrait.target[1]).toBeCloseTo(FIGURE_SPOT.eyeHeight, 0);
  });
});

describe('the grille of a plaster window', () => {
  const arch = { width: 1, straight: 0.8, rise: 0.4 };

  it('has holes for a sensible spacing', () => {
    expect(traceryHoles(arch, 0.2, 0.07, 0.05).length).toBeGreaterThan(3);
  });

  it('has no holes, and does not hang, when the spacing or the radius is not positive', () => {
    expect(traceryHoles(arch, 0, 0.07, 0.05)).toEqual([]);
    expect(traceryHoles(arch, -0.2, 0.07, 0.05)).toEqual([]);
    expect(traceryHoles(arch, 0.2, 0, 0.05)).toEqual([]);
  });
});

describe('the arms of the figure', () => {
  /** Half-width of the outer kaftan at a height, between the two sections around it. */
  function skirtHalfWidth(y: number): number {
    const below = OUTER.findIndex((section) => section.y <= y);
    const upper = OUTER[below - 1];
    const lower = OUTER[below];
    if (!upper || !lower) throw new Error(`The outer kaftan has no sections around the height ${y}.`);
    const share = (upper.y - y) / (upper.y - lower.y);
    return upper.rx + (lower.rx - upper.rx) * share;
  }

  it('hang clear of the skirt of the outer kaftan: wrist and forearm lie outside it', () => {
    const HAND_HALF_WIDTH = 0.03;
    for (const joint of [ARM.forearm, ARM.wrist]) {
      expect(joint.x - HAND_HALF_WIDTH).toBeGreaterThan(skirtHalfWidth(joint.y));
    }
  });
});

describe('keeping the game fluid by drawing fewer pixels', () => {
  const limits = { floor: 0.6, slowFrameMs: 21, step: 0.85 };

  it('keeps the fineness of the picture while frames are fast enough', () => {
    expect(nextPixelRatio(1.5, 16.7, limits)).toBe(1.5);
    expect(nextPixelRatio(1.5, 21, limits)).toBe(1.5);
  });

  it('draws fewer pixels when frames are slow, one step at a time', () => {
    expect(nextPixelRatio(1.5, 30, limits)).toBeCloseTo(1.275, 6);
    expect(nextPixelRatio(1, 45, limits)).toBeCloseTo(0.85, 6);
  });

  it('never goes below its floor, however slow the frames', () => {
    let ratio = 1.5;
    for (let i = 0; i < 20; i += 1) ratio = nextPixelRatio(ratio, 200, limits);
    expect(ratio).toBe(0.6);
  });

  it('does not make the picture finer again, so that it never swings back and forth', () => {
    expect(nextPixelRatio(0.8, 5, limits)).toBe(0.8);
  });

  it('measures over a window of frames and forgets the frames of loading', () => {
    const meter = createFrameMeter({ window: 4, skip: 2 });
    // The first two frames are the hitches of loading and are not counted.
    expect(meter.add(900)).toBeNull();
    expect(meter.add(400)).toBeNull();
    expect(meter.add(10)).toBeNull();
    expect(meter.add(20)).toBeNull();
    expect(meter.add(30)).toBeNull();
    expect(meter.add(40)).toBe(25);
    // A new window starts after each reading.
    expect(meter.add(50)).toBeNull();
  });
});

describe('the face of the portrait', () => {
  const NOSE_TIP: Vec3 = [FACE_CENTRE_X, 1.1, 2.59];

  it('has a long hooked nose: the tip comes down towards the lip and forwards', () => {
    const [, y, z] = reshapeFace(NOSE_TIP);
    expect(NOSE_TIP[1] - y).toBeGreaterThan(0.25);
    expect(z).toBeGreaterThan(NOSE_TIP[2]);
  });

  it('has an arched bridge', () => {
    const [, , z] = reshapeFace([FACE_CENTRE_X, 1.58, 2.3]);
    expect(z - 2.3).toBeGreaterThan(0.18);
  });

  it('is longer below the nose than the scan, and unchanged at the eyes and the back of the head', () => {
    const chin = reshapeFace([FACE_CENTRE_X, -0.5, 2.2]);
    expect(-0.5 - chin[1]).toBeGreaterThan(0.1);
    expect(reshapeFace([FACE_CENTRE_X + 0.6, EYE.y, 1.9])).toEqual([FACE_CENTRE_X + 0.6, EYE.y, 1.9]);
    expect(reshapeFace([0.3, 0.2, -1.5])).toEqual([0.3, 0.2, -1.5]);
  });

  it('keeps the neck where the collar meets it', () => {
    const [, y] = reshapeFace([FACE_CENTRE_X, -1.45, 1.2]);
    expect(y).toBeCloseTo(-1.45, 6);
  });

  it('is the same on both sides', () => {
    const left = reshapeFace([FACE_CENTRE_X + 0.2, 1.2, 2.4]);
    const right = reshapeFace([FACE_CENTRE_X - 0.2, 1.2, 2.4]);
    expect(left[1]).toBeCloseTo(right[1], 6);
    expect(left[2]).toBeCloseTo(right[2], 6);
  });
});

describe('the back edge of the beard', () => {
  const at = (side: number, y: number, z: number): Vec3 => [FACE_CENTRE_X + side, y, z];

  it('slants forwards as it goes down, leaving the neck under the ear bare', () => {
    expect(beardShape(at(1.4, -0.3, 0.6), [0, -1, 0]).weight).toBe(0);
    expect(beardShape(at(1.2, -0.3, 1.3), [0, -1, 0]).weight).toBeGreaterThan(0.8);
    expect(beardShape(at(1.5, 0.9, 0.7), FORWARD).weight).toBeGreaterThan(0.6);
  });

  it('keeps the long point to the middle of the chin', () => {
    const middle = beardShape(at(0, -0.4, 2.2), FORWARD).length;
    const beside = beardShape(at(0.9, -0.4, 1.8), FORWARD).length;
    expect(middle).toBeGreaterThan(beside * 2.5);
  });
});

describe('the point of the beard', () => {
  const at = (side: number, y: number, z: number): Vec3 => [FACE_CENTRE_X + side, y, z];

  it('juts forwards more than it hangs down', () => {
    const point = beardShape(at(0, -0.45, 2.2), FORWARD);
    expect(point.direction[2]).toBeGreaterThan(0.6);
    expect(point.length).toBeGreaterThan(0.5);
  });

  it('is narrow: a hand to the side of the chin the hair is trimmed short again', () => {
    expect(beardShape(at(0.7, -0.45, 1.9), FORWARD).length).toBeLessThan(0.2);
  });
});

describe('the mouth of the figure', () => {
  const at = (side: number, y: number, z = 2.2): Vec3 => [FACE_CENTRE_X + side, y, z];

  it('opens by the lower jaw: the chin and the lower lip move, the upper lip and the nose do not', () => {
    expect(jawWeight(at(0, 0.3))).toBeGreaterThan(0.8);
    expect(jawWeight(at(0, -0.3))).toBeGreaterThan(0.8);
    expect(jawWeight(at(0, 0.6))).toBe(0);
    expect(jawWeight(at(0, 1.1))).toBe(0);
    expect(jawWeight(at(0.6, EYE.y))).toBe(0);
  });

  it('moves less towards the hinge of the jaw and not at all behind it or on the neck', () => {
    expect(jawWeight(at(1.2, 0.1, 1.2))).toBeLessThan(jawWeight(at(0, 0.1)));
    expect(jawWeight(at(1.5, 0.2, 0.2))).toBe(0);
    expect(jawWeight(at(0, -1.4, 1.2))).toBe(0);
    expect(jawWeight(at(0.3, 0.2, -1.5))).toBe(0);
  });

  it('is the same on both sides and never more than a full movement', () => {
    expect(jawWeight(at(0.5, 0.1))).toBeCloseTo(jawWeight(at(-0.5, 0.1)), 6);
    for (const y of [0.4, 0.2, 0, -0.4, -0.8]) expect(jawWeight(at(0.2, y))).toBeLessThanOrEqual(1);
  });

  it('is shut while he is silent', () => {
    for (const time of [0, 0.37, 5.2, 99]) expect(mouthOpening(time, false)).toBe(MOUTH_REST);
  });

  it('opens and closes while he speaks, never beyond fully open', () => {
    const samples = Array.from({ length: 200 }, (_, index) => mouthOpening(index * 0.03, true));
    expect(Math.max(...samples)).toBeGreaterThan(0.6);
    expect(Math.min(...samples)).toBeLessThan(0.15);
    for (const sample of samples) {
      expect(sample).toBeGreaterThanOrEqual(0);
      expect(sample).toBeLessThanOrEqual(1);
    }
    // Syllables, not a hum: the mouth passes through half open many times in six seconds.
    const crossings = samples.filter((sample, index) => index > 0 && sample > 0.4 !== (samples[index - 1] as number) > 0.4).length;
    expect(crossings).toBeGreaterThan(20);
  });

  it('moves the same way at the same moment every time', () => {
    expect(mouthOpening(1.234, true)).toBe(mouthOpening(1.234, true));
  });
});

describe('the way out of the room', () => {
  it('is the door in the south wall', () => {
    expect(DOOR.z).toBeCloseTo(ROOM_SIZE.depth / 2, 6);
    expect(Math.abs(DOOR.x)).toBeLessThan(ROOM_SIZE.width / 2);
  });

  it('is not offered where the player enters, nor in the middle of the room, nor beside the figure', () => {
    expect(isAtDoor(PLAYER_START)).toBe(false);
    expect(isAtDoor({ x: 0, z: 0 })).toBe(false);
    expect(isAtDoor({ x: FIGURE_SPOT.x, z: FIGURE_SPOT.z + 1 })).toBe(false);
  });

  it('is offered to a player who has walked up to the door', () => {
    expect(isAtDoor({ x: DOOR.x, z: DOOR.z - 0.35 })).toBe(true);
    expect(isAtDoor({ x: DOOR.x + 0.4, z: DOOR.z - 0.4 })).toBe(true);
  });

  it('is not offered along the wall beside the door', () => {
    expect(isAtDoor({ x: DOOR.x + 2, z: DOOR.z - 0.35 })).toBe(false);
  });

  it('lets the player in a step away from the door, facing the room', () => {
    expect(PLAYER_START.z).toBeLessThan(DOOR.z);
    expect(Math.hypot(PLAYER_START.x - DOOR.x, PLAYER_START.z - DOOR.z)).toBeLessThan(1.5);
  });
});
