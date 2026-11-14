// Our office cast as lit flat sprites in the 3D office (machinery from the bridge short: canvas pool, yaw billboards
// shaded by cardShade(), contact blobs, unlit effect cards, all on the NOINK layer).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxContact, fxShadow, Outfit, Expr, FrontOpts, SideOpts, INK, SKINS } from "./toon";
import { FPS, V3, smooth, clamp01, SHOTS, P, B, OX, EXIT_Z, STAIR, ELEV, PRINTER, DESK, M1, M2, KEV_AISLE, walkZ, TABLE } from "./story";
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
const DAVE: Outfit = { jacket: "#c9b48a", shirt: "#f4f1ea", tie: "#5a7a3a", lanyard: "#3e7fd2", pants: "#5a5048", boots: "#3a2a20", hat: "hair", hair: "#9a9aa0", glasses: true, build: "stout", skin: SKINS[1] };
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
  if (f < 1730) return KEVIN;
  const o: Outfit = { ...KEVIN, moustache: "#4a3020" };
  if (f >= 1762) Object.assign(o, { glasses: true, jacket: "#c9b48a", tie: "#5a7a3a" });
  if (f >= 1790) o.hair = "#9a9aa0";
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

type Opt = FrontOpts & { blinks?: boolean; y?: number; scale?: number; noBlob?: boolean; walk?: [number, number]; side?: SideOpts };
/** one character at (x, z): front view by default; `walk` (direction) picks front/side by the camera like the bridge */
const put = (out: Stage, cam: CamInfo, w: Who, x: number, z: number, t: number, o: Opt = {}) => {
  const lid = o.blinks === false ? 0 : lidAt(t, w.i);
  const y = o.y ?? 0;
  const view = o.walk ? viewOf(cam, x, z, o.walk[0], o.walk[1]) : { side: !!o.side, mirror: false, fs: 1 };
  if (o.side && !o.walk) view.mirror = (o.side as SideOpts & { left?: boolean }).left ?? false;
  const fo: FrontOpts = { mode: "stand", ...o, blink: lid };
  const so: SideOpts = { mode: "stand", expr: o.expr, blink: lid, ...(o.side ?? {}) };
  const pl = person(cam, w, x, y, z, view, fo, so, o.scale ?? 1);
  out.places.push(pl);
  if (!o.noBlob) blob(out, x, y, z, o.scale ?? 1, 0.9);
};
const T = (f: number) => f / FPS;
const before = (f: number, b: number, a: Expr, c: Expr) => (f < b - 2 ? a : c);

