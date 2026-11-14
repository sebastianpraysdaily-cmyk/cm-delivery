// "One More Week": timeline, set layout and camera grammar. Times come from the voice word timings
// (projects/dave/voice/words.json, 30 fps). Camera grammar measured from the reference (STYLE_BIBLE "Camera"):
// ~80 % of frames are holds with a slow creep, moves are EASE-OUT BURSTS (peak speed on the first frame, settled in
// 8-12 f), place changes inside one location are WHIP PANS (5 f ease-in out of shot A, 7 f ease-out into shot B) with
// camera motion blur, impacts get 7-frame flip kicks.
import type { Light } from "./lights";

export const FPS = 30;
export const TOTAL = 1712;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
/** frame of a voice time (s) */
export const F = (t: number) => Math.round(t * FPS);

// ---------------- set layout (metres, floor y = 0) ----------------
/** break room (main): x -4.5..4.5, z -3.5..3.5, ceiling 2.9 */
export const CEIL = 2.9;
export const TABLE: V3 = [0, 0.76, -0.3];
/** office floor: x 24..36, z -10..12 cubicles; lobby x 27..33, z -14..-10; glass exit door in z = -14 */
export const OX = 30;
export const EXIT_Z = -14;
export const ELEV: V3 = [27, 0, -12];     // elevator in the lobby's left wall; call panel at z ELEV + 0.95
export const PANEL: V3 = [27.12, 1.1, -11.05]; // the one-button call panel (front face)
export const POSTER: V3 = [32.9, 1.55, -12.0]; // "window" poster on the lobby's right wall (faces -x)
export const VENT: V3 = [30, 0, 11.42];   // floor-level air-vent housing on the far wall (front face, faces -z)
export const FIRE: V3 = [34.5, 0, -10];   // fire exit door in the office's back wall (opens into the review room)
export const ROOM_TABLE: V3 = [34.5, 0.74, -12.5]; // performance-review room: x 33..36, z -14..-10
export const PRINTER: V3 = [35.3, 0, 0.2];
export const DESK: V3 = [25.9, 0, 3.1];   // Kevin's desk (time-lapse, cell z 3.2), window wall at x = 24 behind him
export const BOSS_DESK: V3 = [25.6, 0, 0.72]; // the boss, standing in the next cubicle over (divider at z 1.6)

// people in the break room (feet)
export const P = {
  dave: [0.2, 0, -1.3] as V3,
  boss: [-1.45, 0, -1.1] as V3,
  kevin: [1.15, 0, 0.75] as V3,
  t1: [-2.35, 0, -0.35] as V3,
  t2: [1.45, 0, -1.25] as V3,
  t3: [2.35, 0, -0.3] as V3,
  t4: [-1.95, 0, 0.85] as V3,
  t5: [-0.65, 0, -1.65] as V3,
};

// ---------------- story beats (frames, from words.json) ----------------
export const B = {
  eleven1: F(2.568), escape: F(4.127), raises: F(5.448), announced: F(6.214), dave: F(6.944), cake: F(7.557),
  chair: F(8.73), four: F(11.399), almost: F(12.29), third: F(13.068), grabbed: F(14.019), speed: F(14.967),
  locked: F(16.203), window: F(17.522), poster: F(18.768), window2: F(19.554), elevator: F(20.761), button: F(22.361),
  monday: F(23.633), vent: F(25.247), eating: F(26.782), sick: F(28.485), hisBoss: F(28.891), nextDesk: F(30.105),
  feel: F(30.978), out: F(32.108), turnedOn: F(33.848), dave4: F(36.151), turned: F(37.761), whisper: F(39.578),
  omw: F(40.05), fireExit: F(42.005), opened: F(43.409), performance: F(44.848), review: F(45.434), week: F(49.585),
  seventy: F(51.55), times: F(51.971), vent2: F(54.257), eating2: F(54.45), end: TOTAL,
};

