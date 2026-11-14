// "Get Ready With Me (For The Last Time)": timeline, set layout and camera grammar. Beats come from the voice
// timeline (projects/grwm/voice/beats.json, 30 fps). Camera grammar as before: holds that creep, ease-out bursts,
// whip pans between places, flip kicks on impacts.
import type { Light } from "./lights";

export const FPS = 30;
export const TOTAL = 2421;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const F = (t: number) => Math.round(t * FPS);

// ---------------- set layout (metres, floor y = 0) ----------------
/** office floor (from the earlier shorts): x 24..36, z -10..12 cubicles; lobby x 27..33, z -14..-10 */
export const CEIL = 2.9;
export const TABLE: V3 = [0, 0.76, -0.3];
export const OX = 30;
export const EXIT_Z = -14;
export const ELEV: V3 = [27, 0, -12];
export const PANEL: V3 = [27.12, 1.1, -11.05];
export const POSTER: V3 = [32.9, 1.55, -12.0];
export const VENT: V3 = [30, 0, 11.42];
export const FIRE: V3 = [34.5, 0, -10];
export const BOARD: V3 = [30, 1.65, 11.9];
export const PRINTER: V3 = [35.3, 0, 0.2];
export const DESK: V3 = [25.9, 0, 3.1];      // Trevor's desk
export const CEIL_VENT: V3 = [30, CEIL, -7.9]; // Dave hangs out of this one
/** the apartment: x -43..-37, z -2.5..2.5, ceiling 2.6 */
export const ACEIL = 2.6;
export const A_BED: V3 = [-41.4, 0, -1.05];
export const A_SINK: V3 = [-41.5, 0, 0.3];
export const A_EAT: V3 = [-39.6, 0, 0.4];
export const A_DRESS: V3 = [-38.9, 0, 0.25];
export const A_DOOR: V3 = [-37.7, 0, 1.55];
export const ROACH: V3 = [-42.55, 0.985, -0.95];
/** gridlock: road along z at x = -100, Trevor's car at the origin of the jam, facing -z */
export const TCAR: V3 = [-100, 0, 0];
/** the daydream coast: plateau top y = 0 west of the cliff edge x = -196, ocean at y = -25 */
export const CLIFF_X = -196;
export const ISLAND: V3 = [-150, -24.6, 9.5];
/** the street outside: facade at z = 0 facing +z, door at x = 80 */
export const SX = 80;
export const LAND: V3 = [80.6, 0.12, 2.5];

// ---------------- story beats (frames, from beats.json) ----------------
export const B = { start: 0, h1: 8, h1E: 73, freeze: 73, h2: 86, h2E: 129, rewind: 129, h3: 148, h3E: 222, g1: 230, g1E: 250, splash: 250, g2: 266, g2E: 284, bite: 284, g3a: 304, g3aE: 320, sniff: 320, g3b: 335, g3bE: 366, n1a: 375, n1aE: 435, n1b: 438, n1bE: 521, n2a: 532, n2aE: 613, n2b: 616, n2bE: 682, dream: 682, c1: 885, c1E: 935, n3a: 946, n3aE: 990, n3b: 993, n3bE: 1025, door: 1025, d1: 1037, d1E: 1166, d2: 1174, d2E: 1323, n4: 1332, n4E: 1377, stand: 1377, s1a: 1396, s1aE: 1412, s1b: 1419, s1bE: 1514, r1: 1525, r1E: 1597, r2: 1604, r2E: 1685, r3: 1693, r3E: 1798, r4: 1806, r4E: 1875, r5: 1883, r5E: 1932, grab: 1932, r6: 1941, r6E: 2034, h1b: 2040, h1bE: 2105, toss: 2105, e1: 2165, e1E: 2270, n5a: 2280, n5aE: 2347, n5b: 2350, n5bE: 2391, end: 2391,
  launch: 766, wings: 774, beach: 848, honk: 874, land: 2116, song2: 2142 };
/** Chad's shouted phrases (onsets): every one gets a sting, a kick and a twitch */
export const CHAD_WORDS = [1039, 1085, 1132, 1162, 1175, 1214, 1228, 1244, 1267, 1308];

