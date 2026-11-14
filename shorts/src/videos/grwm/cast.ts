// Our office cast as lit flat sprites in the 3D office (machinery from the bridge short: canvas pool, yaw billboards
// shaded by cardShade(), contact blobs, unlit effect cards, all on the NOINK layer).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxContact, fxShadow, fxBurst, fxSplash, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, V3, smooth, clamp01, SHOTS, B, DESK, A_BED, A_SINK, A_EAT, A_DRESS, A_DOOR, ROACH, TCAR, ISLAND, SX, LAND, CEIL_VENT, CHAD_WORDS, frozen, dragAt, dragU, strutAt, dreamCar } from "./story";
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
  pop?: number[]; sq?: [number, number]; roll?: number };
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
  if (o.roll) pl.roll = o.roll;
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

// ---------------- the GRWM cast ----------------
const TREVOR_HOME: Outfit = { jacket: "#e8e2d4", shirt: "#e8e2d4", pants: "#5a5a72", boots: "#c9c4b8", hat: "hair", hair: "#2a1a14", skin: SKINS[3] };
const TREVOR: Outfit = { jacket: "#56648a", shirt: "#f0eee8", tie: "#c0353a", lanyard: "#3e7fd2", pants: "#3b3f52", boots: "#2a2530", hat: "hair", hair: "#2a1a14", skin: SKINS[3] };
const TREVOR_DREAM: Outfit = { jacket: "#f0a030", shirt: "#f7e070", pants: "#e8e2d4", boots: "#c9a070", hat: "hair", hair: "#2a1a14", skin: SKINS[3], shades: true };
const CHAD: Outfit = { jacket: "#7fd0f0", shirt: "#ffffff", lanyard: "#e04848", pants: "#c9b48a", boots: "#f4f2ec", hat: "hair", hair: "#e8c060", skin: SKINS[0], build: "stout" };
const GUARD: Outfit = { jacket: "#1e2230", shirt: "#f4f4f4", tie: "#1e2230", pants: "#1e2230", boots: "#141414", hat: "cap", cap: "#1e2230", skin: SKINS[2], build: "stout" };
const GUARD2: Outfit = { ...GUARD, skin: SKINS[1] };
const MANAGER: Outfit = { jacket: "#5a4a3a", shirt: "#ffffff", tie: "#a03030", pants: "#3b3f52", boots: "#2a2530", moustache: "#3a2a1a", skin: SKINS[1], build: "stout" };
const DAVE_MESSY: Outfit = { ...DAVE, tie: undefined };
const INTERN: Outfit = NEWHIRE;
const ITGUY: Outfit = { ...TEAM[4], glasses: true, hat: "hair", hair: "#3a2a1a", moustache: undefined };
const cast2 = new Map<Outfit, string>();
const as = (o: Outfit, i: number): Who => { let k = cast2.get(o); if (!k) { k = JSON.stringify(o); cast2.set(o, k); } return { i, o, okey: k }; };
/** lip flap: open / closed mouth pair, swapped every few frames while a line plays */
const talk = (f: number, a: number, b: number, open: Expr, shut: Expr) => (f >= a && f < b && Math.floor((f - a) / 3) % 3 !== 2 ? open : shut);
/** the roach: brown bean body, six legs, antennae, a tiny smile and a tiny mug (fx card 300 x 200) */
const roachDraw = (wave: number) => (p: Pen) => {
  for (const [x, dx] of [[120, -40], [150, -30], [180, -20]] as const) { p.stroke([[x, 130], [x + dx, 178]], 6, INK); p.stroke([[x, 130], [x - dx * 0.4 + 30, 182]], 6, INK); }
  p.ell(150, 120, 70, 42, "#7a4626", 6);
  p.stroke([[150, 84], [150, 160]], 3, "#4a2a16");
  p.ell(218, 104, 30, 28, "#8a5634", 6);
  p.stroke([[232, 80], [250 + 20 * wave, 20]], 4, INK); p.stroke([[222, 80], [222 + 10 * wave, 18]], 4, INK);
  p.dot(226, 98, 5); p.dot(240, 96, 5);
  p.arc(234, 110, 9, 6, 20, 160, 3);
  p.poly([[248, 120], [266, 120], [264, 146], [250, 146]], "#e04848", 4);
};
const fxAt = (out: Stage, key: string, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, rot = 0, cw = 300, ch = 300) =>
  out.fx.push({ key, cw, ch, draw, x, y, z, w, h, rot });
/** a "ding" star burst behind a shouted word */
const ding = (out: Stage, f: number, x: number, y: number, z: number, s = 1) => {
  for (const w of CHAD_WORDS) {
    const d = f - w;
    if (d >= 0 && d < 8) { const k = Math.round((d / 8) * 8) / 8; fxAt(out, `ding|${k}`, (p) => fxBurst(p, k), x, y, z, 0.9 * s, 0.9 * s); }
  }
};

