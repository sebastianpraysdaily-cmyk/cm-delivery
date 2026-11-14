// Our office cast as lit flat sprites in the 3D office (machinery from the bridge short: canvas pool, yaw billboards
// shaded by cardShade(), contact blobs, unlit effect cards, all on the NOINK layer).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxContact, fxShadow, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, V3, smooth, clamp01, SHOTS, P, B, OX, EXIT_Z, PANEL, VENT, FIRE, ROOM_TABLE, DESK, BOSS_DESK, walkZ, RUN0, RUN1, runU, HIT } from "./story";
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

/** break room crowd (main room at the origin): shots 1-5 and 7 */
const breakroom = (out: Stage, cam: CamInfo, f: number, id: number) => {
  const t = T(f);
  const team: [Id, V3][] = [["t1", P.t1], ["t2", P.t2], ["t3", P.t3], ["t4", P.t4], ["t5", P.t5]];
  const bolt = id === 2 || id === 7;
  team.forEach(([n, p], k) => {
    let expr: Expr = k % 2 ? "smile" : "smile_closed";
    let facing: -1 | 0 | 1 = p[0] < 0 ? 1 : -1;
    if (bolt) { expr = "stare"; facing = 1; }
    if (id === 1 || id === 3) expr = k % 2 ? "smile" : "grin";
    put(out, cam, who(n, f), p[0], p[2], t, { expr, prop: k % 2 ? "plate" : null, facing, look: bolt ? 1 : 0, pop: bolt ? [B.escape + k] : [] });
  });
  const bossUp = (id === 3 && f >= B.raises - 2) || id === 4;
  put(out, cam, who("boss", f), P.boss[0], P.boss[2], t, { expr: bolt ? "stare" : "grin", prop: bossUp ? "mugUp" : "mug", facing: 1, look: bolt ? 1 : 0,
    pop: [B.raises - 2, B.announced] });
  put(out, cam, who("dave", f), P.dave[0], P.dave[2], t, { expr: "creepy", blinks: false, facing: 0, headTilt: id === 4 ? -3 * smooth((f - 230) / 40) : 0, pop: [B.chair] });
  const K = P.kevin;
  if (id === 1) put(out, cam, who("kevin", f), K[0], K[2], t, { expr: before(f, B.eleven1, "smile", "shock"), prop: "plate", facing: -1, look: -1, pop: [B.eleven1 - 2] });
  else if (id === 2) {
    const f0 = B.escape + 2, u = Math.max(0, f - f0) / FPS, x = K[0] + 1.7 * u * Math.min(1, u * 2.5), z = K[2] + 0.3 * u;
    if (f < f0) put(out, cam, who("kevin", f), K[0], K[2], t, { expr: "shock", prop: "plate", facing: 1, pop: [f0 - 1] });
    else if (x < 4.7) put(out, cam, who("kevin", f), x, z, t, { walk: [1, 0.14], expr: "panic", side: { mode: "march", phase: (u * 1.9) % 1, stride: 1.15, stomp: 0.5, expr: "panic" }, mode: "march", phase: (u * 1.9) % 1 });
  } else if (id === 4) put(out, cam, who("kevin", f), K[0], K[2], t, { expr: "smile", prop: "plate", facing: -1, look: -1 });
  else if (id === 5) put(out, cam, who("kevin", f), K[0], K[2], t, { expr: f < B.four - 2 ? "neutral" : f < B.almost ? "nervous" : "panic", prop: "plate", facing: -1, look: -1, pop: [B.four - 2, B.almost] });
  else if (id === 7) {
    const prop: FrontOpts["prop"] = f < 409 ? "plate" : f < B.grabbed + 2 ? null : "jacket";
    put(out, cam, who("kevin", f), K[0], K[2], t, { expr: "fakecalm", prop, facing: 1, pop: [407, B.grabbed], tilt: f >= 403 && f < 417 ? -6 * Math.sin(Math.PI * (f - 403) / 14) : 0 });
  } else put(out, cam, who("kevin", f), K[0], K[2], t, { expr: "smile", prop: "plate", facing: -1 });
};

