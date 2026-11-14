// Our office cast as lit flat sprites in the 3D office (machinery from the bridge short: canvas pool, yaw billboards
// shaded by cardShade(), contact blobs, unlit effect cards, all on the NOINK layer).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxContact, fxShadow, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, V3, smooth, clamp01, SHOTS, B, DESK, ELEV, TIP0, TIP1, tipU, RUN0, RUN1, runU, KB, LB, CL_LINDA, CL_DAVE, CAR_LINDA, CAR_INTERN } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
export const SU_SWING = 2.3 / 1830; // swing canvas: rope of 1830 units = 2.3 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
  /** squash and stretch about the feet (1 = none) */
  sx?: number; sy?: number;
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
/** head-shape seed per character */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day"; // office -> "day" contact colours, horror -> "golden" (cool, soft)
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
/** the sun of the world that is calling: the attached root whose sun target sits on this camera's view axis */
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

/** ground shadow under a standing / sitting card (review rounds 2-4), multiply, blue-violet: a TIGHT contact pool right under
 *  the feet (~.5 on screen at the core) so nobody floats, plus by day (cards cast no real shadow) a lighter soft tail
 *  stretched AWAY from the sun, length ~1.6 m / tan(sun elevation), capped. Golden: world.ts casts real card shadows. */
const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h; // feet at v = .2 of the card
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};


// ---------------- our cast ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
const KEVIN: Outfit = { jacket: "#6d9ad6", shirt: "#ffffff", tie: "#d84a3a", lanyard: "#3e7fd2", pants: "#3b3f52", boots: "#2a2530", hat: "hair", hair: "#6a3f22", skin: SKINS[0] };
export const DAVE: Outfit = { jacket: "#c9b48a", shirt: "#f4f1ea", tie: "#5a7a3a", lanyard: "#3e7fd2", pants: "#5a5048", boots: "#3a2a20", hat: "hair", hair: "#9a9aa0", glasses: true, build: "stout", skin: SKINS[1] };
const BOSS: Outfit = { jacket: "#3a3f5c", dress: "#7b5ac9", pants: "#3b3f52", boots: "#2a2530", hat: "hair", hair: "#2a1e1a", skin: SKINS[2] };
const NEWHIRE: Outfit = { jacket: "#f08a2c", shirt: "#ffffff", pants: "#3b5b9a", boots: "#f4f1ea", hat: "hair", hair: "#e0b050", lanyard: "#3e7fd2", skin: SKINS[0] };
const TEAM: Outfit[] = [
  { jacket: "#e07a3a", shirt: "#ffffff", pants: "#3b3f52", boots: "#2a2530", hat: "hair", hair: "#1e1a18", skin: SKINS[3] },
  { jacket: "#f2e2c0", dress: "#3f9a8a", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#c9893a", skin: SKINS[0] },
  { jacket: "#5d7a3a", shirt: "#f0f0f0", tie: "#2a3a5a", pants: "#3d4440", boots: "#2a2530", hat: "hair", hair: "#3a2a1a", skin: SKINS[2] },
  { jacket: "#c25a7a", shirt: "#fff4e8", pants: "#3b3f52", boots: "#2a2530", hat: "hair", hair: "#5a3b2a", skin: SKINS[1] },
  { jacket: "#2f5f6a", shirt: "#ffffff", tie: "#e8c45a", pants: "#3b3f52", boots: "#2a2530", moustache: "#2a201a", skin: SKINS[1] },
];
/** Kevin ten years on: Dave's cardigan, glasses, moustache, grey */
const kevinAt = (f: number): Outfit => {
  if (f < 1505) return KEVIN;
  const o: Outfit = { ...KEVIN, moustache: "#4a3020" };
  if (f >= 1525) Object.assign(o, { glasses: true, jacket: "#c9b48a", tie: "#5a7a3a" });
  if (f >= 1545) o.hair = "#9a9aa0";
  return o;
};
type Id = "kevin" | "dave" | "boss" | "new" | "t1" | "t2" | "t3" | "t4" | "t5";
const IDX: Record<Id, number> = { kevin: 0, dave: 1, boss: 2, new: 3, t1: 4, t2: 5, t3: 6, t4: 7, t5: 8 };
const outfitOf = (id: Id, f: number): Outfit =>
  id === "kevin" ? kevinAt(f) : id === "dave" ? DAVE : id === "boss" ? BOSS : id === "new" ? NEWHIRE : TEAM[Number(id[1]) - 1];
const okeys = new Map<Outfit, string>();
const who = (id: Id, f: number, i = IDX[id]): Who => {
  const o = outfitOf(id, f);
  let k = okeys.get(o);
  if (!k) { k = JSON.stringify(o); okeys.set(o, k); }
  return { i, o, okey: k };
};

type Opt = FrontOpts & { blinks?: boolean; y?: number; scale?: number; noBlob?: boolean; walk?: [number, number]; side?: SideOpts;
  /** reaction frames: 3 f of anticipation (squash) then a decaying stretch overshoot over ~12 f */
  pop?: number[]; sq?: [number, number] };
let FNOW = 0;
/** squash/stretch factor (sy) at d frames from a reaction */
export const popAt = (d: number, amt = 0.13) => {
  if (d < -3 || d > 16) return 1;
  if (d < 0) return 1 - 0.05 * Math.sin((Math.PI * (d + 3)) / 3);
  return 1 + amt * Math.exp(-d / 3.5) * Math.cos(d * 0.75);
};
/** one character at (x, z): front view by default; `walk` (direction) picks front/side by the camera like the bridge */
const put = (out: Stage, cam: CamInfo, w: Who, x: number, z: number, t: number, o: Opt = {}) => {
  const lid = o.blinks === false ? 0 : lidAt(t, w.i);
  const y = o.y ?? 0;
  const view = o.walk ? viewOf(cam, x, z, o.walk[0], o.walk[1]) : { side: !!o.side, mirror: false, fs: 1 };
  if (o.side && !o.walk) view.mirror = (o.side as SideOpts & { left?: boolean }).left ?? false;
  const fo: FrontOpts = { mode: "stand", ...o, blink: lid };
  const so: SideOpts = { mode: "stand", expr: o.expr, blink: lid, ...(o.side ?? {}) };
  const pl = person(cam, w, x, y, z, view, fo, so, o.scale ?? 1);
  let sy = 1;
  for (const p0 of o.pop ?? []) sy *= popAt(FNOW - p0);
  pl.sy = sy * (o.sq ? o.sq[1] : 1); pl.sx = (o.sq ? o.sq[0] : 1) / Math.sqrt(sy);
  out.places.push(pl);
  if (!o.noBlob) blob(out, x, y, z, o.scale ?? 1, 0.9);
};
const T = (f: number) => f / FPS;
const before = (f: number, b: number, a: Expr, c: Expr) => (f < b - 2 ? a : c);

// ---------------- effects ----------------
/** wall calendar for the time-lapse: days crossed off as the weeks fly */
const calDraw = (n: number) => (p: Pen) => {
  p.poly([[10, 10], [290, 10], [290, 330], [10, 330]], "#ffffff", 6);
  p.poly([[10, 10], [290, 10], [290, 70], [10, 70]], "#d84a3a", 5);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
    const x = 26 + c * 38, y = 88 + r * 46, i = r * 7 + c;
    p.poly([[x, y], [x + 32, y], [x + 32, y + 38], [x, y + 38]], "#f4f1ea", 2);
    if (i < n) { p.stroke([[x + 4, y + 4], [x + 28, y + 34]], 4, "#c0353a"); p.stroke([[x + 28, y + 4], [x + 4, y + 34]], 4, "#c0353a"); }
  }
};

