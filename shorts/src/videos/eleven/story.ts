// "Eleven Years": timeline, set layout and camera grammar. Times come from the voice word timings
// (projects/eleven/voice/words.json, 30 fps). Camera grammar from the bridge short: hard cuts on big reframes,
// smootherstep glides 18-40 f, every hold creeps in, 7-frame flip kicks on impacts, 4-5 deg rolls on beats.
import type { Light } from "./lights";

export const FPS = 30;
export const TOTAL = 2065;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
/** frame of a voice time (s) */
export const F = (t: number) => Math.round(t * FPS);

// ---------------- set layout (metres, floor y = 0) ----------------
/** break room (main): x -4.5..4.5, z -3.5..3.5, ceiling 2.9 */
export const CEIL = 2.9;
export const TABLE: V3 = [0, 0.76, -0.3];
/** office floor: x 24..36, z -10..12 cubicles; lobby x 27..33, z -14..-10; exit door in z = -14 */
export const OX = 30;
export const EXIT_Z = -14;
export const STAIR: V3 = [33, 0, -12];  // stair door in the lobby's right wall (opens into mini break room 1)
export const ELEV: V3 = [27, 0, -12];   // elevator in the lobby's left wall (opens onto mini break room 2)
export const PRINTER: V3 = [35.3, 0, 0.2];
export const DESK: V3 = [25.9, 0, 3.1]; // Kevin's desk (time-lapse, cell z 3.2), window wall at x = 24 behind him
/** where the two copies of the break room sit (their table centres) */
export const M1: V3 = [36.6, 0.76, -12.2];
export const M2: V3 = [23.4, 0.76, -12.2];

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