// ---------------- staging per shot ----------------
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  FNOW = f;
  LNAME = "day";
  findSun(cam, SUN);
  const fF = frozen(f) ? B.freeze : f, tF = T(fF), t = T(f);
  const trev = (o: Outfit) => as(o, 0);
  const chad = as(CHAD, 5), linda = as(BOSS, 2), g1 = as(GUARD, 6), g2 = as(GUARD2, 7), mgr = as(MANAGER, 8);
  /** the drag (shots 1 and 26): guards haul him backwards to the exit; he yells over his shoulder at the manager */
  const drag = (u: number, yellA: number, yellB: number) => {
    const p = dragAt(u), ph = (fF / FPS) * 1.6 % 1, fr = frozen(f);
    put(out, cam, g1, p[0] - 0.62, p[2] - 0.15, tF, { expr: "stern", mode: fr ? "stand" : "march", phase: ph, lift: 40, facing: 1, look: 1, blinks: !fr });
    put(out, cam, g2, p[0] + 0.62, p[2] - 0.15, tF, { expr: "stern", mode: fr ? "stand" : "march", phase: (ph + 0.5) % 1, lift: 40, facing: -1, look: -1, blinks: !fr });
    const toCam = f >= B.h2 - 3 && id === 1;
    put(out, cam, trev(TREVOR), p[0], p[2], toCam ? t : tF, {
      expr: toCam ? talk(f, B.h2, B.h2E, "grin", "smile") : talk(fF, yellA, yellB, "yell", "stern"), arms: toCam ? undefined : "shrug",
      tilt: toCam ? 0 : -9, facing: toCam ? 0 : 1, look: toCam ? 0 : 1, pop: [yellA, B.freeze, B.h2 - 2], blinks: toCam || !frozen(f) });
    put(out, cam, mgr, 31.3, -6.4, tF, { expr: fF > yellA + 30 ? "shock" : "stern", facing: -1, look: -1, pop: [yellA + 30], blinks: !frozen(f) });
  };
  switch (id) {
    case 1: drag(dragU(1, f), B.h1, B.h1E); break;
    case 26: drag(dragU(26, f), B.h1b, B.h1bE); break;
    case 2: // on the mattress edge, to the phone
      put(out, cam, trev(TREVOR_HOME), A_BED[0], A_BED[2], t, { mode: "sit", y: 0.08, expr: f < B.h3 ? "dead" : talk(f, B.h3, B.h3E, "grin", "smile"), pop: [B.h3 - 2], noBlob: true });
      break;
    case 3: { // skincare: splash
      const up = f >= B.g1 - 4 && f < B.splash + 2;
      put(out, cam, trev(TREVOR_HOME), A_SINK[0], A_SINK[2], t, { expr: f < B.splash ? talk(f, B.g1, B.g1E, "grin", "smile") : "pained", prop: up ? "mugUp" : "mug", pop: [B.splash] });
      if (f >= B.splash && f < B.splash + 10) { const k = Math.round(((f - B.splash) / 10) * 10) / 10; fxAt(out, `splash|${k}`, (p) => fxSplash(p, k), A_SINK[0] - 0.12, 1.55, A_SINK[2], 0.6, 0.6); }
      break;
    }
    case 4: { // breakfast: sniff... eat it anyway
      const bite = f < B.bite - 6 ? 0.55 : f < B.bite + 8 ? 1 : 0.3;
      put(out, cam, trev(TREVOR_HOME), A_EAT[0], A_EAT[2], t, { expr: f < B.g2E ? talk(f, B.g2, B.g2E, "grin", "smile") : f < B.bite + 2 ? "stare" : "chew", prop: "pizza", bite, pop: [B.bite] });
      break;
    }
    case 5: { // outfit: the sniff test
      const sniff = f >= B.sniff - 8 && f < B.g3b - 2;
      put(out, cam, trev(TREVOR_HOME), A_DRESS[0], A_DRESS[2], t, { expr: f < B.g3aE ? talk(f, B.g3a, B.g3aE, "grin", "smile") : sniff ? "pained" : talk(f, B.g3b, B.g3bE, "smile", "fakecalm"),
        prop: "shirt", bite: sniff ? 1 : 0.2, pop: [B.sniff, B.g3b] });
      break;
    }
    case 6: // the mess, wide: dressed, at the door
      put(out, cam, trev(TREVOR), A_DOOR[0], A_DOOR[2], t, { expr: "dead", facing: -1, look: -1, prop: "badge" });
      break;
    case 7: { // the roach on the pizza box: chilling. Pays the same rent.
      const wave = Math.sin(f * 0.35);
      fxAt(out, `roach|${Math.round(wave * 4)}`, roachDraw(Math.round(wave * 4) / 4), ROACH[0], ROACH[1] + 0.045, ROACH[2], 0.15, 0.1, 0, 300, 200);
      break;
    }
    case 8: case 9: case 14: { // in the car
      const look = id === 14 && f >= B.c1 - 3;
      put(out, cam, trev(TREVOR), TCAR[0] - 0.32, TCAR[2] + 0.42, t, { mode: "sit", y: 0.42, noBlob: true,
        expr: id === 14 && f < B.honk + 10 ? "shock" : look ? talk(f, B.c1, B.c1E, "stern", "dead") : "dead", facing: look ? 0 : 0, pop: [B.honk + 1, B.c1 - 2] });
      if (id === 14 && f < B.honk + 8) { const k = Math.round(((f - B.honk) / 8) * 8) / 8; fxAt(out, `honk|${k}`, (p) => fxBurst(p, k, "#fff3b0", 12), TCAR[0], 1.4, TCAR[2] - 2.2, 1.6, 1.6); }
      break;
    }
    case 10: case 11: case 12: { // the daydream drive
      const c = dreamCar(f), cs = Math.cos(c.yaw), sn = Math.sin(c.yaw);
      // driver seat offset (-0.32, 0.42) in car space; car heading -z rotated by yaw to the right
      const lx = -0.32, lz = 0.42, x = c.pos[0] + lx * cs - lz * -sn * -1, z = c.pos[2] + lz * cs + lx * sn;
      put(out, cam, trev(TREVOR_DREAM), x, z, t, { mode: "sit", y: c.pos[1] + 0.42, noBlob: true, expr: f >= B.launch - 8 && f < B.launch + 30 ? "laugh" : "smile_closed", pop: [B.launch, B.wings] });
      break;
    }
    case 13: // the beach
      put(out, cam, trev(TREVOR_DREAM), ISLAND[0], ISLAND[2], t, { mode: "sit", y: ISLAND[1] + 0.05, expr: "smile_closed", prop: "coconut", pop: [B.beach + 2] });
      break;
    case 15: { // the cubicle slump; Chad's arrival is heard
      put(out, cam, trev(TREVOR), DESK[0], DESK[2], t, { mode: "sit", y: 0.3, expr: f < B.n3b ? "dead" : "stare", noBlob: true, pop: [B.n3b] });
      if (f >= B.n3b) put(out, cam, chad, 30.3, 5.8, t, { expr: "grin", arms: "shrug", pop: [B.n3b + 4] });
      break;
    }
    case 16: { // Chad marches in, way too loud
      const u = smooth((f - 1025) / 30), x = 30.3 + (28.95 - 30.3) * u, z = 5.8 + (3.25 - 5.8) * u;
      put(out, cam, trev(TREVOR), DESK[0], DESK[2], t, { mode: "sit", y: 0.3, expr: "stare", noBlob: true, pop: [CHAD_WORDS[0]] });
      put(out, cam, chad, x, z, t, u < 1 ? { walk: [28.95 - 30.3, 3.25 - 5.8], expr: "grin", mode: "march", phase: (f / FPS * 1.8) % 1, side: { mode: "march", phase: (f / FPS * 1.8) % 1, stride: 0.9, expr: "grin" } }
        : { expr: talk(f, B.d1, B.d1E, "laugh", "grin"), arms: f % 40 < 20 ? "shrug" : undefined, wave: 1, pop: CHAD_WORDS });
      if (u >= 1) ding(out, f, 28.95, 1.75, 3.1, 1);
      break;
    }
    case 17: // Chad CU: the cold plunge
      put(out, cam, chad, 28.95, 3.25, t, { expr: talk(f, B.d2, B.d2E, "laugh", "grin"), arms: f % 46 < 24 ? "shrug" : undefined, pop: CHAD_WORDS });
      ding(out, f, 28.95, 1.75, 3.1, 0.9);
      break;
    case 18: { // the twitch, one per shouted word; the narrator leans in
      let tw = false;
      for (const w of CHAD_WORDS) if (f - w >= 0 && f - w < 5) tw = true;
      put(out, cam, trev(TREVOR), DESK[0], DESK[2], t, { mode: "sit", y: 0.3, noBlob: true, expr: tw ? "twitch" : f >= B.n4 ? "stare" : "dead",
        facing: f >= B.n4 + 20 ? 0 : 0, headTilt: tw ? 4 : 0, pop: [...CHAD_WORDS.filter((w) => w >= 1250), B.n4 + 20] });
      break;
    }
    case 19: { // the snap: he stands, the room goes quiet
      const up = f >= B.stand + 6;
      put(out, cam, trev(TREVOR), DESK[0], DESK[2], t, up ? { expr: talk(f, B.s1a, B.s1aE, "stern", "stern") === "stern" && f >= B.s1b ? talk(f, B.s1b, B.s1bE, "yell", "stern") : "stern", facing: 1, look: 1, pop: [B.stand + 6, 1464] }
        : { mode: "sit", y: 0.3, expr: "stare", noBlob: true });
      put(out, cam, chad, 28.95, 3.25, t, { expr: f < B.s1b + 40 ? "grin" : f < 1466 ? "nervous" : "shock", facing: -1, look: -1, pop: [B.stand + 6, 1466] });
      break;
    }
    case 20: case 21: case 22: case 23: case 24: { // the roast strut
      const p = strutAt(f), ph = (f / FPS * 1.4) % 1;
      const [a, b] = id === 20 ? [B.r1, B.r1E] : id === 21 ? [B.r2, B.r2E] : id === 22 ? [B.r3, B.r3E] : id === 23 ? [B.r4, B.r4E] : [B.r5, B.r5E];
      const side = id === 21 || id === 23 ? 1 : -1;
      put(out, cam, trev(TREVOR), p[0], p[2], t, { expr: talk(f, a, b, "yell", "grin"), mode: "march", phase: ph, lift: 50, facing: side as -1 | 1, look: side, arms: f > a + 10 && f < b - 10 ? "reach" : undefined });
      const hit = b - 12;
      if (id === 20) put(out, cam, chad, 28.95, 3.25, t, { expr: f < hit ? "grin" : "shock", facing: 1, look: 1, pop: [hit] });
      if (id === 21) put(out, cam, linda, 31.15, -0.85, t, { expr: f < hit ? "smile" : "shock", prop: "folder", facing: -1, look: -1, pop: [hit] });
      if (id === 22) put(out, cam, as(ITGUY, 4), 28.85, -3.4, t, { expr: f < hit ? "nervous" : "shock", prop: "mug", facing: 1, look: 1, pop: [hit] });
      if (id === 23) put(out, cam, as(INTERN, 3), 31.15, -5.95, t, { expr: f < hit ? "fakecalm" : "shock", prop: "plate", facing: -1, look: -1, pop: [hit] });
      if (id === 24) put(out, cam, as(DAVE_MESSY, 1), CEIL_VENT[0], CEIL_VENT[2], t, { y: 3.72, roll: Math.PI, expr: f < hit ? "smile" : "shock", noBlob: true, pop: [hit] });
      break;
    }
    case 25: { // security closes in: the earpiece
      const p = strutAt(B.grab), u = smooth((f - B.grab) / 14);
      put(out, cam, trev(TREVOR), p[0], p[2], t, { expr: talk(f, B.r6, B.r6E, "yell", "stern"), facing: -1, look: -1, arms: "shrug", pop: [B.grab + 2, B.r6E - 20] });
      put(out, cam, g1, p[0] - 1.4 + 0.78 * u, p[2] - 0.15, t, { expr: f < B.r6E - 20 ? "stern" : "nervous", facing: 1, look: 1, pop: [B.grab, B.r6E - 20] });
      put(out, cam, g2, p[0] + 1.4 - 0.78 * u, p[2] - 0.15, t, { expr: "stern", facing: -1, look: -1, pop: [B.grab] });
      put(out, cam, mgr, 31.3, -6.4, t, { expr: "stern", facing: -1, look: -1 });
      break;
    }
    case 27: { // tossed out the door: an arc to the pavement
      const u = clamp01((f - 2106) / 10);
      if (f >= 2104) {
        const x = SX - 0.3 + (LAND[0] - SX + 0.3) * u, z = 0.4 + (LAND[2] - 0.4) * u, y = 0.5 + 1.1 * Math.sin(Math.PI * u) * (1 - u * 0.3) - 0.08 * u;
        put(out, cam, trev(TREVOR), x, z, t, { y, expr: "panic", roll: -1.57 * u - 0.6 * Math.sin(Math.PI * u), noBlob: true, pop: [B.land] });
      }
      if (f < 2122) for (const [o, dx] of [[g1, -0.7], [g2, 0.55]] as const) put(out, cam, o, SX + dx, 0.6, t, { expr: "stern", arms: "reach", y: 0.12 });
      break;
    }
    case 28: case 29: { // on the pavement. Then the sun comes out. Like and subscribe.
      const talkE = id === 29 ? talk(f, B.e1, B.e1E, "grin", "smile_closed") : "dazed";
      put(out, cam, trev(TREVOR), LAND[0], LAND[2], t, { y: LAND[1] + 0.22, expr: f < B.song2 + 6 ? "dazed" : talkE, roll: -1.57, noBlob: true, pop: [B.song2 + 6, B.e1 - 2] });
      break;
    }
  }
  return out;
};