// ---------------- spoof props ----------------
const DAVE_MESSY: Outfit = { ...DAVE, tie: undefined };
const INTERN: Outfit = NEWHIRE;
const ITGUY: Outfit = { ...TEAM[4], glasses: true };
const cast2 = new Map<Outfit, string>();
const as = (o: Outfit, i: number): Who => { let k = cast2.get(o); if (!k) { k = JSON.stringify(o); cast2.set(o, k); } return { i, o, okey: k }; };
/** Linda's hand on Kevin's shoulder: purple sleeve from screen left, red nails (fx card 300 x 180) */
const handDraw = (p: Pen) => {
  p.band([[0, 92], [150, 96]], "#7b5ac9", 56, 5, "butt");
  p.ell(186, 96, 44, 36, "#ecd0b6", 5);
  for (const [dy, len] of [[-28, 52], [-10, 60], [8, 58], [26, 48]] as const) {
    p.band([[212, 96 + dy], [212 + len, 96 + dy + 6]], "#ecd0b6", 16, 4, "round");
    p.ell(212 + len - 2, 96 + dy + 6, 6, 5, "#d8262c", 0);
  }
  p.band([[170, 70], [200, 44]], "#ecd0b6", 16, 4, "round");
};
/** the wink sparkle */
const sparkDraw = (p: Pen) => {
  p.poly([[100, 0], [114, 86], [200, 100], [114, 114], [100, 200], [86, 114], [0, 100], [86, 86]], "#fff6c0", 6);
};
/** heavy breathing: fast squash/stretch */
const pant = (f: number, k: number, amt = 0.045): [number, number] => { const a = amt * Math.sin(f * 0.75 + k); return [1 - 0.6 * a, 1 + a]; };