// ---------------- shots ----------------
export type Set = "break" | "office" | "desk";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: Set };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 133, light: "office", set: "break" },        // hook: Kevin hears "eleven years"
  { id: 2, a: 133, b: 197, light: "office", set: "break" },      // ...and bolts for the door
  { id: 3, a: 197, b: 335, light: "office", set: "break" },      // Monday, team round the sheet cake
  { id: 4, a: 335, b: 398, light: "office", set: "break" },      // boss raises her mug
  { id: 5, a: 398, b: 475, light: "office", set: "break" },      // Dave, eleven years
  { id: 6, a: 475, b: 513, light: "office", set: "break" },      // everyone claps
  { id: 7, a: 513, b: 604, light: "office", set: "break" },      // Dave smiles, never blinks
  { id: 8, a: 604, b: 712, light: "office", set: "break" },      // Kevin does the math
  { id: 9, a: 712, b: 807, light: "office", set: "break" },      // three Daves back to back
  { id: 10, a: 807, b: 885, light: "office", set: "break" },     // puts down cake, grabs jacket
  { id: 11, a: 885, b: 967, light: "office", set: "office" },    // walks very calmly to the exit
  { id: 12, a: 967, b: 1005, light: "dim", set: "office" },      // the door is locked
  { id: 13, a: 1005, b: 1100, light: "dim", set: "office" },     // stairs -> break room
  { id: 14, a: 1100, b: 1196, light: "dim", set: "office" },     // elevator -> break room
  { id: 15, a: 1196, b: 1229, light: "horror", set: "office" },  // lights flicker
  { id: 16, a: 1229, b: 1299, light: "horror", set: "office" },  // printer prints by itself
  { id: 17, a: 1299, b: 1335, light: "horror", set: "office" },  // behind him...
  { id: 18, a: 1335, b: 1426, light: "horror", set: "office" },  // the whole team, still, holding cake
  { id: 19, a: 1426, b: 1494, light: "horror", set: "office" },  // luckily, the badge
  { id: 20, a: 1494, b: 1580, light: "horror", set: "office" },  // unluckily, eleven years
  { id: 21, a: 1580, b: 1810, light: "office", set: "desk" },    // one more week, 570 times
  { id: 22, a: 1810, b: 1946, light: "office", set: "break" },   // ten years later, a new hire
  { id: 23, a: 1946, b: TOTAL, light: "office", set: "break" },  // Kevin just smiles
];
export const XFADE: Record<number, number> = { 21: 10, 22: 10 };
export const FLASH_AT = 197;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story beats (frames) ----------------
export const B = {
  eleven1: F(3.42), leave: F(4.81), raises: F(11.66), dave: F(13.67), eleven2: F(14.84), claps: F(15.91),
  three: F(24.9), puts: F(27.38), grabs: F(28.52), walks: F(29.91), locked: F(32.44), stairsOpen: F(34.95),
  elevOpen: F(38.42), flicker: F(40.12), printer: F(41.59), behind: F(43.28), team: F(44.13), lucky: F(48.23),
  badge: F(50.92), eleven3: F(51.66), week: F(56.92), seventy: F(59.15), newhire: F(61.72), eleven4: F(63.9),
  kevinSmiles: F(64.91), end: TOTAL,
};
/** light flicker: 1 = on. Shot 15 strobes, shots 16-20 stutter now and then, the very end dies out. */
export const lightLevel = (f: number) => {
  const h = (k: number) => { const v = Math.sin(k * 91.7 + 3.1) * 43758.5; return v - Math.floor(v); };
  if (f >= B.flicker - 3 && f < 1229) { const k = Math.floor((f - B.flicker + 3) / 2); return h(k) < 0.45 ? 0.12 : 1; }
  if (f >= 1229 && f < 1580) { const k = Math.floor(f / 3); return h(k) < 0.06 ? 0.25 : 1; }
  if (f >= 1010 && f < 1196) { const k = Math.floor(f / 3); return h(k + 7) < 0.04 ? 0.5 : 1; }
  if (f >= TOTAL - 26) { const k = Math.floor(f / 2); return f >= TOTAL - 10 ? 0 : h(k) < 0.5 ? 0.15 : 1; }
  return 1;
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
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
    cur = k.cut ? full(k.s(f)) : mixC(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
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
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const EYE = 1.42; // adult eye height

/** Kevin's walk down the office aisle (shot 11): from the break-room door end of the floor to the exit */
/** Kevin in the aisle for shots 15-20, the team lined up behind him toward the lobby */
export const KEV_AISLE: V3 = [OX + 0.1, 0, -4.2];
export const walkZ = (f: number) => 7.5 - (Math.max(0, f - 885) / 30) * 1.25;

const CAMS: Record<number, Key[]> = {
  // 1: CU Kevin (front-right of the table), Dave smiling soft in the background; punch on "eleven"
  1: [
    { f: 0, s: (f) => dolly([1.55, 1.36, 2.35], add(P.kevin, [-0.05, 1.32, 0]), pushK(f, 0, 0.0018, B.eleven1 <= f ? 0.006 : 0), { fov: 36 }) },
    { f: B.eleven1 - 4, dur: 20, s: (f) => dolly([1.55, 1.36, 2.35], add(P.kevin, [-0.05, 1.36, 0]), pushK(f, 0, 0.0018) * pushK(f, B.eleven1 - 4, 0.004, 0.009), { fov: 36, roll: 0.07 }) },
  ],
  // 2: side MS, Kevin spins and speed-walks out of the right door; camera pans with him
  2: [
    { f: 133, s: (f) => ({ pos: [0.2, 1.3, 2.9], look: [1.5 + 0.012 * (f - 133), 1.15, 0.7], fov: 42 }) },
    { f: 150, dur: 30, s: (f) => ({ pos: [0.6, 1.3, 2.9], look: [3.2 + 0.004 * (f - 150), 1.15, 1.3], fov: 42 }) },
  ],
  // 3: establishing wide of the break room (from the front corner), creeping push
  3: [{ f: 197, s: (f) => dolly([2.9, 2.05, 3.1], [-0.2, 0.95, -0.6], pushK(f, 197, 0.0016), { fov: 46 }) }],
  // 4: boss MS, low-ish, she raises the mug
  4: [{ f: 335, s: (f) => dolly([-0.45, 1.3, 1.75], add(P.boss, [0.1, 1.2, 0]), pushK(f, 335, 0.002, f >= B.raises ? 0.005 : 0), { fov: 38 }) }],
  // 5: Dave behind the cake; punch on "eleven years"
  5: [{ f: 398, s: (f) => dolly([0.55, 1.2, 1.2], add(P.dave, [0, 1.12, 0]), pushK(f, 398, 0.0018, f >= B.eleven2 - 3 ? 0.006 : 0), { fov: 38 }) }],
  // 6: wide clapping, from behind-left of Kevin's side
  6: [{ f: 475, s: (f) => dolly([-0.3, 1.75, 2.9], [0.1, 1.0, -0.8], pushK(f, 475, 0.0025), { fov: 44, roll: -0.03 }) }],
  // 7: ECU Dave, long slow creep, slight roll
  7: [
    { f: 513, s: (f) => dolly([0.35, 1.46, 0.0], add(P.dave, [0, 1.42, 0]), pushK(f, 513, 0.0035), { fov: 32 }) },
    { f: 560, dur: 40, s: (f) => dolly([0.35, 1.46, 0.0], add(P.dave, [0, 1.44, 0]), pushK(f, 513, 0.0035) * pushK(f, 560, 0.002), { fov: 32, roll: 0.06 }) },
  ],
  // 8: Kevin MS, 3/4 from the left: he looks over toward Dave and does the math
  8: [{ f: 604, s: (f) => dolly([0.35, 1.38, 2.25], add(P.kevin, [0, 1.3, 0]), pushK(f, 604, 0.002), { fov: 38 }) }],
  // 9: three Daves shoulder to shoulder (frontal MS), a kick when the clones pop in
  9: [{ f: 712, s: (f) => dolly([0.2, 1.3, 2.5], add(P.dave, [0, 1.1, 0]), pushK(f, 712, 0.0018), { fov: 46 }) }],
  // 10: Kevin at the table edge: plate down, jacket grabbed
  10: [
    { f: 807, s: (f) => dolly([2.4, 1.3, 2.1], add(P.kevin, [-0.1, 1.05, -0.2]), pushK(f, 807, 0.0018), { fov: 42 }) },
    { f: B.grabs - 6, dur: 22, s: (f) => dolly([2.0, 1.35, 2.3], add(P.kevin, [0.1, 1.15, 0]), pushK(f, B.grabs, 0.002), { fov: 40 }) },
  ],
  // 11: tracking backwards down the aisle in front of Kevin, coworkers in the cubicles turn to watch
  11: [{ f: 885, s: (f) => { const z = walkZ(f); return { pos: [OX + 0.25, 1.5, z - 3.1], look: [OX, 1.15, z], fov: 44 }; } }],
  // 12: from outside the glass exit door, Kevin rattles it; kicks on the rattles
  12: [{ f: 967, s: (f) => dolly([OX + 0.6, 1.4, EXIT_Z - 2.3], [OX + 0.42, 1.3, EXIT_Z + 0.6], pushK(f, 967, 0.003), { fov: 40 }) }],
  // 13: side-on in the lobby: Kevin (profile, facing right) opens the stair door -> break room behind it
  13: [
    { f: 1005, s: (f) => dolly([28.3, 1.45, -11.7], [33.0, 1.25, -11.95], pushK(f, 1005, 0.0015), { fov: 46 }) },
    { f: B.stairsOpen + 6, dur: 28, s: (f) => dolly([28.6, 1.45, -11.75], [36.5, 1.15, -12.05], pushK(f, B.stairsOpen + 6, 0.0035), { fov: 44 }) },
  ],
  // 14: facing the elevator, Kevin at frame right; the doors slide open onto the break room
  14: [
    { f: 1100, s: (f) => dolly([30.6, 1.4, -11.0], [27.3, 1.25, -12.0], pushK(f, 1100, 0.0015), { fov: 46 }) },
    { f: B.elevOpen + 6, dur: 28, s: (f) => dolly([30.4, 1.4, -11.3], [25.6, 1.2, -12.1], pushK(f, B.elevOpen + 6, 0.0035), { fov: 44 }) },
  ],
  // 15: wide down the dark aisle, strobing lights, Kevin small in the middle
  15: [{ f: 1196, s: (f) => dolly([OX + 1.2, 2.2, -8.6], [OX, 1.0, 1.5], pushK(f, 1196, 0.003), { fov: 46, roll: 0.04 }) }],
  // 16: printer CU, pages shooting out
  16: [{ f: 1229, s: (f) => dolly([PRINTER[0] - 1.7, 1.25, PRINTER[2] + 0.9], add(PRINTER, [0.1, 0.95, 0]), pushK(f, 1229, 0.003), { fov: 40, roll: -0.05 }) }],
  // 17: Kevin CU, slowly realising something is behind him
  17: [{ f: 1299, s: (f) => dolly([OX + 0.9, 1.42, -2.6], [OX + 0.1, 1.38, -4.2], pushK(f, 1299, 0.004), { fov: 36 }) }],
  // 18: reverse: the team in a line across the aisle, holding cake, slow push
  18: [{ f: 1335, s: (f) => dolly([OX + 0.15, 1.35, -3.6], [OX, 1.15, -8.8], pushK(f, 1335, 0.0028), { fov: 44 }) }],
  // 19: Kevin holds his badge up, relieved
  19: [{ f: 1426, s: (f) => dolly([OX + 0.6, 1.32, -2.6], [OX + 0.1, 1.2, -4.2], pushK(f, 1426, 0.0025), { fov: 38 }) }],
  // 20: ECU of the badge, tally marks filling to eleven, Kevin soft behind
  20: [{ f: 1494, s: (f) => dolly([OX + 0.25, 1.28, -3.1], [OX + 0.08, 1.24, -3.75], pushK(f, 1494, 0.002, f >= B.eleven3 - 3 ? 0.006 : 0), { fov: 34 }) }],
  // 21: Kevin at his desk, window behind him, time-lapse
  21: [{ f: 1575, s: (f) => dolly([DESK[0] + 2.8, 1.45, DESK[2] + 0.6], add(DESK, [-0.4, 1.0, 0]), pushK(f, 1575, 0.0012), { fov: 40 }) }],
  // 22: break room again, ten years later; the new hire next to Kevin
  22: [{ f: 1805, s: (f) => dolly([0.85, 1.5, 2.7], [0.3, 1.2, -1.3], pushK(f, 1805, 0.0018, f >= B.eleven4 - 3 ? 0.005 : 0), { fov: 50 }) }],
  // 23: ECU Kevin, the same creep as Dave's in shot 7
  23: [
    { f: 1946, s: (f) => dolly([0.35, 1.46, 0.0], add(P.dave, [0, 1.42, 0]), pushK(f, 1946, 0.0035), { fov: 32 }) },
    { f: 1990, dur: 40, s: (f) => dolly([0.35, 1.46, 0.0], add(P.dave, [0, 1.44, 0]), pushK(f, 1946, 0.0035) * pushK(f, 1990, 0.002), { fov: 32, roll: -0.06 }) },
  ],
};
/** impact kicks: flip sign each frame, decay over 7 f */
const KICKS: [number, number][] = [[B.eleven1, 0.012], [B.locked - 2, 0.02], [B.locked + 8, 0.016], [B.locked + 18, 0.014], [B.three, 0.012],
  [B.stairsOpen + 2, 0.01], [B.elevOpen + 4, 0.01], [1335, 0.008], [B.eleven3 + 2, 0.012], [B.eleven4, 0.008]];
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f);
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
    case 4: return { cInf: 11, focus: () => add(P.boss, [0, 1.42, 0]) };
    case 5: return { cInf: 11, focus: () => add(P.dave, [0, 1.42, 0]) };
    case 7: return { cInf: 15, focus: () => add(P.dave, [0, 1.42, 0]) };
    case 8: return { cInf: 12, focus: () => add(P.kevin, [0, 1.42, 0]) };
    case 10: return { cInf: 9 };
    case 16: return { cInf: 10 };
    case 17: case 19: return { cInf: 13, focus: () => [OX + 0.1, 1.42, -4.2] };
    case 20: return { cInf: 14, focus: () => [OX + 0.08, 1.24, -3.75] };
    case 21: return { cInf: 6 };
    case 23: return { cInf: 15, focus: () => add(P.dave, [0, 1.42, 0]) };
    default: return { cInf: 0 };
  }
};
