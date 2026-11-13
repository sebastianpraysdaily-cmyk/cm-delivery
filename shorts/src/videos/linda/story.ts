// "Friday Night Inventory": timeline, set layout and camera grammar. Times come from the voice word timings
// (projects/linda/voice/words.json, 30 fps). Camera grammar measured from the reference (STYLE_BIBLE "Camera"):
// ~80 % of frames are holds with a slow creep, moves are EASE-OUT BURSTS (peak speed on the first frame, settled in
// 8-12 f), place changes inside one location are WHIP PANS (5 f ease-in out of shot A, 7 f ease-out into shot B) with
// camera motion blur, impacts get 7-frame flip kicks.
import type { Light } from "./lights";

export const FPS = 30;
export const TOTAL = 1470;
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
export const FIRE: V3 = [34.5, 0, -10];   // supply-closet door in the office's back wall (closet: x 33..36, z -14..-10)
export const ROOM_TABLE: V3 = [34.5, 0.74, -12.5]; // middle of the supply closet
export const BOARD: V3 = [30, 1.65, 11.9];  // the conspiracy cork board above the vent (faces -z)
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
  night: 65, die: 126, flicker: 160, leave: 236, noise: 283, closet: 307, inside: 327, linda: 375, dave: 399,
  breathing: 443, inventory: 513, ran: 547, opened: 594, again: 614, intern: 667, still: 682, vent: 743, linda3: 752,
  itguy: 814, third: 851, team: 978, out: 1011, hand: 1047, turned: 1084, slowly: 1109, linda4: 1143, winked: 1164,
  oh: 1190, fuck: 1201, you: 1228, ho: 1238, monday: 1273, unpro: 1332, byLinda: 1369, closet2: 1402, end: TOTAL,
};

// ---------------- shots ----------------
export type Set = "break" | "office" | "desk";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: Set };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 74, light: "dim", set: "office" },        // the empty office at night, Kevin small at his desk
  { id: 2, a: 74, b: 138, light: "dim", set: "office" },      // POV through the plant: something watches him. "die" zoom
  { id: 3, a: 138, b: 206, light: "dim", set: "office" },     // the lights start flickering
  { id: 4, a: 206, b: 247, light: "dim", set: "office" },     // a smart person would leave (he glances at the exit)
  { id: 5, a: 247, b: 327, light: "dim", set: "office" },     // the tiptoe to the closet door
  { id: 6, a: 327, b: 436, light: "dim", set: "office" },     // door opens: Linda and Dave
  { id: 7, a: 436, b: 538, light: "dim", set: "office" },     // breathing very hard. "inventory"
  { id: 8, a: 538, b: 582, light: "dim", set: "office" },     // Kevin runs for the elevator (whip in)
  { id: 9, a: 582, b: 717, light: "dim", set: "office" },     // doors open: Linda and the intern. Still inventory
  { id: 10, a: 717, b: 752, light: "dim", set: "office" },    // the vent
  { id: 11, a: 752, b: 838, light: "dim", set: "office" },    // Linda in the vent with the IT guy
  { id: 12, a: 838, b: 933, light: "dim", set: "office" },    // the conspiracy board: Linda at the centre of everyone
  { id: 13, a: 933, b: 988, light: "dim", set: "office" },    // pull back: Kevin made the board
  { id: 14, a: 988, b: 1011, light: "dim", set: "office" },   // Kevin at the board...
  { id: 15, a: 1011, b: 1078, light: "dark", set: "office" }, // lights out; a hand on his shoulder
  { id: 16, a: 1078, b: 1131, light: "dark", set: "office" }, // he turns around, slowly
  { id: 17, a: 1131, b: 1190, light: "dark", set: "office" }, // it's Linda. She winks
  { id: 18, a: 1190, b: 1266, light: "dark", set: "office" }, // "Oh, fuck. You a ho."
  { id: 19, a: 1266, b: 1369, light: "office", set: "office" }, // Monday: written up
  { id: 20, a: 1369, b: TOTAL, light: "office", set: "office" }, // by Linda. In the supply closet.
];
export const XFADE: Record<number, number> = { 19: 10 };
/** shots that start with a whip pan from the previous shot: +1 pans right, -1 left */
export const WHIPS: Record<number, number> = { 8: 1, 11: -1 };
export const FLASH_AT = -100;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