// ---------------- shots ----------------
export type Set = "office" | "apt" | "traffic" | "coast" | "street";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: Set };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 129, light: "office", set: "office" },       // HOOK: dragged out by security. Freeze. "Let me back up."
  { id: 2, a: 129, b: 227, light: "apt", set: "apt" },           // the dingy apartment: "Get ready with me..."
  { id: 3, a: 227, b: 262, light: "apt", set: "apt" },           // skincare
  { id: 4, a: 262, b: 300, light: "apt", set: "apt" },           // breakfast
  { id: 5, a: 300, b: 372, light: "apt", set: "apt" },           // outfit
  { id: 6, a: 372, b: 438, light: "apt", set: "apt" },           // the mess, wide: 42k a year
  { id: 7, a: 438, b: 528, light: "apt", set: "apt" },           // the roach pays the same rent
  { id: 8, a: 528, b: 616, light: "gray", set: "traffic" },      // gridlock, wide
  { id: 9, a: 616, b: 682, light: "gray", set: "traffic" },      // dead eyes through the windshield
  { id: 10, a: 682, b: 742, light: "dream", set: "coast" },      // the daydream: sunny coast road, smiling
  { id: 11, a: 742, b: 808, light: "dream", set: "coast" },      // hard right... off the cliff
  { id: 12, a: 808, b: 848, light: "dream", set: "coast" },      // wings! gliding over the ocean
  { id: 13, a: 848, b: 874, light: "dream", set: "coast" },      // the beach, sunglasses, coconut
  { id: 14, a: 874, b: 946, light: "gray", set: "traffic" },     // HONK. "Every. Single. Morning."
  { id: 15, a: 946, b: 1025, light: "office", set: "office" },   // cubicle slump; then Chad walked in
  { id: 16, a: 1025, b: 1166, light: "office", set: "office" },  // Chad bursts in
  { id: 17, a: 1166, b: 1250, light: "office", set: "office" },  // Chad CU: cold plunge
  { id: 18, a: 1250, b: 1377, light: "office", set: "office" },  // Trevor's eye twitches; the narrator: say it
  { id: 19, a: 1377, b: 1515, light: "office", set: "office" },  // the snap
  { id: 20, a: 1515, b: 1600, light: "office", set: "office" },  // roast: Chad
  { id: 21, a: 1600, b: 1690, light: "office", set: "office" },  // roast: Linda
  { id: 22, a: 1690, b: 1802, light: "office", set: "office" },  // roast: IT guy
  { id: 23, a: 1802, b: 1879, light: "office", set: "office" },  // roast: intern
  { id: 24, a: 1879, b: 1932, light: "office", set: "office" },  // roast: Dave in the ceiling vent
  { id: 25, a: 1932, b: 2038, light: "office", set: "office" },  // security grabs him: the earpiece
  { id: 26, a: 2038, b: 2105, light: "office", set: "office" },  // the hook shot again: the hairline
  { id: 27, a: 2105, b: 2128, light: "gray", set: "street" },    // tossed out the front door
  { id: 28, a: 2128, b: 2150, light: "gray", set: "street" },    // on the sidewalk. Silence.
  { id: 29, a: 2150, b: TOTAL, light: "sunny", set: "street" },  // the sun comes out. Like and subscribe.
];
export const XFADE: Record<number, number> = { 29: 18 };
/** shots that start with a whip pan from the previous shot: +1 pans right, -1 left */
export const WHIPS: Record<number, number> = { 2: 1, 21: 1, 22: -1, 23: 1, 24: -1 };
export const FLASH_AT = B.honk;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** the hook's freeze frame: time stops at `freeze` (only Trevor and the narrator keep going) */
export const frozen = (f: number) => f >= B.freeze && f < B.rewind;
export const lightLevel = (f: number) => (f >= TOTAL - 10 ? 0 : 1);
export const screensDave = (_f: number) => 0;