// ---------------- shots ----------------
export type Set = "break" | "office" | "desk";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: Set };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 124, light: "office", set: "break" },        // hook: Kevin hears "eleven years"
  { id: 2, a: 124, b: 154, light: "office", set: "break" },      // ...and bolts
  { id: 3, a: 154, b: 208, light: "office", set: "break" },      // the boss raises her mug
  { id: 4, a: 208, b: 277, light: "office", set: "break" },      // Dave and his chair-shaped cake (whip in)
  { id: 5, a: 277, b: 356, light: "office", set: "break" },      // Kevin does the math
  { id: 6, a: 356, b: 403, light: "office", set: "break" },      // Dave x3
  { id: 7, a: 403, b: 449, light: "office", set: "break" },      // grabs the jacket (whip in)
  { id: 8, a: 449, b: 480, light: "office", set: "office" },     // speed-walk, tracking side-on
  { id: 9, a: 480, b: 502, light: "office", set: "office" },     // SMACK into the locked glass door
  { id: 10, a: 502, b: 602, light: "office", set: "office" },    // the window is a poster
  { id: 11, a: 602, b: 645, light: "office", set: "office" },    // the elevator
  { id: 12, a: 645, b: 726, light: "office", set: "office" },    // one button (whip in)
  { id: 13, a: 726, b: 770, light: "office", set: "office" },    // the air vent
  { id: 14, a: 770, b: 822, light: "office", set: "office" },    // Dave is in there, eating cake
  { id: 15, a: 822, b: 943, light: "office", set: "office" },    // calling in sick -> whip to the boss -> two-shot
  { id: 16, a: 943, b: 972, light: "office", set: "office" },    // the lights go out
  { id: 17, a: 972, b: 1063, light: "dark", set: "office" },     // every screen turns on
  { id: 18, a: 1063, b: 1094, light: "dark", set: "office" },    // every screen is Dave
  { id: 19, a: 1094, b: 1158, light: "dark", set: "office" },    // the team turns around behind Kevin
  { id: 20, a: 1158, b: 1222, light: "dark", set: "office" },    // "one more week"
  { id: 21, a: 1222, b: 1277, light: "dark", set: "office" },    // the fire exit!
  { id: 22, a: 1277, b: 1380, light: "office", set: "office" },  // ...into his performance review
  { id: 23, a: 1380, b: 1573, light: "office", set: "desk" },    // one more week x 570
  { id: 24, a: 1573, b: 1622, light: "office", set: "office" },  // ten years later: a new hire tries the vent
  { id: 25, a: 1622, b: TOTAL, light: "office", set: "office" }, // Kevin is in there, eating cake
];
export const XFADE: Record<number, number> = { 23: 10, 24: 10 };
/** shots that start with a whip pan from the previous shot: +1 pans right, -1 left */
export const WHIPS: Record<number, number> = { 4: 1, 7: -1, 12: 1 };
export const FLASH_AT = B.escape + 30;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

const hash = (k: number) => { const v = Math.sin(k * 91.7 + 3.1) * 43758.5; return v - Math.floor(v); };
/** light level: 1 = on. The panels stutter and die on "out", the very end dies out. */
export const lightLevel = (f: number) => {
  if (f >= B.out - 8 && f < B.out) return hash(Math.floor(f / 2)) < 0.5 ? 0.3 : 1;
  if (f >= B.out && f < 972) return 0.03;
  if (f >= TOTAL - 22) return f >= TOTAL - 10 ? 0 : hash(Math.floor(f / 2)) < 0.5 ? 0.15 : 1;
  return 1;
};
/** every monitor in the office: 0 off/normal, 1 = Dave */
export const screensDave = (f: number) => (f >= B.turnedOn + 3 && f < 1222 ? 1 : 0);

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
/** e: "glide" = smootherstep (slow drifts), "out" = reference ease-out burst (peak speed on frame 1) */
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
/** push-in factor since f0 (rate per frame, optional punch for n frames) */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Kevin's speed-walk down the aisle (shot 8) and the run to the fire exit (shot 21) */
export const walkZ = (f: number) => 2.2 - (Math.max(0, f - 449) / FPS) * 2.3;
export const RUN0: V3 = [31.7, 0, -5.6];
export const RUN1: V3 = [34.25, 0, -9.45];
export const runU = (f: number) => clamp01((f - 1226) / 30);
/** the locked door: Kevin arrives at full speed and hits the glass on HIT */
export const HIT = B.locked - 1;