// ---------------- staging per shot ----------------
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], t = T(f);
  FNOW = f;
  LNAME = s.light === "horror" || s.light === "dark" ? "golden" : "day";
  findSun(cam, SUN);
  const linda = as(BOSS, 2), kev = who("kevin", 0);
  switch (id) {
    case 1: case 2:
      put(out, cam, kev, DESK[0], DESK[2], t, { mode: "sit", y: 0.3, expr: "neutral", noBlob: true });
      break;
    case 3:
      put(out, cam, kev, DESK[0], DESK[2], t, { mode: "sit", y: 0.3, expr: f < B.flicker + 2 ? "neutral" : "nervous", look: 0, headTilt: f > B.flicker ? -4 : 0, noBlob: true, pop: [B.flicker + 2] });
      break;
    case 4: {
      const glance = f >= 212 && f < 230;
      put(out, cam, kev, DESK[0], DESK[2], t, { mode: "sit", y: 0.3, noBlob: true, expr: glance ? "nervous" : "fakecalm", facing: glance ? 1 : f >= 230 ? -1 : 0, look: glance ? 1 : f >= 230 ? -1 : 0, pop: [212, 230] });
      break;
    }
    case 5: { // the horror-movie tiptoe
      const u = tipU(f), x = TIP0[0] + (TIP1[0] - TIP0[0]) * u, z = TIP0[2] + (TIP1[2] - TIP0[2]) * u, ph = ((f - 249) / FPS * 0.9) % 1;
      if (u < 1) put(out, cam, kev, x, z, t, { walk: [TIP1[0] - TIP0[0], TIP1[2] - TIP0[2]], expr: "nervous", mode: "march", phase: ph, lift: 90,
        side: { mode: "march", phase: ph, stride: 0.55, stomp: 0.2, expr: "nervous" } });
      else put(out, cam, kev, TIP1[0], TIP1[2], t, { expr: "nervous", arms: "door", facing: 1, look: 1, pop: [B.closet] });
      break;
    }
    case 6: case 7: { // Linda and Dave in the closet, breathing very hard
      const caught = f < B.inside + 6;
      const up = id === 7 && f >= B.inventory - 2;
      put(out, cam, linda, CL_LINDA[0], CL_LINDA[2], t, { expr: caught ? "shock" : up ? "smile_closed" : "fakecalm", prop: up ? "folder" : null, facing: 1,
        sq: pant(f, 0), pop: [B.inside + 1, B.linda, B.inventory - 2] });
      put(out, cam, as(DAVE_MESSY, 1), CL_DAVE[0], CL_DAVE[2], t, { expr: caught ? "shock" : "nervous", facing: -1, blinks: true, sq: pant(f, 1.7, 0.05), pop: [B.inside + 2, B.dave] });
      break;
    }
    case 8: { // the sprint
      const u = runU(f), x = RUN0[0] + (RUN1[0] - RUN0[0]) * u, z = RUN0[2] + (RUN1[2] - RUN0[2]) * u, ph = ((f - 539) / FPS * 2.1) % 1;
      put(out, cam, kev, x, z, t, u < 1 ? { walk: [RUN1[0] - RUN0[0], RUN1[2] - RUN0[2]], expr: "panic", mode: "march", phase: ph,
        side: { mode: "march", phase: ph, stride: 1.3, stomp: 0.4, expr: "panic" } } : { expr: "panic", pop: [573] });
      break;
    }
    case 9: { // the elevator: Linda again, now with the intern. Still inventory
      put(out, cam, kev, 28.85, -11.1, t, { expr: f < B.opened + 2 ? "nervous" : f < B.still ? "shock" : "stare", facing: -1, look: -1, pop: [B.opened + 2, B.still] });
      if (f >= B.opened - 8) {
        put(out, cam, linda, CAR_LINDA[0], CAR_LINDA[2], t, { expr: f < B.still - 2 ? "smile" : "smile_closed", prop: f >= B.still - 2 ? "folder" : null, sq: pant(f, 0.4), pop: [B.again, B.still - 2] });
        put(out, cam, as(INTERN, 3), CAR_INTERN[0], CAR_INTERN[2], t, { expr: "nervous", facing: 1, look: 1, sq: pant(f, 2.1, 0.05), pop: [B.intern] });
      }
      break;
    }
    case 10: { // the vent from outside: crouch, yank the grate
      const f0 = B.vent - 4;
      put(out, cam, kev, 29.58, 11.02, t, { mode: "sit", y: -0.02, expr: f < f0 + 6 ? "fakecalm" : "shock", facing: 1, look: 1,
        arms: f >= f0 - 14 && f < f0 + 4 ? "reach" : undefined, tilt: f >= f0 - 2 && f < f0 + 10 ? -8 * Math.sin(Math.PI * (f - f0 + 2) / 12) : 0, pop: [f0, f0 + 6] });
      if (f >= f0 + 4) {
        put(out, cam, linda, 29.86, 11.72, t, { y: -0.64, scale: 0.62, expr: "smile_closed", noBlob: true } as Opt);
        put(out, cam, as(ITGUY, 4), 30.16, 11.74, t, { y: -0.64, scale: 0.62, expr: "nervous", noBlob: true } as Opt);
      }
      break;
    }
    case 11: // Linda and the IT guy, in the vent
      put(out, cam, linda, 29.86, 11.72, t, { y: -0.64, scale: 0.62, expr: f < B.itguy ? "smile_closed" : "smile", sq: pant(f, 0, 0.03), noBlob: true, pop: [753] } as Opt);
      put(out, cam, as(ITGUY, 4), 30.16, 11.74, t, { y: -0.64, scale: 0.62, expr: "nervous", facing: -1, sq: pant(f, 1.3, 0.035), noBlob: true, pop: [B.itguy] } as Opt);
      break;
    case 13: case 14:
      put(out, cam, kev, KB[0], KB[2], t, { expr: id === 13 ? "stare" : "fakecalm", pop: [B.team] });
      break;
    case 15: case 16: { // lights out; the hand
      const turned = id === 16 && f >= 1098;
      if (turned) put(out, cam, kev, KB[0], KB[2], t, { expr: "panic", side: { mode: "stand", expr: "panic", left: true } as SideOpts, pop: [1098] });
      else put(out, cam, kev, KB[0], KB[2], t, { expr: id === 15 && f < B.hand ? "nervous" : "panic", facing: id === 16 ? 1 : 0, look: id === 16 ? 1 : 0, pop: [B.out + 1, B.hand] });
      const hu = id === 15 ? smooth((f - (B.hand - 10)) / 10) : 1;
      if (hu > 0) out.fx.push({ key: "hand", cw: 300, ch: 180, draw: handDraw, x: KB[0] + 0.62 - 0.4 * hu, y: 1.2 - 0.02 * hu, z: KB[2] - 0.05, w: 0.3, h: 0.18, rot: 0.1 * (1 - hu) });
      break;
    }
    case 17: { // it's Linda. She winks
      const wink = f >= B.winked - 2 && f < B.winked + 14;
      put(out, cam, linda, LB[0], LB[2], t, { expr: wink ? "wink" : "creepy", blinks: false, pop: [B.linda4, B.winked - 2] });
      if (f >= B.winked && f < B.winked + 12) {
        const k = (f - B.winked) / 12, sz = 0.09 * Math.sin(Math.PI * k);
        out.fx.push({ key: "spark", cw: 200, ch: 200, draw: sparkDraw, x: LB[0] + 0.12, y: 1.52, z: LB[2] - 0.08, w: sz, h: sz, rot: k * 2 });
      }
      break;
    }
    case 18: { // "Oh, fuck. ... You a ho."
      const expr: Expr = f < B.oh - 2 ? "panic" : f < B.you - 2 ? (f < B.fuck - 1 ? "shock" : "panic") : "stare";
      put(out, cam, kev, KB[0], KB[2], t, { expr, blinks: f < B.you - 2, pop: [B.oh - 2, B.fuck - 1, B.you - 2, B.ho] });
      break;
    }
    case 19: case 20: { // Monday: written up. By Linda. In the supply closet
      put(out, cam, kev, 34.12, -12.62, t, { mode: "sit", y: 0.24, expr: "stare", noBlob: true });
      const wink = id === 20 && f >= B.byLinda + 4 && f < B.byLinda + 22;
      put(out, cam, linda, 34.92, -12.95, t, { expr: wink ? "wink" : "smile", prop: "folder", facing: -1, look: -1, pop: [B.byLinda + 4] });
      if (id === 20 && f >= B.closet2 - 4) put(out, cam, as(DAVE_MESSY, 1), 33.78, -11.55, t, { expr: "smile", facing: -1, look: -1, sq: pant(f, 0.9, 0.04), pop: [B.closet2 - 2] });
      break;
    }
  }
  return out;
};