// ---------------- moving things ----------------
/** the drag to the exit: u 0..1 -> Trevor's feet (the guards hold his arms either side) */
export const dragAt = (u: number): V3 => [30, 0, -8.3 - 2.4 * clamp01(u)];
export const dragU = (id: number, f: number) => id === 1 ? Math.min(f, B.freeze) / 73 * 0.55 : 0.55 + (f - 2038) / 67 * 0.45;
/** the roast strut down the aisle */
export const strutAt = (f: number): V3 => [30, 0, 2.6 - 0.026 * Math.max(0, Math.min(f, B.grab) - 1515)];
/** the daydream car: position, heading (0 = -z, +pi/2 = +x), pitch, roll, wing spread */
export type CarPose = { pos: V3; yaw: number; pitch: number; roll: number; wings: number };
export const dreamCar = (f: number): CarPose => {
  if (f < 752) return { pos: [-199, 0, 40 - 0.4 * (f - 682)], yaw: 0, pitch: 0, roll: 0, wings: 0 };
  if (f < 766) { // a quarter turn to the right (radius 2.5 m) to the cliff edge
    const a = ((f - 752) / 14) * (Math.PI / 2), R = 2.5;
    return { pos: [-199 + R - R * Math.cos(a), 0, 12 - R * Math.sin(a)], yaw: a, pitch: 0, roll: -0.12 * Math.sin(a * 2), wings: 0 };
  }
  const t = f - 766, x = CLIFF_X - 0.5 + 0.5 * t;
  const y = t < 15 ? 0.12 * t - 0.004 * t * t : 0.9 - 0.035 * (t - 15);
  const pitch = t < 15 ? 0.22 * (1 - t / 15) : -0.06;
  return { pos: [x, y, 9.5], yaw: Math.PI / 2, pitch, roll: 0.05 * Math.sin(t * 0.15), wings: smooth((f - B.wings) / 12) };
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; e?: "glide" | "out"; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const easeOut = (u: number) => 1 - Math.pow(1 - clamp01(u), 4);
const mixC = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    const out = k.e === "out";
    const u = (f - k.f + (out ? 1 : 0)) / (k.dur ?? (out ? 11 : 24));
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), out ? easeOut(u) : glide(u));
  }
  return cur;
};
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** freeze: the camera stops dead too */
const fz = (f: number) => (frozen(f) ? B.freeze : f);