/** break room crowd (main room at the origin) */
const breakroom = (out: Stage, cam: CamInfo, f: number, id: number) => {
  const t = T(f);
  const clap = id === 6 || id === 22;
  const cl = (k: number): FrontOpts["arms"] => (Math.floor((f + k * 3) / 4) % 2 ? "clap" : "clapOpen");
  const team: [Id, V3][] = [["t1", P.t1], ["t2", P.t2], ["t3", P.t3], ["t4", P.t4], ["t5", P.t5]];
  const later = id >= 22;
  team.forEach(([n, p], k) => {
    if (later && n === "t5") return; // Dave stands there ten years later
    let expr: Expr = k % 2 ? "smile" : "smile_closed";
    let prop: FrontOpts["prop"] = k % 2 ? "plate" : null;
    let facing: -1 | 0 | 1 = p[0] < 0 ? 1 : -1;
    if (id === 2 || id === 10) { expr = "stare"; facing = 1; }
    if (id === 1 || id === 3) expr = k % 2 ? "smile" : "grin";
    put(out, cam, who(n, f), p[0], p[2], t, { expr, prop: clap ? null : prop, arms: clap ? cl(k) : undefined, facing, look: id === 10 || id === 2 ? 1 : 0 });
  });
  // boss
  const bossProp: FrontOpts["prop"] = (id === 4 && f >= B.raises) || id === 5 || later ? "mugUp" : "mug";
  put(out, cam, who("boss", f), P.boss[0], P.boss[2], t, { expr: id === 2 || id === 10 ? "stare" : "grin", prop: bossProp, facing: 1, look: id === 10 ? 1 : 0 });
  // Dave: never blinks
  const dpos = later ? P.t5 : P.dave;
  put(out, cam, who("dave", f), dpos[0], dpos[2], t, { expr: "creepy", blinks: false, facing: 0, arms: clap && !later ? cl(9) : undefined, headTilt: id === 7 ? -3 * smooth((f - 513) / 80) : 0 });
  // Kevin / the new hire
  if (later) {
    put(out, cam, who("kevin", 2000), P.dave[0], P.dave[2], t, { expr: "creepy", blinks: false, facing: 0, headTilt: id === 23 ? 3 * smooth((f - 1946) / 80) : 0 });
    put(out, cam, who("new", f), 0.95, 0.45, t, { expr: before(f, B.eleven4, "smile", "shock"), prop: "plate", facing: -1, look: -1 });
    return;
  }
  const K = P.kevin;
  if (id === 1) put(out, cam, who("kevin", f), K[0], K[2], t, { expr: before(f, B.eleven1, "smile", "shock"), prop: "plate", facing: -1, look: -1 });
  else if (id === 2) {
    const f0 = B.leave - 3, u = Math.max(0, f - f0) / FPS, x = K[0] + 1.55 * u, z = K[2] + 0.22 * u;
    if (f < f0) put(out, cam, who("kevin", f), K[0], K[2], t, { expr: "shock", prop: "plate", facing: 1 });
    else if (x < 4.7) put(out, cam, who("kevin", f), x, z, t, { walk: [1, 0.14], expr: "nervous", side: { mode: "march", phase: (u * 1.6) % 1, stride: 0.9, stomp: 0.6, expr: "nervous" }, mode: "stroll", phase: (u * 1.6) % 1 });
  } else if (id === 6) put(out, cam, who("kevin", f), K[0], K[2], t, { expr: "fakecalm", arms: cl(5), facing: -1 });
  else if (id === 8) put(out, cam, who("kevin", f), K[0], K[2], t, { expr: f < F2(23.73) ? "neutral" : "nervous", prop: "plate", facing: -1, look: -1 });
  else if (id === 10) {
    const prop: FrontOpts["prop"] = f < B.puts + 8 ? "plate" : f < B.grabs + 4 ? null : "jacket";
    put(out, cam, who("kevin", f), K[0], K[2], t, { expr: "fakecalm", prop, facing: 1, tilt: f >= B.puts && f < B.puts + 14 ? -6 * Math.sin(Math.PI * (f - B.puts) / 14) : 0 });
  } else if (id !== 7 && id !== 9) put(out, cam, who("kevin", f), K[0], K[2], t, { expr: "smile", prop: "plate", facing: -1 });
};
const F2 = (s: number) => Math.round(s * FPS);

/** three Daves, shoulder to shoulder (shot 9) */
const threeDaves = (out: Stage, cam: CamInfo, f: number) => {
  const t = T(f);
  put(out, cam, who("dave", f), P.dave[0], P.dave[2], t, { expr: "creepy", blinks: false });
  for (const [dx, k] of [[-0.66, 0], [0.66, 3]] as const) {
    const u = clamp01((f - (B.three - 2 + k)) / 5);
    if (u <= 0) continue;
    const s = 0.6 + 0.4 * u + 0.06 * Math.sin(Math.PI * u);
    put(out, cam, who("dave", f, 20 + k), P.dave[0] + dx, P.dave[2] + 0.05, t, { expr: "creepy", blinks: false, scale: s, seed: 1 } as Opt);
  }
};

/** mini break-room copies behind the stair door / elevator: the team staring back, boss with the mug up */
const copyRoom = (out: Stage, cam: CamInfo, f: number, c: V3, dir: 1 | -1) => {
  const t = T(f);
  // dir = +1: the room extends toward +x (people further along +x); -1 toward -x
  const spots: [Id, number, number, FrontOpts["prop"]][] = [
    ["boss", 1.1, 0.75, "mugUp"], ["dave", 0.9, -0.1, null], ["t1", 1.7, -1.0, "plate"], ["t2", 1.75, 1.1, "plate"], ["t3", 2.0, 0.2, "plate"], ["t4", 0.6, -1.2, "plate"],
  ];
  for (const [n, ax, lz, prop] of spots) put(out, cam, who(n, f), c[0] + dir * ax, c[2] + lz, t, { expr: "creepy", blinks: false, prop });
};