/** Dave x3, shoulder to shoulder (shot 6): copies pop in on "almost" and "third" */
const threeDaves = (out: Stage, cam: CamInfo, f: number) => {
  const t = T(f);
  put(out, cam, who("dave", f), P.dave[0], P.dave[2], t, { expr: "creepy", blinks: false, pop: [B.almost, B.third] });
  for (const [dx, f0] of [[-0.66, B.almost - 2], [0.66, B.third - 2]] as const) {
    const u = clamp01((f - f0) / 5);
    if (u <= 0) continue;
    const s = 0.6 + 0.4 * u + 0.08 * Math.sin(Math.PI * u);
    put(out, cam, who("dave", f, dx < 0 ? 20 : 23), P.dave[0] + dx, P.dave[2] + 0.05, t, { expr: "creepy", blinks: false, scale: s, seed: 1 } as Opt);
  }
};

/** a finger coming in from screen right to press the one elevator button (fx card) */
const fingerDraw = (p: Pen) => {
  p.band([[400, 104], [150, 100]], "#6d9ad6", 64, 4, "butt");
  p.stroke([[150, 66], [150, 134]], 5);
  p.ell(112, 100, 38, 34, "#ffe2c2", 6);
  p.band([[86, 92], [22, 90]], "#ffe2c2", 20, 5, "round");
};
/** the team as they stand in the dark aisle, behind Kevin (shots 19-20) */
const TEAMDARK: [Id, number, number, 1 | -1][] = [["dave", 0, 0.35, 1], ["boss", -0.75, 0.75, -1], ["t1", 0.8, 0.95, 1], ["t2", -1.25, 1.75, -1], ["t3", 1.2, 1.9, 1], ["t4", 0.3, 2.35, -1], ["t5", -0.45, 2.6, 1]];
const teamDark = (out: Stage, cam: CamInfo, f: number, id: number) => {
  const t = T(f), step = id === 20 ? 0.45 * smooth((f - 1158) / 64) : 0;
  TEAMDARK.forEach(([n, dx, z, dir], k) => {
    const turn = B.turned - 6 + k * 3;
    const x = OX + dx, zz = z - step;
    if (id === 19 && f < turn) {
      put(out, cam, who(n, f), x, zz, t, { expr: "neutral", side: { mode: "stand", expr: "neutral", left: dir < 0 } as SideOpts, blinks: true });
      return;
    }
    const wh = id === 20 && ((f >= B.omw - 2 && f < B.omw + 14) || Math.floor((f + k * 5) / 6) % 3 === 0);
    put(out, cam, who(n, f), x, zz, t, { expr: wh ? "whisper" : "creepy", blinks: false, prop: n === "boss" ? "mugUp" : "plate", pop: [turn] });
  });
};

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