const CAMS: Record<number, Key[]> = {
  // 1: low in the lobby, the drag comes at us; freeze; Trevor turns to camera
  1: [
    { f: 0, s: (f) => dolly([30.35, 1.25, -12.9], [30.0, 1.25, -8.6], pushK(fz(f), 0, 0.003), { fov: 46, roll: 0.04 }) },
    { f: B.freeze, e: "out", dur: 8, s: () => dolly([30.3, 1.3, -11.6], [30.0, 1.38, -9.0], 1, { fov: 40, roll: 0.07 }) },
    { f: B.h2 - 2, e: "out", dur: 10, s: (f) => dolly([30.15, 1.4, -10.9], [30.0, 1.45, -9.05], pushK(f, B.h2, 0.002), { fov: 40, roll: 0 }) },
  ],
  // 2: the GRWM phone on a pizza box: Trevor on the mattress edge, the mess around him
  2: [{ f: 129, s: (f) => dolly([-41.3, 1.05, 1.35], [-41.4, 1.0, -1.05], pushK(f, 129, 0.0018), { fov: 52 }) },
    { f: B.h3 - 3, e: "out", dur: 10, s: (f) => dolly([-41.32, 1.1, 0.75], [-41.4, 1.05, -1.05], pushK(f, B.h3, 0.002), { fov: 46 }) }],
  // 3: skincare: the phone propped on the mirror
  3: [{ f: 227, s: (f) => dolly([-42.82, 1.45, 0.34], [-41.5, 1.3, 0.3], pushK(f, 227, 0.003), { fov: 50 }) }],
  // 4: breakfast: the slice from the box
  4: [{ f: 262, s: (f) => dolly([-39.55, 1.45, 2.25], [-39.6, 1.3, 0.4], pushK(f, 262, 0.003), { fov: 46 }) },
    { f: B.bite - 3, e: "out", dur: 9, s: (f) => dolly([-39.56, 1.48, 1.85], [-39.6, 1.38, 0.4], pushK(f, B.bite, 0.002), { fov: 42, roll: 0.05 }) }],
  // 5: outfit: the sniff test
  5: [{ f: 300, s: (f) => dolly([-39.0, 1.4, 2.3], [-38.9, 1.2, 0.25], pushK(f, 300, 0.002), { fov: 48 }) },
    { f: B.sniff - 3, e: "out", dur: 9, s: (f) => dolly([-38.95, 1.5, 1.95], [-38.9, 1.38, 0.25], pushK(f, B.sniff, 0.002), { fov: 42, roll: -0.05 }) }],
  // 6: wide from the corner: the whole dump, Trevor at the door with his lanyard
  6: [{ f: 372, s: (f) => dolly([-42.7, 2.15, -2.2], [-38.7, 0.95, 0.9], pushK(f, 372, 0.0015), { fov: 58 }) }],
  // 7: counter level: the roach on the pizza box
  7: [{ f: 438, s: (f) => dolly([-42.2, 1.12, -0.35], [-42.55, 1.03, -0.95], pushK(f, 438, 0.0025), { fov: 40 }) },
    { f: 470, e: "out", dur: 12, s: (f) => dolly([-42.38, 1.08, -0.62], [-42.55, 1.03, -0.95], pushK(f, 470, 0.002), { fov: 38, roll: 0.04 }) }],
  // 8: high over the jam, slow push down the line of cars
  8: [{ f: 528, s: (f) => dolly([-96.5, 7.5, 9.5], [-100, 0.6, -2], pushK(f, 528, 0.0018), { fov: 50 }) }],
  // 9: through the windshield: dead eyes
  9: [{ f: 616, s: (f) => dolly([-100.32, 1.5, -2.6], [-100.32, 1.38, 0.42], pushK(f, 616, 0.0028), { fov: 38 }) }],
  // 10: the dream: through the windshield of the moving car, sunny, smiling
  10: [{ f: 682, s: (f) => { const c = dreamCar(f); const k = pushK(f, 682, 0.002); return dolly(add(c.pos, [-0.32, 1.5, -2.6]), add(c.pos, [-0.32, 1.38, 0.42]), k, { fov: 40 }); } }],
  // 11: wide from the side over the sea: the hard right, the launch
  11: [{ f: 742, s: (f) => { const c = dreamCar(Math.min(f, 800)); return { pos: [-184, 3.5, 30], look: [c.pos[0] * 0.7 + -196 * 0.3, -2.5 + c.pos[1] * 0.5, c.pos[2] * 0.6 + 11 * 0.4], fov: 50, roll: -0.03 }; } }],
  // 12: chase: alongside the flying car, the island ahead
  12: [{ f: 808, s: (f) => { const c = dreamCar(f); return { pos: add(c.pos, [-1.5, 1.6, 6.5]), look: add(c.pos, [3.0, 0.2, -0.5]), fov: 48, roll: 0.06 }; } }],
  // 13: the beach CU
  13: [{ f: 848, s: (f) => dolly(add(ISLAND, [0.6, 1.25, 2.6]), add(ISLAND, [0, 0.95, 0]), pushK(f, 848, 0.003), { fov: 42 }) }],
  // 14: back in the jam (the honk), Trevor turns to us
  14: [{ f: 874, s: (f) => dolly([-100.32, 1.5, -2.6], [-100.32, 1.38, 0.42], pushK(f, 874, 0.0022), { fov: 38, roll: 0.03 }) },
    { f: B.c1 - 2, e: "out", dur: 10, s: (f) => dolly([-100.32, 1.48, -2.0], [-100.32, 1.4, 0.42], pushK(f, B.c1, 0.0025), { fov: 38 }) }],
  // 15: the cubicle: he slumps in; "Then Chad walked in" whip to the aisle
  15: [{ f: 946, s: (f) => dolly([28.2, 1.45, 4.4], [25.9, 1.05, 3.1], pushK(f, 946, 0.002), { fov: 46 }) },
    { f: B.n3b - 2, e: "out", dur: 10, s: (f) => dolly([27.4, 1.35, 3.0], [30.2, 1.35, 5.8], 1, { fov: 46 }) }],
  // 16: Chad marches up the aisle into Trevor's cubicle
  16: [{ f: 1025, s: (f) => { const u = smooth((f - 1025) / 30); return dolly([26.2, 1.35, 2.3], [30.3 + (28.95 - 30.3) * u, 1.4, 5.8 + (3.25 - 5.8) * u], pushK(f, 1025, 0.0015), { fov: 50 }); } }],
  // 17: Chad CU, too close, too loud
  17: [{ f: 1166, s: (f) => dolly([27.0, 1.45, 3.0], [28.95, 1.55, 3.25], pushK(f, 1166, 0.002), { fov: 40, roll: -0.04 }) }],
  // 18: Trevor ECU: the twitch, punch-ins per word; the narrator whispers
  18: [{ f: 1250, s: (f) => dolly([27.75, 1.32, 3.15], [25.9, 1.25, 3.1], pushK(f, 1250, 0.003, 0.01, 30), { fov: 40 }) },
    { f: B.n4 - 2, e: "out", dur: 12, s: (f) => dolly([27.2, 1.32, 3.12], [25.9, 1.28, 3.1], pushK(f, B.n4, 0.002), { fov: 38, roll: 0.03 }) }],
  // 19: the snap: two-shot from the side, Trevor rises into frame
  19: [{ f: 1377, s: (f) => dolly([30.6, 1.55, 4.0], [27.3, 1.4, 3.1], pushK(f, 1377, 0.0018), { fov: 50 }) },
    { f: 1462, e: "out", dur: 10, s: (f) => dolly([28.4, 1.55, 3.5], [25.9, 1.5, 3.1], pushK(f, 1462, 0.002), { fov: 42, roll: 0.05 }) }],
  // 20-24: the roast strut, each target a whip; the camera trucks backwards in front of Trevor
  20: [{ f: 1515, s: (f) => { const p = strutAt(f); return dolly(add(p, [0.9, 1.4, -2.6]), add(p, [-0.5, 1.35, 0.3]), 1, { fov: 46 }); } }],
  21: [{ f: 1600, s: (f) => { const p = strutAt(f); return dolly(add(p, [-0.9, 1.4, -2.4]), add(p, [0.55, 1.35, -0.1]), 1, { fov: 46 }); } }],
  22: [{ f: 1690, s: (f) => { const p = strutAt(f); return dolly(add(p, [0.8, 1.4, -2.5]), add(p, [-0.6, 1.3, 0.0]), 1, { fov: 46 }); } }],
  23: [{ f: 1802, s: (f) => { const p = strutAt(f); return dolly(add(p, [-0.8, 1.4, -2.4]), add(p, [0.6, 1.35, -0.05]), 1, { fov: 46 }); } }],
  24: [{ f: 1879, s: (f) => { const p = strutAt(f); return dolly(add(p, [0.5, 1.15, -2.0]), add(p, [0.0, 1.95, -0.25]), 1, { fov: 52, roll: -0.04 }); } }],
  // 25: security closes in
  25: [{ f: 1932, s: (f) => dolly([31.6, 1.45, -10.6], [30.1, 1.3, -8.3], pushK(f, 1932, 0.002), { fov: 46 }) },
    { f: 2020, e: "out", dur: 10, s: (f) => dolly([31.1, 1.45, -9.8], [30.05, 1.4, -8.35], pushK(f, 2020, 0.002), { fov: 42, roll: 0.05 }) }],
  // 26: the hook shot again
  26: [{ f: 2038, s: (f) => dolly([30.35, 1.25, -12.9], [30.0, 1.25, -8.6], pushK(f - 2038 + 30, 0, 0.003), { fov: 46, roll: 0.04 }) }],
  // 27: the front door from across the street; he flies out
  27: [{ f: 2105, s: (f) => dolly([82.5, 1.6, 10.5], [80.5, 1.2, 1.2], pushK(f, 2105, 0.002), { fov: 50 }) }],
  // 28-29: high over him on the pavement; the sun comes out, slow push
  28: [{ f: 2128, s: (f) => dolly([81.75, 0.95, 5.4], [81.55, 0.4, 2.5], pushK(f, 2128, 0.0015), { fov: 44 }) }],
  29: [{ f: 2141, s: (f) => dolly([81.75, 0.95, 5.4], [81.55, 0.4, 2.5], pushK(f, 2128, 0.0015) * pushK(f, 2160, 0.0012), { fov: 44 }) }],
};
/** impact kicks: flip sign each frame, decay over 7 f */
const KICKS: [number, number][] = [[B.freeze, 0.016], [B.splash, 0.01], [B.bite, 0.01], [B.sniff, 0.01], [B.launch, 0.012], [B.honk, 0.02], [B.door, 0.012],
  ...CHAD_WORDS.map((w) => [w, 0.012] as [number, number]), [B.stand + 4, 0.012], [1464, 0.02], [B.r1E - 30, 0.01], [B.r2E - 30, 0.01], [B.r3E - 40, 0.01],
  [B.r4E - 30, 0.01], [B.r5 + 25, 0.012], [B.grab + 2, 0.016], [B.h1b + 4, 0.016], [B.land, 0.024]];
