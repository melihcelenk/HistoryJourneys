import { describe, expect, it } from 'vitest';
import { createFrameMeter, nextPixelRatio } from '../../src/scene3d/dynamicResolution';
import { beardShape, browShape, smoothstep, type Vec3 } from '../../src/scene3d/figure/hairShape';
import { EYE, EYE_OPENING, FACE_CENTRE_X } from '../../src/scene3d/figure/headMetrics';
import { BLINK, lidOpening } from '../../src/scene3d/figure/idle';
import { ARM, OUTER } from '../../src/scene3d/figure/kaftan';
import { ROOM_SIZE } from '../../src/scene3d/room/layout';
import { traceryHoles } from '../../src/scene3d/room/patterns';
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

  it('grows a moustache between the nose and the upper lip', () => {
    expect(beardShape(at(0.2, 0.8), FORWARD).weight).toBeGreaterThan(0.5);
  });

  it('lays the moustache down over the lip, thinner in the groove under the nose', () => {
    const hair = beardShape(at(0.3, 0.8), FORWARD);
    expect(hair.direction[1]).toBeLessThan(-0.6);
    expect(Math.abs(hair.direction[0])).toBeLessThan(0.5);
    expect(beardShape(at(0, 0.8), FORWARD).weight).toBeLessThan(hair.weight);
    expect(hair.length).toBeLessThan(beardShape(at(0, -0.3), FORWARD).length / 2);
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