/** coworkers sitting in their cubicles, turning their heads to follow Kevin (shot 11) */
const SEATED: [Id, number, number][] = [["t1", OX - 2.4, 6.3], ["t3", OX + 2.4, 6.3], ["t4", OX - 2.4, -0.1], ["t2", OX + 2.4, -3.3], ["t5", OX - 2.4, -6.5]];
const seated = (out: Stage, cam: CamInfo, f: number, kz: number) => {
  const t = T(f);
  SEATED.forEach(([n, x, z]) => {
    const turned = kz < z + 1.5;
    put(out, cam, who(n, f), x, z, t, { mode: "sit", y: 0.3, expr: turned ? "stare" : "neutral", blinks: !turned, facing: turned ? (x < OX ? 1 : -1) : 0, look: turned ? (x < OX ? 1 : -1) : 0, noBlob: true });
  });
};

/** the team in a line across the aisle behind Kevin (shots 17-20), perfectly still, holding cake */
const LINEUP: [Id, number, number][] = [["boss", -0.9, -8.4], ["dave", 0, -8.3], ["t3", 0.9, -8.4], ["t1", -1.35, -9.2], ["t2", -0.45, -9.2], ["t4", 0.45, -9.2], ["t5", 1.35, -9.2]];
const lineup = (out: Stage, cam: CamInfo, f: number) => {
  const t = T(f);
  for (const [n, dx, z] of LINEUP) put(out, cam, who(n, f), OX + dx, z, t, { expr: "creepy", blinks: false, prop: n === "boss" ? "mugUp" : "plate" });
};