const SH_BY_ID = new Map(SHOTS.map((s) => [s.id, s]));
const whipYaw = (id: number, f: number) => {
  const s = SH_BY_ID.get(id)!, W = 0.8, OUT = 5, IN = 7;
  let y = 0;
  const nd = WHIPS[id + 1];
  if (nd && f >= s.b - OUT) { const u = (f - (s.b - OUT) + 1) / OUT; y += nd * W * u * u; }
  const d = WHIPS[id];
  if (d && f < s.a + IN) { const u = clamp01((f - s.a + 1) / IN); y -= d * W * Math.pow(1 - u, 3); }
  return y;
};
export const camAt = (id: number, f: number, kick = true): Cam => {
  const c = run(CAMS[id], f);
  const yaw = whipYaw(id, f);
  if (yaw) {
    const dx = c.look[0] - c.pos[0], dz = c.look[2] - c.pos[2], cs = Math.cos(-yaw), sn = Math.sin(-yaw);
    c.look = [c.pos[0] + dx * cs - dz * sn, c.look[1], c.pos[2] + dx * sn + dz * cs];
  }
  if (!kick) return c;
  let k = 0;
  for (const [f0, a] of KICKS) { const d = f - f0; if (d >= 0 && d < 7) k += a * (1 - d / 7) * (d % 2 ? -1 : 1); }
  if (k) c.look = [c.look[0] + k * 6, c.look[1] + k * 4, c.look[2]];
  return c;
};