const hash = (k: number) => { const v = Math.sin(k * 91.7 + 3.1) * 43758.5; return v - Math.floor(v); };
/** light level: 1 = on. Flicker from "flickering", stutters now and then, dies on "out"; the end fades out */
export const lightLevel = (f: number) => {
  if (f >= B.flicker && f < 206) return hash(Math.floor(f / 2)) < 0.4 ? 0.15 : 1;
  if (f >= 206 && f < B.out - 8) return hash(Math.floor(f / 3) + 5) < 0.03 ? 0.4 : 1;
  if (f >= B.out - 8 && f < B.out) return hash(Math.floor(f / 2)) < 0.5 ? 0.25 : 1;
  if (f >= TOTAL - 10) return 0;
  return 1;
};
export const screensDave = (_f: number) => 0;

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

/** the tiptoe to the closet door (shot 5) and the run to the elevator (shot 8) */
export const TIP0: V3 = [31.6, 0, -8.85];
export const TIP1: V3 = [34.2, 0, -9.45];
export const tipU = (f: number) => clamp01((f - 249) / 60);
export const RUN0: V3 = [30.3, 0, -8.6];
export const RUN1: V3 = [28.25, 0, -11.2];
export const runU = (f: number) => clamp01((f - 539) / 34);
/** Kevin at the board (shots 13-18) and Linda behind him in the dark */
export const KB: V3 = [31.0, 0, 10.65];
export const LB: V3 = [31.85, 0, 10.95];
/** the closet: Linda and Dave (shots 6-7), Monday (19-20) */
export const CL_LINDA: V3 = [34.28, 0, -12.45];
export const CL_DAVE: V3 = [34.78, 0, -12.55];
/** the elevator car (behind the lobby's left wall): Linda and the intern */
export const CAR_LINDA: V3 = [26.15, 0, -12.28];
export const CAR_INTERN: V3 = [26.25, 0, -11.75];