const CAMS: Record<number, Key[]> = {
  // 1: CU Kevin (front-right of the table), Dave smiling soft in the background; burst push on "eleven"
  1: [
    { f: 0, s: (f) => dolly([1.55, 1.36, 2.35], add(P.kevin, [-0.05, 1.32, 0]), pushK(f, 0, 0.0016), { fov: 36 }) },
    { f: B.eleven1 - 2, e: "out", dur: 10, s: (f) => dolly([1.4, 1.38, 1.85], add(P.kevin, [-0.05, 1.38, 0]), pushK(f, B.eleven1, 0.0022), { fov: 36, roll: 0.07 }) },
  ],
  // 2: side MS, Kevin spins and bolts out of the right door; camera pans with him in a burst
  2: [
    { f: 124, s: (f) => ({ pos: [0.2, 1.3, 2.9], look: [1.5 + 0.004 * (f - 124), 1.15, 0.7], fov: 42 }) },
    { f: 131, e: "out", dur: 12, s: (f) => ({ pos: [0.6, 1.3, 2.9], look: [3.6 + 0.004 * (f - 131), 1.15, 1.35], fov: 42 }) },
  ],
  // 3: boss MS, she raises the mug; burst push on "announced"
  3: [
    { f: 154, s: (f) => dolly([-0.45, 1.3, 1.75], add(P.boss, [0.1, 1.22, 0]), pushK(f, 154, 0.0018), { fov: 38 }) },
    { f: B.announced - 2, e: "out", dur: 10, s: (f) => dolly([-0.55, 1.34, 1.35], add(P.boss, [0.1, 1.3, 0]), pushK(f, B.announced, 0.0018), { fov: 38 }) },
  ],
  // 4: Dave behind his chair-shaped cake; burst tilt down onto the cake on "cake shaped"
  4: [
    { f: 208, s: (f) => dolly([0.5, 1.25, 1.25], add(P.dave, [0.02, 1.15, 0]), pushK(f, 208, 0.0018), { fov: 42 }) },
    { f: B.cake - 2, e: "out", dur: 12, s: (f) => dolly([0.45, 1.3, 0.95], add(TABLE, [0.02, 0.36, -0.1]), pushK(f, B.cake, 0.002), { fov: 38, roll: -0.04 }) },
    { f: B.chair + 6, e: "out", dur: 12, s: (f) => dolly([0.45, 1.28, 1.05], add(P.dave, [0.02, 1.1, 0.25]), pushK(f, B.chair + 6, 0.0025), { fov: 40 }) },
  ],
  // 5: Kevin MS, 3/4 from the left: he looks over toward Dave and counts on his fingers
  5: [
    { f: 277, s: (f) => dolly([0.35, 1.38, 2.25], add(P.kevin, [0, 1.3, 0]), pushK(f, 277, 0.0018), { fov: 38 }) },
    { f: B.four - 2, e: "out", dur: 10, s: (f) => dolly([0.45, 1.38, 1.9], add(P.kevin, [0, 1.34, 0]), pushK(f, B.four, 0.0018), { fov: 38 }) },
  ],
  // 6: Dave x3, shoulder to shoulder (frontal MS); kicks when the copies pop in
  6: [{ f: 356, s: (f) => dolly([0.2, 1.3, 2.5], add(P.dave, [0, 1.1, 0]), pushK(f, 356, 0.0018, f >= B.third - 2 ? 0.005 : 0), { fov: 46 }) }],
  // 7: Kevin at the table edge: plate down, jacket grabbed (burst reframe on "grabbed")
  7: [
    { f: 403, s: (f) => dolly([2.4, 1.3, 2.1], add(P.kevin, [-0.1, 1.05, -0.2]), pushK(f, 403, 0.0018), { fov: 42 }) },
    { f: B.grabbed - 4, e: "out", dur: 11, s: (f) => dolly([2.0, 1.35, 2.3], add(P.kevin, [0.1, 1.15, 0]), pushK(f, B.grabbed, 0.002), { fov: 40 }) },
  ],
  // 8: tracking side-on down the aisle, Kevin speed-walking in profile against the cubicle dividers
  8: [{ f: 449, s: (f) => { const z = walkZ(f); return { pos: [OX + 1.5, 1.15, z - 0.12], look: [OX - 0.1, 0.98, z - 0.08], fov: 62 }; } }],
  // 9: from outside the glass exit door: Kevin arrives at full speed and SMACKS into it
  9: [{ f: 480, s: (f) => dolly([OX + 0.55, 1.4, EXIT_Z - 2.2], [OX + 0.42, 1.3, EXIT_Z + 0.6], pushK(f, 480, 0.003, f >= HIT ? 0.008 : 0, 14), { fov: 40 }) }],
  // 10: the lobby: Kevin tries the "window"; it is a poster and it falls off the wall; he turns to us
  10: [
    { f: 502, s: (f) => dolly([29.5, 1.42, -11.0], [32.5, 1.35, -12.3], pushK(f, 502, 0.0015), { fov: 46 }) },
    { f: B.poster + 4, e: "out", dur: 12, s: (f) => dolly([29.9, 1.35, -11.6], [32.6, 1.15, -12.6], pushK(f, B.poster + 4, 0.0015), { fov: 46, roll: 0.03 }) },
    { f: B.window2 - 6, e: "out", dur: 12, s: (f) => dolly([30.5, 1.42, -12.2], [32.2, 1.38, -12.75], pushK(f, B.window2, 0.0025), { fov: 40 }) },
  ],
  // 11: facing the elevator wall, Kevin in front of the call panel
  11: [{ f: 602, s: (f) => dolly([30.2, 1.4, -10.1], [27.4, 1.2, -10.9], pushK(f, 602, 0.0025), { fov: 44 }) }],
  // 12: ECU of the call panel: one single button; his finger comes in and presses it on "Monday"
  12: [
    { f: 645, s: (f) => dolly([27.82, 1.14, -10.86], [PANEL[0], PANEL[1], PANEL[2]], pushK(f, 645, 0.002), { fov: 34 }) },
    { f: B.monday - 4, e: "out", dur: 10, s: (f) => dolly([27.62, 1.12, -10.95], [PANEL[0], PANEL[1], PANEL[2]], pushK(f, B.monday, 0.002), { fov: 34, roll: -0.04 }) },
  ],
  // 13: low at the floor vent: Kevin crouched, he yanks the grate off on "vent"
  13: [
    { f: 726, s: (f) => dolly([31.25, 0.78, 9.25], [29.92, 0.38, 11.3], pushK(f, 726, 0.0022), { fov: 50 }) },
    { f: B.vent - 3, e: "out", dur: 10, s: (f) => dolly([30.95, 0.62, 9.7], [29.9, 0.32, 11.4], pushK(f, B.vent, 0.002), { fov: 48 }) },
  ],
  // 14: ECU into the vent: Dave, lying in the dark, eating cake, not blinking
  14: [{ f: 770, s: (f) => dolly([30.08, 0.3, 10.5], [30.0, 0.24, 11.72], pushK(f, 770, 0.0035, f >= B.eating - 2 ? 0.006 : 0, 14), { fov: 34 }) }],
  // 15: Kevin at his desk on the phone, coughing -> WHIP to the boss over the divider -> pull back to the two-shot
  15: [
    { f: 822, s: (f) => dolly([28.7, 1.25, 3.85], [26.0, 1.05, 3.2], pushK(f, 822, 0.002), { fov: 40 }) },
    { f: B.hisBoss + 1, e: "out", dur: 9, s: (f) => dolly([28.6, 1.78, 2.75], [25.65, 1.42, 0.78], pushK(f, B.hisBoss + 1, 0.0022), { fov: 40 }) },
    { f: B.nextDesk - 2, e: "out", dur: 14, s: (f) => dolly([31.0, 1.7, 1.95], [25.85, 1.2, 1.95], pushK(f, B.nextDesk, 0.0012), { fov: 52 }) },
  ],
  // 16: wide of the office, Kevin small at his desk; the panels stutter and die on "out"
  16: [{ f: 943, s: (f) => dolly([30.4, 1.95, 7.9], [26.8, 0.95, 2.4], pushK(f, 943, 0.002), { fov: 48 }) }],
  // 17: dark office from the aisle by the lobby; every monitor flicks on at once; Kevin small in the aisle
  17: [{ f: 972, s: (f) => dolly([30.05, 1.6, -8.9], [30.0, 1.0, 3.0], pushK(f, 972, 0.0025, f >= B.turnedOn - 2 ? 0.006 : 0, 18), { fov: 54 }) }],
  // 18: CU of one monitor: Dave. Burst punch on "Dave"
  18: [
    { f: 1063, s: (f) => dolly([28.52, 1.06, -2.87], [27.915, 1.02, -2.07], pushK(f, 1063, 0.002), { fov: 36 }) },
    { f: B.dave4 - 3, e: "out", dur: 9, s: (f) => dolly([28.27, 1.04, -2.54], [27.915, 1.02, -2.07], pushK(f, B.dave4, 0.002), { fov: 36, roll: 0.05 }) },
  ],
  // 19: Kevin in front, unaware; behind him the whole team turns around, one by one
  19: [{ f: 1094, s: (f) => dolly([30.25, 1.45, -6.25], [30.0, 1.3, -1.0], pushK(f, 1094, 0.0022), { fov: 44 }) }],
  // 20: slow push on the team, whispering; burst on "one more week"
  20: [
    { f: 1158, s: (f) => dolly([30.0, 1.42, -2.3], [30.0, 1.3, 1.3], pushK(f, 1158, 0.0025), { fov: 44 }) },
    { f: B.omw - 2, e: "out", dur: 11, s: (f) => dolly([30.0, 1.42, -1.4], [30.0, 1.32, 1.3], pushK(f, B.omw, 0.0025), { fov: 42, roll: -0.04 }) },
  ],
  // 21: the fire exit glowing green; Kevin sprints into frame and bursts through; light floods out
  21: [
    { f: 1222, s: (f) => dolly([31.1, 1.35, -8.0], [34.3, 1.2, -9.85], pushK(f, 1222, 0.002), { fov: 48 }) },
    { f: B.fireExit, e: "out", dur: 12, s: (f) => dolly([31.9, 1.35, -8.55], [34.45, 1.25, -9.95], pushK(f, B.fireExit, 0.003), { fov: 46 }) },
  ],
  // 22: POV from the doorway: the boss and Dave waiting across the table, an empty chair; burst on "performance"
  22: [
    { f: 1277, s: (f) => dolly([34.5, 1.45, -10.2], [34.5, 1.12, -13.3], pushK(f, 1277, 0.0018), { fov: 46 }) },
    { f: B.performance - 3, e: "out", dur: 12, s: (f) => dolly([34.5, 1.35, -11.2], [34.5, 1.1, -13.4], pushK(f, B.performance, 0.0022), { fov: 42 }) },
  ],
  // 23: Kevin at his desk, window behind him, time-lapse
  23: [{ f: 1375, s: (f) => dolly([DESK[0] + 2.8, 1.45, DESK[2] + 0.6], add(DESK, [-0.4, 1.0, 0]), pushK(f, 1375, 0.0012), { fov: 40 }) }],
  // 24: the vent again, ten years later: the new hire crouches and yanks the grate
  24: [
    { f: 1568, s: (f) => dolly([28.75, 0.78, 9.25], [30.08, 0.38, 11.3], pushK(f, 1568, 0.0022), { fov: 50 }) },
    { f: 1597, e: "out", dur: 10, s: (f) => dolly([29.05, 0.62, 9.7], [30.1, 0.32, 11.4], pushK(f, 1597, 0.002), { fov: 48 }) },
  ],
  // 25: into the vent: Kevin, grey, glasses, moustache, eating cake. Slow creep to the end
  25: [
    { f: 1622, s: (f) => dolly([29.93, 0.3, 10.5], [30.0, 0.24, 11.72], pushK(f, 1622, 0.0035), { fov: 34 }) },
    { f: 1660, dur: 40, s: (f) => dolly([29.93, 0.3, 10.5], [30.0, 0.25, 11.72], pushK(f, 1622, 0.0035) * pushK(f, 1660, 0.002), { fov: 34, roll: -0.05 }) },
  ],
};
/** impact kicks: flip sign each frame, decay over 7 f */
const KICKS: [number, number][] = [[B.eleven1, 0.012], [B.chair, 0.01], [B.almost, 0.01], [B.third, 0.012], [HIT, 0.03],
  [B.poster + 9, 0.012], [B.monday + 1, 0.01], [B.vent, 0.014], [B.out, 0.012], [B.turnedOn + 3, 0.012], [B.dave4, 0.01],
  [B.fireExit + 2, 0.012], [B.opened, 0.008], [B.review, 0.01], [B.vent2 - 26, 0.012]];