// ---------------- lens blur per beat ----------------
export type Dof = { cInf: number; focus?: (f: number) => V3 };
export const dofAt = (f: number): Dof => {
  const id = shotAt(f).id;
  switch (id) {
    case 1: case 26: return { cInf: 8, focus: (g) => { const p = dragAt(dragU(id, g)); return [p[0], 1.4, p[2]]; } };
    case 2: return { cInf: 9, focus: () => [A_BED[0], 1.0, A_BED[2]] };
    case 3: return { cInf: 12, focus: () => [A_SINK[0], 1.45, A_SINK[2]] };
    case 4: return { cInf: 12, focus: () => [A_EAT[0], 1.45, A_EAT[2]] };
    case 5: return { cInf: 11, focus: () => [A_DRESS[0], 1.45, A_DRESS[2]] };
    case 7: return { cInf: 15, focus: () => ROACH };
    case 9: case 14: return { cInf: 11, focus: () => [-100.32, 1.3, 0.35] };
    case 10: return { cInf: 8, focus: (g) => { const c = dreamCar(g); return [c.pos[0] - 0.32, 1.3, c.pos[2] + 0.35]; } };
    case 13: return { cInf: 12, focus: () => [ISLAND[0], ISLAND[1] + 1.0, ISLAND[2]] };
    case 17: return { cInf: 12, focus: () => [28.95, 1.55, 3.25] };
    case 18: return { cInf: 14, focus: () => [DESK[0], 1.3, DESK[2]] };
    case 19: return { cInf: 8 };
    case 20: case 21: case 22: case 23: case 24: return { cInf: 9, focus: (g) => { const p = strutAt(g); return [p[0], 1.4, p[2]]; } };
    case 25: return { cInf: 8 };
    case 28: case 29: return { cInf: 9, focus: () => LAND };
    default: return { cInf: 0 };
  }
};