const CAMS: Record<number, Key[]> = {
  // 1: wide, the dark office at night; Kevin small under his monitor
  1: [{ f: 0, s: (f) => dolly([30.7, 2.15, 9.6], [26.4, 0.95, 3.0], pushK(f, 0, 0.0022), { fov: 50 }) }],
  // 2: POV through a plant: something is watching him. Horror zoom on "die"
  2: [
    { f: 74, s: (f) => ({ ...dolly([28.35, 1.18, 4.75], [26.0, 1.1, 3.1], pushK(f, 74, 0.0018)), fov: 38, roll: 0.0 }) },
    { f: B.die - 3, e: "out", dur: 10, s: (f) => dolly([27.35, 1.2, 3.8], [25.95, 1.12, 3.1], pushK(f, B.die, 0.002), { fov: 30, roll: 0.09 }) },
  ],
  // 3: low under the flickering panels, Kevin looking up
  3: [{ f: 138, s: (f) => dolly([27.65, 0.98, 4.55], [26.1, 1.55, 2.7], pushK(f, 138, 0.002), { fov: 52, roll: -0.05 }) }],
  // 4: Kevin MS: a smart person would leave (he glances at the exit... and stays)
  4: [{ f: 206, s: (f) => dolly([28.0, 1.25, 3.35], [26.0, 1.12, 3.1], pushK(f, 206, 0.0025), { fov: 40 }) }],
  // 5: the tiptoe to the closet door; slow creeping push
  5: [
    { f: 247, s: (f) => dolly([35.45, 1.3, -9.3], [32.0, 1.1, -8.85], pushK(f, 247, 0.0022), { fov: 50, roll: 0.03 }) },
    { f: B.closet - 4, e: "out", dur: 12, s: (f) => dolly([35.55, 1.35, -8.85], [34.35, 1.25, -9.75], pushK(f, B.closet, 0.003), { fov: 46, roll: 0.05 }) },
  ],
  // 6: POV from the doorway: Linda and Dave in the closet. Bursts on "Linda" and "Dave"
  6: [
    { f: 327, s: (f) => dolly([34.5, 1.45, -10.2], [34.5, 1.15, -12.8], pushK(f, 327, 0.0018), { fov: 46 }) },
    { f: B.linda - 3, e: "out", dur: 10, s: (f) => dolly([34.42, 1.42, -10.9], [34.3, 1.35, -12.45], pushK(f, B.linda, 0.002), { fov: 40 }) },
    { f: B.dave - 3, e: "out", dur: 10, s: (f) => dolly([34.6, 1.42, -10.9], [34.75, 1.3, -12.55], pushK(f, B.dave, 0.002), { fov: 40 }) },
  ],
  // 7: the two-shot, breathing very hard; burst on "inventory"
  7: [
    { f: 436, s: (f) => dolly([34.52, 1.38, -11.0], [34.53, 1.28, -12.5], pushK(f, 436, 0.002), { fov: 42 }) },
    { f: B.inventory - 3, e: "out", dur: 10, s: (f) => dolly([34.45, 1.38, -11.35], [34.32, 1.3, -12.45], pushK(f, B.inventory, 0.002), { fov: 40, roll: -0.05 }) },
  ],
  // 8: the lobby: Kevin sprints for the elevator (whip in)
  8: [{ f: 538, s: (f) => dolly([31.2, 1.35, -13.1], [28.6, 1.1, -10.6], pushK(f, 538, 0.002), { fov: 50 }) }],
  // 9: facing the elevator; the doors slide open: Linda again, with the intern; burst on "again"
  9: [
    { f: 582, s: (f) => dolly([30.6, 1.4, -11.0], [27.3, 1.25, -12.0], pushK(f, 582, 0.0018), { fov: 46 }) },
    { f: B.again - 3, e: "out", dur: 11, s: (f) => dolly([29.9, 1.4, -11.35], [26.2, 1.25, -12.0], pushK(f, B.again, 0.002), { fov: 40 }) },
  ],
  // 10: low at the vent: Kevin yanks the grate
  10: [
    { f: 717, s: (f) => dolly([31.25, 0.78, 9.25], [29.92, 0.38, 11.3], pushK(f, 717, 0.0022), { fov: 50 }) },
    { f: B.vent - 3, e: "out", dur: 9, s: (f) => dolly([30.95, 0.62, 9.7], [29.9, 0.32, 11.4], pushK(f, B.vent, 0.002), { fov: 48 }) },
  ],
  // 11: ECU into the vent: Linda and the IT guy (whip in)
  11: [
    { f: 752, s: (f) => dolly([30.05, 0.32, 10.05], [30.0, 0.25, 11.72], pushK(f, 752, 0.003), { fov: 44 }) },
    { f: B.itguy - 3, e: "out", dur: 9, s: (f) => dolly([30.12, 0.3, 10.45], [30.15, 0.25, 11.72], pushK(f, B.itguy, 0.002), { fov: 40 }) },
  ],
  // 12: the conspiracy board: a slow pan across the photos to Linda in the middle
  12: [
    { f: 838, s: (f) => dolly([29.45, 1.66, 10.15], [29.4, 1.66, BOARD[2]], pushK(f, 838, 0.001), { fov: 40, roll: 0.03 }) },
    { f: 852, dur: 70, s: (f) => dolly([29.98, 1.66, 10.3], [30.0, 1.64, BOARD[2]], pushK(f, 852, 0.0035), { fov: 40, roll: -0.02 }) },
  ],
  // 13: pull back: Kevin made the board
  13: [
    { f: 933, s: (f) => dolly([30.9, 1.45, 8.4], [30.55, 1.4, 11.3], pushK(f, 933, 0.002), { fov: 50 }) },
    { f: B.team - 3, e: "out", dur: 10, s: (f) => dolly([31.0, 1.45, 9.0], [30.85, 1.38, 11.0], pushK(f, B.team, 0.002), { fov: 44 }) },
  ],
  // 14-15: CU Kevin at the board; the lights die; a hand lands on his shoulder
  14: [{ f: 988, s: (f) => dolly([31.15, 1.45, 9.05], [31.0, 1.42, 10.65], pushK(f, 988, 0.002), { fov: 40 }) }],
  15: [
    { f: 1011, s: (f) => dolly([31.15, 1.45, 9.05], [31.0, 1.42, 10.65], pushK(f, 988, 0.002) * pushK(f, 1011, 0.002), { fov: 40 }) },
    { f: B.hand - 3, e: "out", dur: 10, s: (f) => dolly([31.2, 1.45, 9.4], [31.1, 1.4, 10.65], pushK(f, B.hand, 0.0025), { fov: 40, roll: 0.06 }) },
  ],
  // 16: he turns around... slowly (glacial creep)
  16: [{ f: 1078, s: (f) => dolly([31.1, 1.44, 9.45], [31.0, 1.42, 10.65], pushK(f, 1078, 0.0035), { fov: 38, roll: 0.04 }) }],
  // 17: reverse: Linda in the dark, lit from below. Horror zoom on "Linda", hold for the wink
  17: [
    { f: 1131, s: (f) => dolly([31.6, 1.5, 9.2], [31.85, 1.45, 10.95], pushK(f, 1131, 0.002), { fov: 42 }) },
    { f: B.linda4 - 3, e: "out", dur: 10, s: (f) => dolly([31.75, 1.5, 9.85], [31.85, 1.47, 10.95], pushK(f, B.linda4, 0.0015), { fov: 40, roll: -0.06 }) },
  ],
  // 18: Kevin: "Oh, fuck." ... "You a ho." Meme zoom on "ho"
  18: [
    { f: 1190, s: (f) => dolly([31.1, 1.44, 9.3], [31.0, 1.42, 10.65], pushK(f, 1190, 0.002), { fov: 40 }) },
    { f: B.ho - 4, e: "out", dur: 7, s: (f) => dolly([31.02, 1.44, 10.0], [31.0, 1.43, 10.65], pushK(f, B.ho, 0.001), { fov: 40, roll: 0.1 }) },
  ],
  // 19: Monday, daylight: Kevin on a crate in the supply closet, Linda writing him up
  19: [{ f: 1261, s: (f) => dolly([35.25, 1.35, -10.55], [34.55, 1.0, -12.85], pushK(f, 1261, 0.0018), { fov: 50 }) }],
  // 20: "By Linda" push to her; "In the supply closet" burst pull back to the door frame
  20: [
    { f: 1369, s: (f) => dolly([35.2, 1.4, -11.6], [34.92, 1.38, -12.95], pushK(f, 1369, 0.002), { fov: 40 }) },
    { f: B.closet2 - 8, e: "out", dur: 14, s: (f) => dolly([34.5, 1.5, -9.4], [34.5, 1.05, -12.6], pushK(f, B.closet2, 0.0012), { fov: 50 }) },
  ],
};
/** impact kicks: flip sign each frame, decay over 7 f */
const KICKS: [number, number][] = [[B.die, 0.014], [B.inside, 0.01], [B.linda, 0.008], [B.dave, 0.008], [B.inventory, 0.008], [B.opened + 2, 0.01],
  [B.still, 0.008], [B.vent, 0.012], [B.itguy, 0.008], [B.team, 0.012], [B.out, 0.012], [B.hand, 0.016], [B.linda4, 0.012], [B.oh, 0.012],
  [B.ho, 0.02], [B.byLinda, 0.008]];
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
    case 2: return { cInf: 13, focus: () => [25.9, 1.3, 3.1] };
    case 4: return { cInf: 10, focus: () => [25.9, 1.3, 3.1] };
    case 6: case 7: return { cInf: 9, focus: () => [34.5, 1.4, -12.5] };
    case 9: return { cInf: 7 };
    case 11: return { cInf: 13, focus: () => [30, 0.25, 11.72] };
    case 12: return { cInf: 6, focus: () => [30, 1.65, 11.9] };
    case 14: case 15: case 16: case 18: return { cInf: 13, focus: () => [KB[0], 1.42, KB[2]] };
    case 17: return { cInf: 13, focus: () => [LB[0], 1.42, LB[2]] };
    case 19: return { cInf: 6 };
    case 20: return { cInf: 6 };
    default: return { cInf: 0 };
  }
};