// ---------------- effects ----------------
const pageDraw = (p: Pen) => {
  p.poly([[10, 10], [190, 10], [190, 250], [10, 250]], "#f7f7f2", 6);
  p.ell(100, 110, 52, 56, null, 5);
  p.dot(80, 100, 7); p.dot(120, 100, 7);
  p.arc(100, 118, 26, 16, 15, 165, 6);
  for (let i = 0; i < 4; i++) p.stroke([[40, 190 + i * 14], [160 - (i % 2) * 30, 190 + i * 14]], 4, "#8a8a90");
};
const printerPages = (out: Stage, f: number) => {
  const f0 = B.printer - 4;
  for (let k = 0; k < 14; k++) {
    const fs = f0 + k * 5, a = (f - fs) / FPS;
    if (a < 0 || a > 1.6) continue;
    const x = PRINTER[0] - 0.4 - 1.5 * a, y = 0.98 + 1.1 * a - 2.2 * a * a + 0.05 * k % 3, z = PRINTER[2] + (hh(k, 3) - 0.5) * 0.9 * a;
    if (y < 0.03) continue;
    out.fx.push({ key: "page", cw: 200, ch: 260, draw: pageDraw, x, y, z, w: 0.21, h: 0.28, rot: 2.6 * a * (hh(k, 4) - 0.5) + 0.3 });
  }
};
/** the badge, ECU: photo + tally marks that fill to eleven */
const badgeDraw = (n: number) => (p: Pen) => {
  p.poly([[20, 20], [380, 20], [380, 560], [20, 560]], "#ffffff", 10);
  p.poly([[20, 20], [380, 20], [380, 110], [20, 110]], "#3e7fd2", 8);
  p.ell(200, 66, 30, 14, "#dfe8f5", 4);
  p.poly([[110, 150], [290, 150], [290, 350], [110, 350]], "#dfe8f5", 6);
  // tiny Kevin photo
  p.ell(200, 235, 52, 50, "#ffe2c2", 6); p.dot(182, 232, 6); p.dot(218, 232, 6); p.arc(200, 255, 16, 8, 20, 160, 5);
  p.ell(200, 196, 50, 22, "#6a3f22", 0, 180, 360);
  p.poly([[150, 300], [250, 300], [270, 350], [130, 350]], "#6d9ad6", 5);
  // tallies: groups of five (four + slash)
  for (let i = 0; i < n; i++) {
    const g = Math.floor(i / 5), j = i % 5, x0 = 60 + g * 110, y0 = 410;
    if (j < 4) p.stroke([[x0 + j * 20, y0], [x0 + j * 20 + 4, y0 + 100]], 9, INK);
    else p.stroke([[x0 - 12, y0 + 70], [x0 + 82, y0 + 26]], 9, "#c0353a");
  }
};
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
  LNAME = s.light === "horror" ? "golden" : "day";
  findSun(cam, SUN);
  if (s.set === "break") {
    if (id === 9) threeDaves(out, cam, f); else breakroom(out, cam, f, id);
    return out;
  }
  switch (id) {
    case 11: {
      const z = walkZ(f), ph = ((f - 885) / FPS * 1.25 / 1.3) % 1;
      put(out, cam, who("kevin", f), OX, z, t, { expr: "fakecalm", prop: "jacket", mode: "stroll", phase: ph, walk: [0, -1], side: { mode: "march", phase: ph, stride: 0.8, stomp: 0.5, expr: "fakecalm" } });
      seated(out, cam, f, z);
      break;
    }
    case 12: {
      const j = [B.locked - 2, B.locked + 8, B.locked + 18].some((k) => f >= k && f < k + 5) ? (f % 2 ? 0.025 : -0.025) : 0;
      put(out, cam, who("kevin", f), OX + 0.42 + j, EXIT_Z + 0.55, t, { expr: before(f, B.locked + 6, "fakecalm", "panic"), arms: "door" });
      break;
    }
    case 13:
      put(out, cam, who("kevin", f), STAIR[0] - 1.7, STAIR[2] + 0.72, t, f < B.stairsOpen + 4 ? { expr: "fakecalm", facing: -1, look: -1, arms: f > B.stairsOpen - 12 ? "door" : undefined } : { expr: "panic", facing: 0, look: -1 });
      if (f >= B.stairsOpen - 6) copyRoom(out, cam, f, M1, 1);
      break;
    case 14:
      put(out, cam, who("kevin", f), ELEV[0] + 1.35, ELEV[2] - 0.8, t, { expr: before(f, B.elevOpen + 6, "nervous", "shock"), facing: -1, look: -1 });
      if (f >= B.elevOpen - 6) copyRoom(out, cam, f, M2, -1);
      break;
    case 15:
      put(out, cam, who("kevin", f), OX + 0.1, -2.0, t, { expr: "panic", look: Math.floor(f / 8) % 2 ? 1 : -1, facing: Math.floor(f / 8) % 2 ? 1 : -1 });
      break;
    case 16:
      printerPages(out, f);
      break;
    case 17:
      put(out, cam, who("kevin", f), KEV_AISLE[0], KEV_AISLE[2], t, { expr: "nervous", look: 1, facing: f > 1312 ? 1 : 0 });
      lineup(out, cam, f);
      break;
    case 18:
      lineup(out, cam, f);
      break;
    case 19:
      put(out, cam, who("kevin", f), KEV_AISLE[0], KEV_AISLE[2], t, { expr: before(f, B.lucky, "nervous", "relief"), prop: f >= B.lucky - 6 ? "badge" : null });
      lineup(out, cam, f);
      break;
    case 20: {
      put(out, cam, who("kevin", f), KEV_AISLE[0], KEV_AISLE[2], t, { expr: before(f, B.eleven3 + 4, "relief", "panic") });
      const n = Math.max(1, Math.min(11, Math.round((f - (B.eleven3 - 10)) / 1.4)));
      out.fx.push({ key: `badge${n}`, cw: 400, ch: 580, draw: badgeDraw(n), x: OX + 0.08, y: 1.22, z: -3.72, w: 0.17, h: 0.247, rot: 0.04 });
      lineup(out, cam, f);
      break;
    }
    case 21: {
      put(out, cam, who("kevin", f), DESK[0], DESK[2], t, { mode: "sit", y: 0.3, expr: f < B.week ? "neutral" : Math.floor(f / 10) % 3 === 0 ? "smile_closed" : "neutral", noBlob: true });
      const n = f < B.week ? 3 : Math.min(35, 3 + Math.floor((f - B.week) / 3));
      out.fx.push({ key: `cal${n}`, cw: 300, ch: 340, draw: calDraw(n), x: DESK[0] - 0.2, y: 1.62, z: DESK[2] - 1.1, w: 0.4, h: 0.46 });
      break;
    }
  }
  return out;
};