// ---------------- staging per shot ----------------
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], t = T(f);
  FNOW = f;
  LNAME = s.light === "horror" || s.light === "dark" ? "golden" : "day";
  findSun(cam, SUN);
  if (s.set === "break") {
    if (id === 6) threeDaves(out, cam, f); else breakroom(out, cam, f, id);
    return out;
  }
  switch (id) {
    case 8: { // speed-walk, profile
      const z = walkZ(f), ph = ((f - 449) / FPS * 1.55) % 1;
      put(out, cam, who("kevin", f), OX - 0.1, z, t, { expr: "fakecalm", prop: "jacket", mode: "march", phase: ph, walk: [0, -1],
        side: { mode: "march", phase: ph, stride: 1.2, stomp: 0.35, expr: "fakecalm" } });
      break;
    }
    case 9: { // SMACK into the locked glass door
      const z = f < HIT ? EXIT_Z + 0.3 + ((HIT - f) / FPS) * 2.4 : EXIT_Z + 0.3, ph = ((f - 480) / FPS * 1.6) % 1, d = f - HIT;
      const sq: [number, number] = d >= 0 && d < 12 ? [1 + 0.16 * Math.exp(-d / 5), 1 - 0.12 * Math.exp(-d / 5)] : [1, 1];
      put(out, cam, who("kevin", f), OX + 0.42, z, t, f < HIT
        ? { expr: "fakecalm", prop: "jacket", mode: "march", phase: ph }
        : { expr: d < 10 ? "pained" : "dazed", prop: "jacket", sq, tilt: d < 14 ? 4 * Math.exp(-d / 6) : 0, y: d >= 0 ? -0.03 * clamp01(d / 10) : 0 });
      break;
    }
    case 10: { // the window is a poster
      const reach = f >= B.window - 4 && f < B.poster + 2;
      const expr: Expr = f < B.poster - 1 ? "fakecalm" : f < B.window2 - 6 ? "shock" : "stare";
      put(out, cam, who("kevin", f), 32.12, -12.88, t, { expr, arms: reach ? "reach" : undefined, prop: reach ? null : "jacket",
        facing: f < B.window2 - 6 ? 1 : 0, look: f < B.window2 - 6 ? 1 : 0, pop: [B.window - 4, B.poster - 1, B.window2 - 6] });
      break;
    }
    case 11: // the elevator
      put(out, cam, who("kevin", f), 27.78, -10.62, t, { expr: "nervous", facing: 1, look: 1, arms: f >= 630 ? "reach" : undefined, prop: f >= 630 ? null : "jacket", pop: [630] });
      break;
    case 12: { // ECU: one button, a finger presses it
      const u = smooth((f - (B.monday - 18)) / 15), tipZ = -11.36 + (PANEL[2] + 11.36) * u;
      const push = f >= B.monday - 3 ? 0.012 * Math.exp(-(f - (B.monday - 3)) / 4) : 0;
      if (u > 0) out.fx.push({ key: "finger", cw: 400, ch: 200, draw: fingerDraw, x: PANEL[0] + 0.07 - push, y: PANEL[1] - 0.004, z: tipZ - 0.09, w: 0.22, h: 0.11 });
      break;
    }
    case 13: case 24: { // the vent from outside: crouch, yank the grate
      const nh = id === 24, x = nh ? 30.42 : 29.58, f0 = nh ? 1596 : B.vent - 4;
      put(out, cam, who(nh ? "new" : "kevin", f), x, 11.02, t, { mode: "sit", y: -0.02, expr: f < f0 + 6 ? "fakecalm" : "stare", facing: nh ? -1 : 1, look: nh ? -1 : 1,
        arms: f >= f0 - 14 && f < f0 + 4 ? "reach" : undefined, tilt: f >= f0 - 2 && f < f0 + 10 ? (nh ? 8 : -8) * Math.sin(Math.PI * (f - f0 + 2) / 12) : 0, noBlob: false, pop: [f0] });
      if (f >= f0 + 4) put(out, cam, nh ? who("kevin", 2000) : who("dave", f), 30.0, 11.72, t, { y: -0.84, scale: 0.78, expr: "creepy", blinks: false, prop: "fork", noBlob: true } as Opt);
      break;
    }
    case 14: case 25: { // in the vent: Dave (then old Kevin) lying in the dark, eating cake
      const old = id === 25, e = old ? B.eating2 : B.eating, f0 = old ? 1622 : 770;
      const bite = Math.max(smooth((f - (e - 9)) / 7) * (1 - smooth((f - (e + 4)) / 8)), old ? 0 : smooth((f - 812) / 6) * (1 - smooth((f - 819) / 6)));
      const chew = f > e && Math.floor((f - e) / 4) % 2 === 0;
      put(out, cam, old ? who("kevin", 2000) : who("dave", f), 30.0, 11.72, t, { y: -0.84, scale: 0.78, expr: chew ? "chew" : "creepy", blinks: false, prop: "fork", bite,
        noBlob: true, headTilt: old ? -4 * smooth((f - 1660) / 40) : 0, pop: [f0 + 1] } as Opt);
      break;
    }
    case 15: { // calling in sick... from the desk next to the boss
      const cough = [838, 851].map((c) => (f >= c && f < c + 8 ? Math.sin(Math.PI * (f - c) / 8) : 0)).reduce((a, b) => a + b, 0);
      put(out, cam, who("kevin", f), DESK[0], DESK[2], t, { mode: "sit", y: 0.3, prop: "phone", noBlob: true, expr: f < B.nextDesk ? (cough > 0.2 ? "pained" : "nervous") : "shock",
        tilt: 7 * cough, facing: f >= B.nextDesk ? -1 : 0, look: f >= B.nextDesk ? -1 : 0, pop: [838, 851, B.nextDesk] });
      put(out, cam, who("boss", f), BOSS_DESK[0], BOSS_DESK[2], t, { prop: "phone", expr: f < B.feel - 2 ? "smile" : "smile_closed", facing: 1, look: 1,
        headTilt: f >= B.feel - 2 ? 9 * smooth((f - B.feel + 2) / 8) : 0, pop: [B.feel - 2], noBlob: true });
      break;
    }
    case 16: // lights out
      put(out, cam, who("kevin", f), DESK[0], DESK[2], t, { mode: "sit", y: 0.3, noBlob: true, expr: f < B.out ? "nervous" : "shock", pop: [B.out + 1] });
      break;
    case 17: // dark office, every screen flicks on
      put(out, cam, who("kevin", f), OX + 0.05, -2.6, t, { expr: f < B.turnedOn + 3 ? "nervous" : "panic", look: Math.floor(f / 12) % 2 ? 1 : -1, facing: Math.floor(f / 12) % 2 ? 1 : -1, pop: [B.turnedOn + 3] });
      break;
    case 19:
      put(out, cam, who("kevin", f), OX, -3.9, t, { expr: "nervous", look: Math.floor(f / 16) % 2 ? 1 : -1, facing: 0 });
      teamDark(out, cam, f, 19);
      break;
    case 20:
      teamDark(out, cam, f, 20);
      break;
    case 21: { // the fire exit!
      const u = runU(f), x = RUN0[0] + (RUN1[0] - RUN0[0]) * u, z = RUN0[2] + (RUN1[2] - RUN0[2]) * u, ph = ((f - 1226) / FPS * 2.1) % 1;
      if (f < 1226) break;
      if (u < 1) put(out, cam, who("kevin", f), x, z, t, { walk: [RUN1[0] - RUN0[0], RUN1[2] - RUN0[2]], expr: "panic", mode: "march", phase: ph,
        side: { mode: "march", phase: ph, stride: 1.3, stomp: 0.4, expr: "panic" } });
      else put(out, cam, who("kevin", f), RUN1[0], RUN1[2], t, { expr: f < B.fireExit + 4 ? "panic" : "relief", arms: f < B.fireExit + 6 ? "door" : undefined, facing: 0, pop: [B.fireExit + 4] });
      break;
    }
    case 22: { // the performance review
      const bite = smooth(((f - 1300) % 40) / 8) * (1 - smooth((((f - 1300) % 40) - 12) / 8));
      put(out, cam, who("boss", f), ROOM_TABLE[0] - 0.45, -13.32, t, { mode: "sit", y: 0.3, prop: "folder", expr: f < B.review - 2 ? "smile" : "grin", noBlob: true, pop: [B.opened, B.review - 2] });
      put(out, cam, who("dave", f), ROOM_TABLE[0] + 0.45, -13.32, t, { mode: "sit", y: 0.3, prop: "fork", bite, expr: bite < 0.1 && f > 1312 && Math.floor(f / 4) % 2 ? "chew" : "creepy", blinks: false, noBlob: true, pop: [B.opened + 2] });
      break;
    }
    case 23: { // one more week, 570 times
      put(out, cam, who("kevin", f), DESK[0], DESK[2], t, { mode: "sit", y: 0.3, expr: f < B.week ? "neutral" : Math.floor(f / 10) % 3 === 0 ? "smile_closed" : "neutral", noBlob: true });
      const n = f < B.week ? 3 : Math.min(35, 3 + Math.floor((f - B.week) / 3));
      out.fx.push({ key: `cal${n}`, cw: 300, ch: 340, draw: calDraw(n), x: DESK[0] - 0.2, y: 1.62, z: DESK[2] - 1.1, w: 0.4, h: 0.46 });
      break;
    }
  }
  return out;
};