const SH_BY_ID = new Map(SHOTS.map((s) => [s.id, s]));
/** whip pan yaw (rad) at frame f of shot id */
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

// ---------------- lens blur per beat (cInf px at 1080 wide; focus point) ----------------
export type Dof = { cInf: number; focus?: (f: number) => V3 };
export const dofAt = (f: number): Dof => {
  const id = shotAt(f).id;
  switch (id) {
    case 1: return { cInf: 14, focus: () => add(P.kevin, [0, 1.42, 0]) };
    case 3: return { cInf: 11, focus: () => add(P.boss, [0, 1.42, 0]) };
    case 4: return { cInf: 11, focus: () => (f < B.cake ? add(P.dave, [0, 1.4, 0]) : add(TABLE, [0, 0.2, 0])) };
    case 5: return { cInf: 12, focus: () => add(P.kevin, [0, 1.42, 0]) };
    case 7: return { cInf: 9 };
    case 10: return { cInf: 7 };
    case 12: return { cInf: 13, focus: () => PANEL };
    case 14: case 25: return { cInf: 14, focus: () => [30, 0.25, 11.72] };
    case 15: return { cInf: 7 };
    case 18: return { cInf: 12, focus: () => [27.915, 1.02, -2.07] };
    case 19: return { cInf: 10, focus: () => [30.0, 1.42, -3.9] };
    case 20: return { cInf: 9 };
    case 22: return { cInf: 8, focus: () => [34.5, 1.15, -13.3] };
    case 23: return { cInf: 6 };
    default: return { cInf: 0 };
  }
};
