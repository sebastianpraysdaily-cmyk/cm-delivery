// The office world for "Eleven Years": a break room, an open-plan floor of cubicles with a lobby (exit, stairs,
// elevator), and two copies of the break room hidden behind the stair door and the elevator. Everything is built once
// from boxes with painted canvas textures and two-tone shading (shade.ts), then posed per frame (doors, flicker,
// time-lapse) from the timeline in story.ts. Walls, floors and the ceiling only receive shadows; furniture casts them.
import * as THREE from "three";
import { twoTone, TONE, CHAR, untone } from "./shade";
import { LIGHTS, LOOK, Light } from "./lights";
import { NOINK } from "./ink";
import { CARD_K } from "./cardshade";
import { Pool, Actor, Fx, stage } from "./cast";
import {
  FPS, SHOTS, CEIL, TABLE, OX, EXIT_Z, STAIR, ELEV, PRINTER, DESK, M1, M2, B, camAt, lightLevel, clamp01, smooth, V3,
} from "./story";

// ---------------- painted textures ----------------
const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const ctex = (w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void, seed = 7) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d")!, rng(seed));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const rep = (t: THREE.Texture, x: number, y: number) => { const c = t.clone(); c.repeat.set(x, y); c.needsUpdate = true; return c; };
const speckle = (g: CanvasRenderingContext2D, r: () => number, w: number, h: number, n: number, cols: string[], s = 2) => {
  for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(r() * w, r() * h, s, s); }
};
/** carpet tiles: 1 tile per texture, slight per-tile tone, dark seams painted in */
const carpetTex = ctex(256, 256, (g, r) => {
  g.fillStyle = "#7f8ca3"; g.fillRect(0, 0, 256, 256);
  speckle(g, r, 256, 256, 5000, ["#73809a", "#8a97ad", "#6d7a92", "#909cb2"], 2);
  g.strokeStyle = "rgba(40,45,70,0.35)"; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 253, 253);
});
const vinylTex = ctex(256, 256, (g, r) => {
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? "#e9dfc6" : "#cdbf9f"; g.fillRect(i * 128, j * 128, 128, 128); }
  speckle(g, r, 256, 256, 1800, ["rgba(120,100,70,0.15)", "rgba(255,255,255,0.2)"], 2);
  g.strokeStyle = "rgba(60,50,40,0.3)"; g.lineWidth = 2; for (const k of [0, 128, 256]) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 256); g.moveTo(0, k); g.lineTo(256, k); g.stroke(); }
});
const wallTex = (base: string, dark: string) => ctex(256, 256, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  speckle(g, r, 256, 256, 1400, [dark, "rgba(255,255,255,0.12)"], 3);
}, 11);
const ceilTex = ctex(256, 256, (g, r) => {
  g.fillStyle = "#efece4"; g.fillRect(0, 0, 256, 256);
  speckle(g, r, 256, 256, 2500, ["rgba(120,110,95,0.18)"], 2);
  g.strokeStyle = "#a8a296"; g.lineWidth = 6; g.strokeRect(0, 0, 256, 256);
});
const woodTex = ctex(256, 256, (g, r) => {
  g.fillStyle = "#c48d55"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(110,60,25,${0.08 + 0.12 * r()})`; g.lineWidth = 1 + 2 * r(); const y = r() * 256; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(80, y + 6 * (r() - 0.5), 170, y + 6 * (r() - 0.5), 256, y); g.stroke(); }
});
const fabricTex = ctex(128, 128, (g, r) => {
  g.fillStyle = "#8d9cb3"; g.fillRect(0, 0, 128, 128);
  speckle(g, r, 128, 128, 2600, ["#8193ab", "#99a7bc", "#7a8ba3"], 1);
});
/** skyline through the windows: sky gradient + flat city blocks + window dots (no text) */
const skylineTex = ctex(512, 512, (g, r) => {
  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, "#6a9fe0"); sky.addColorStop(0.6, "#a9c9ef"); sky.addColorStop(1, "#d8e6f4");
  g.fillStyle = sky; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(255,255,255,0.85)";
  for (const [x, y, s] of [[80, 90, 1], [330, 60, 0.8]]) { g.beginPath(); g.ellipse(x, y, 60 * s, 18 * s, 0, 0, 7); g.ellipse(x + 40 * s, y - 10 * s, 40 * s, 22 * s, 0, 0, 7); g.fill(); }
  const cols = ["#9aaecb", "#8aa0c0", "#b2c0d6", "#7f95b6"];
  let x = 0;
  while (x < 512) {
    const w = 40 + r() * 70, h = 150 + r() * 220, c = cols[Math.floor(r() * 4)];
    g.fillStyle = c; g.fillRect(x, 512 - h, w, h);
    g.fillStyle = "rgba(255,255,255,0.45)";
    for (let yy = 512 - h + 12; yy < 500; yy += 18) for (let xx = x + 8; xx < x + w - 8; xx += 14) if (r() < 0.7) g.fillRect(xx, yy, 6, 9);
    g.strokeStyle = "rgba(20,25,40,0.5)"; g.lineWidth = 3; g.strokeRect(x, 512 - h, w, h);
    x += w + 4 + r() * 10;
  }
}, 5);
/** EXIT pictogram: green box, white running figure through a door (no letters) */
const exitTex = ctex(256, 128, (g) => {
  g.fillStyle = "#1f9a52"; g.fillRect(0, 0, 256, 128);
  g.fillStyle = "#ffffff"; g.fillRect(150, 20, 60, 88); g.fillStyle = "#1f9a52"; g.fillRect(160, 30, 40, 78);
  g.strokeStyle = "#ffffff"; g.lineCap = "round"; g.lineWidth = 12;
  g.beginPath(); g.arc(98, 30, 11, 0, 7); g.fillStyle = "#fff"; g.fill();
  g.beginPath(); g.moveTo(92, 46); g.lineTo(80, 80); g.lineTo(100, 104); g.moveTo(80, 80); g.lineTo(56, 100); g.moveTo(92, 52); g.lineTo(118, 66); g.moveTo(90, 54); g.lineTo(66, 62); g.stroke();
  g.beginPath(); g.moveTo(20, 64); g.lineTo(46, 64); g.moveTo(34, 52); g.lineTo(46, 64); g.lineTo(34, 76); g.stroke();
});
const screenTex = ctex(128, 96, (g, r) => {
  g.fillStyle = "#4f8fd6"; g.fillRect(0, 0, 128, 96);
  g.fillStyle = "#e8f2ff"; for (let i = 0; i < 6; i++) g.fillRect(12, 14 + i * 12, 40 + r() * 60, 5);
});
const corkTex = ctex(256, 192, (g, r) => {
  g.fillStyle = "#c79a62"; g.fillRect(0, 0, 256, 192);
  speckle(g, r, 256, 192, 3000, ["#b5874f", "#d6aa72", "#a8783f"], 2);
  const notes = ["#fff3a0", "#ffc0d0", "#c0e8ff", "#d8ffc0", "#ffffff"];
  for (let i = 0; i < 9; i++) { g.fillStyle = notes[i % 5]; const x = 14 + (i % 4) * 60 + r() * 10, y = 14 + Math.floor(i / 4) * 58 + r() * 10; g.fillRect(x, y, 40, 40); g.fillStyle = "#c0353a"; g.beginPath(); g.arc(x + 20, y + 4, 4, 0, 7); g.fill(); }
  g.strokeStyle = "#6a4a2a"; g.lineWidth = 10; g.strokeRect(0, 0, 256, 192);
});

// ---------------- builders ----------------
type MatOpts = { map?: THREE.Texture; liftK?: number };
const mat = (color: string, o: MatOpts = {}) => twoTone(new THREE.MeshLambertMaterial({ color, map: o.map ?? null }), o.liftK ?? 1);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 20);

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private sun = new THREE.DirectionalLight("#ffffff", 2.5);
  private hemi = new THREE.HemisphereLight("#ffffff", "#888888", 0.5);
  private fog = new THREE.Fog("#dfe6ee", 30, 260);
  private panels: THREE.MeshBasicMaterial;
  private windowMat: THREE.MeshBasicMaterial;
  private exitSign: THREE.MeshBasicMaterial;
  private stairDoor = new THREE.Group();
  private elevL!: THREE.Mesh; private elevR!: THREE.Mesh;
  private exitDoor = new THREE.Group();
  private platePut!: THREE.Group;
  private mugs: THREE.Mesh[] = [];
  private plant = new THREE.Group();
  private flames: THREE.Mesh[] = [];
  private printerLed!: THREE.MeshBasicMaterial;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();
  private M: Record<string, THREE.Material>;

  constructor() {
    const R = this.root;
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.sun, this.sun.target, this.hemi);
    this.panels = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.7, 1.7, 1.62), toneMapped: true });
    this.windowMat = new THREE.MeshBasicMaterial({ map: skylineTex, color: new THREE.Color(1, 1, 1) });
    this.exitSign = new THREE.MeshBasicMaterial({ map: exitTex, color: new THREE.Color(1.6, 1.6, 1.6) });
    this.printerLed = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 2.2, 0.6) });
    this.M = {
      carpet: mat("#ffffff", { map: rep(carpetTex, 1, 1) }),
      vinyl: mat("#ffffff", { map: vinylTex }),
      wall: mat("#ffffff", { map: wallTex("#ece6d8", "rgba(150,140,120,0.12)") }),
      mustard: mat("#ffffff", { map: wallTex("#e2a944", "rgba(150,90,20,0.14)") }),
      teal: mat("#ffffff", { map: wallTex("#5fa3a0", "rgba(20,70,70,0.14)") }),
      dark: mat("#3a3f4a"),
      base: mat("#5a5048"),
      ceil: mat("#ffffff", { map: ceilTex }),
      wood: mat("#ffffff", { map: woodTex }),
      metal: mat("#9aa3ad"), metalDark: mat("#5f6670"),
      white: mat("#f4f2ec"), black: mat("#2a2a30"),
      cab: mat("#5f9fa0"), top: mat("#ebe5d6"),
      fabric: mat("#ffffff", { map: fabricTex }), frame: mat("#c9c9c6"),
      desk: mat("#d9c8a4"), chair: mat("#3c3f52"),
      pot: mat("#c8693a"), leaf: mat("#4f9a4a"), leaf2: mat("#3f8a44"),
      door: mat("#b8875a"), cake: mat("#fbf5ea"), icing: mat("#e8739a"), candle: mat("#7fb8f0"),
      cork: mat("#ffffff", { map: corkTex }), red: mat("#e04848"), paper: mat("#f7f7f2"),
    };
    // floors (receive only)
    this.box(R, [0, -0.05, 0], [9.4, 0.1, 7.4], "vinyl", false, rep(vinylTex, 5, 4));
    this.box(R, [30, -0.05, -3], [24, 0.1, 32], "carpet", false, rep(carpetTex, 18, 24));
    this.breakRoom(R, [0, 0, 0], 1, true);
    this.office(R);
    // break-room copies (rotated: their window wall faces back toward the lobby door)
    const c1 = new THREE.Group(); c1.position.set(M1[0], 0, M1[2]); c1.rotation.y = -Math.PI / 2; R.add(c1); this.breakRoomCopy(c1);
    const c2 = new THREE.Group(); c2.position.set(M2[0], 0, M2[2]); c2.rotation.y = Math.PI / 2; R.add(c2); this.breakRoomCopy(c2);
    R.traverse((o) => { if ((o as THREE.Mesh).isMesh && !o.userData.noShadow) { o.castShadow = !o.userData.noCast; o.receiveShadow = true; } });
  }

  private box(parent: THREE.Object3D, pos: V3, size: V3, m: string | THREE.Material, cast = true, map?: THREE.Texture) {
    let material = typeof m === "string" ? this.M[m] : m;
    if (map) material = twoTone(new THREE.MeshLambertMaterial({ color: "#ffffff", map }));
    const b = new THREE.Mesh(BOX, material);
    b.position.set(...pos); b.scale.set(...size);
    b.userData.noCast = !cast;
    parent.add(b);
    return b;
  }
  private cyl(parent: THREE.Object3D, pos: V3, r: number, h: number, m: string, cast = true) {
    const c = new THREE.Mesh(CYL, this.M[m]); c.position.set(...pos); c.scale.set(2 * r, h, 2 * r); c.userData.noCast = !cast; parent.add(c); return c;
  }
  private quad(parent: THREE.Object3D, pos: V3, w: number, h: number, m: THREE.Material, rotY = 0, rotX = 0) {
    const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); q.position.set(...pos); q.rotation.set(rotX, rotY, 0, "YXZ");
    q.userData.noShadow = true; parent.add(q); return q;
  }
  /** wall along x (normal +-z) from x0 to x1 at z, with optional openings [xa, xb, top] */
  private wallX(p: THREE.Object3D, x0: number, x1: number, z: number, m: string, holes: [number, number, number][] = []) {
    let x = x0;
    for (const [a, b, top] of [...holes].sort((u, v) => u[0] - v[0])) {
      if (a > x) this.box(p, [(x + a) / 2, CEIL / 2, z], [a - x, CEIL, 0.15], m, false);
      this.box(p, [(a + b) / 2, (top + CEIL) / 2, z], [b - a, CEIL - top, 0.15], m, false);
      x = b;
    }
    if (x1 > x) this.box(p, [(x + x1) / 2, CEIL / 2, z], [x1 - x, CEIL, 0.15], m, false);
    this.box(p, [(x0 + x1) / 2, 0.06, z], [x1 - x0, 0.12, 0.19], "base", false);
  }
  private wallZ(p: THREE.Object3D, z0: number, z1: number, x: number, m: string, holes: [number, number, number][] = []) {
    let z = z0;
    for (const [a, b, top] of [...holes].sort((u, v) => u[0] - v[0])) {
      if (a > z) this.box(p, [x, CEIL / 2, (z + a) / 2], [0.15, CEIL, a - z], m, false);
      this.box(p, [x, (top + CEIL) / 2, (a + b) / 2], [0.15, CEIL - top, b - a], m, false);
      z = b;
    }
    if (z1 > z) this.box(p, [x, CEIL / 2, (z + z1) / 2], [0.15, CEIL, z1 - z], m, false);
    this.box(p, [x, 0.06, (z0 + z1) / 2], [0.19, 0.12, z1 - z0], "base", false);
  }
  private ceiling(p: THREE.Object3D, x0: number, x1: number, z0: number, z1: number, lights: [number, number][]) {
    const c = this.box(p, [(x0 + x1) / 2, CEIL + 0.05, (z0 + z1) / 2], [x1 - x0, 0.1, z1 - z0], "ceil", false, rep(ceilTex, (x1 - x0) / 0.6, (z1 - z0) / 0.6));
    c.userData.noCast = true;
    for (const [x, z] of lights) {
      this.quad(p, [x, CEIL - 0.005, z], 0.6, 1.2, this.panels, 0, Math.PI / 2);
      this.box(p, [x, CEIL - 0.01, z], [0.66, 0.02, 1.26], "frame", false);
    }
  }
  /** a window: skyline quad on the inner face + frame and mullion boxes (ink catches these) */
  private windowOn(p: THREE.Object3D, c: V3, w: number, h: number, rotY: number) {
    const g = new THREE.Group(); g.position.set(...c); g.rotation.y = rotY; p.add(g);
    this.quad(g, [0, 0, 0.0], w, h, this.windowMat);
    this.box(g, [0, -h / 2 - 0.03, 0.06], [w + 0.16, 0.06, 0.16], "white", false);
    this.box(g, [0, h / 2 + 0.03, 0.03], [w + 0.16, 0.06, 0.08], "white", false);
    for (const x of [-w / 2 - 0.04, 0, w / 2 + 0.04]) this.box(g, [x, 0, 0.03], [0.07, h, 0.08], "white", false);
    this.box(g, [0, 0.12 * h, 0.03], [w, 0.05, 0.06], "white", false);
  }
  private plantAt(p: THREE.Object3D, pos: V3, s = 1) {
    const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); p.add(g);
    this.cyl(g, [0, 0.2, 0], 0.18, 0.4, "pot");
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05, l = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.7, 6), this.M[i % 2 ? "leaf" : "leaf2"]);
      l.position.set(Math.cos(a) * 0.08, 0.68, Math.sin(a) * 0.08); l.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); g.add(l);
    }
    return g;
  }
  private table(p: THREE.Object3D, c: V3, cake: boolean, candles: boolean) {
    this.box(p, [c[0], c[1] - 0.03, c[2]], [2.2, 0.06, 1.0], "wood");
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this.box(p, [c[0] + dx * 0.98, (c[1] - 0.06) / 2, c[2] + dz * 0.4], [0.06, c[1] - 0.06, 0.06], "metalDark");
    if (!cake) return;
    // sheet cake on a board, pink icing border, a missing corner, eleven candles
    this.box(p, [c[0], c[1] + 0.01, c[2]], [0.78, 0.02, 0.52], "white");
    this.box(p, [c[0] - 0.05, c[1] + 0.07, c[2]], [0.58, 0.1, 0.4], "cake");
    this.box(p, [c[0] - 0.05, c[1] + 0.125, c[2] + 0.19], [0.58, 0.025, 0.03], "icing");
    this.box(p, [c[0] - 0.05, c[1] + 0.125, c[2] - 0.19], [0.58, 0.025, 0.03], "icing");
    this.box(p, [c[0] + 0.23, c[1] + 0.125, c[2]], [0.03, 0.025, 0.4], "icing");
    this.box(p, [c[0] - 0.33, c[1] + 0.125, c[2]], [0.03, 0.025, 0.4], "icing");
    if (candles) for (let i = 0; i < 11; i++) {
      const x = c[0] - 0.3 + (i % 6) * 0.1 + (i >= 6 ? 0.05 : 0), z = c[2] + (i >= 6 ? 0.07 : -0.07);
      this.cyl(p, [x, c[1] + 0.17, z], 0.008, 0.08, "candle", false);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 1.8, 0.6) }));
      fl.scale.set(1, 1.7, 1); fl.position.set(x, c[1] + 0.225, z); fl.userData.noShadow = true; p.add(fl); this.flames.push(fl);
    }
    // a stack of plates and a few paper cups
    for (let i = 0; i < 4; i++) this.cyl(p, [c[0] + 0.7, c[1] + 0.01 + i * 0.012, c[2] + 0.2], 0.1, 0.01, "white");
    for (const [dx, dz] of [[-0.75, 0.25], [-0.85, 0.05], [0.6, -0.3]]) this.cyl(p, [c[0] + dx, c[1] + 0.06, c[2] + dz], 0.035, 0.11, "red");
  }

  private breakRoom(R: THREE.Object3D, o: V3, _s: number, main: boolean) {
    const g = new THREE.Group(); g.position.set(...o); R.add(g);
    // walls: mustard window wall at the back, teal right wall with the door, off-white elsewhere
    this.wallX(g, -4.6, 4.6, -3.55, "mustard");
    this.wallX(g, -4.6, 4.6, 3.55, "wall");
    this.wallZ(g, -3.55, 3.55, -4.55, "wall");
    this.wallZ(g, -3.55, 3.55, 4.55, "teal", [[1.0, 2.05, 2.1]]);
    for (const x of [-2.6, 0, 2.6]) this.windowOn(g, [x, 1.6, -3.47], 1.9, 1.35, 0);
    this.ceiling(g, -4.6, 4.6, -3.6, 3.6, [[-2.2, -1.6], [2.2, -1.6], [-2.2, 1.6], [2.2, 1.6], [0, 0]]);
    this.table(g, TABLE, true, true);
    // plate Kevin puts down (shown from shot 10 on)
    this.platePut = new THREE.Group(); g.add(this.platePut);
    this.cyl(this.platePut, [TABLE[0] + 0.85, TABLE[1] + 0.01, TABLE[2] + 0.38], 0.1, 0.012, "white");
    this.box(this.platePut, [TABLE[0] + 0.85, TABLE[1] + 0.05, TABLE[2] + 0.38], [0.09, 0.07, 0.06], "cake");
    // counter with cabinets, coffee machine, kettle; fridge; water cooler
    this.box(g, [-4.15, 0.45, -1.3], [0.62, 0.9, 3.6], "cab");
    this.box(g, [-4.13, 0.92, -1.3], [0.7, 0.05, 3.7], "top");
    for (let i = 0; i < 4; i++) this.box(g, [-3.83, 0.45, -2.75 + i * 0.95], [0.02, 0.8, 0.86], "cab");
    this.box(g, [-4.2, 1.15, -2.2], [0.4, 0.42, 0.36], "black");
    this.box(g, [-4.0, 1.04, -2.2], [0.06, 0.1, 0.14], "metal");
    this.cyl(g, [-4.15, 1.05, -0.6], 0.09, 0.2, "white");
    this.box(g, [-4.15, 2.0, -1.3], [0.4, 0.7, 3.4], "cab");
    this.box(g, [-4.1, 0.95, 1.6], [0.78, 1.9, 0.78], "white");
    this.box(g, [-3.7, 1.2, 1.35], [0.03, 0.5, 0.04], "metalDark");
    this.box(g, [-3.7, 0.5, 1.35], [0.03, 0.3, 0.04], "metalDark");
    if (main) {
      this.box(g, [0.8, 1.55, 3.47], [2.0, 1.2, 0.04], this.M.cork);
      this.plantAt(g, [3.9, 0, -3.0], 1.1);
      this.plantAt(g, [-3.6, 0, 3.0], 0.9);
      // open door leaf on the right wall
      const d = new THREE.Group(); d.position.set(4.5, 0, 1.0); d.rotation.y = -1.9; g.add(d);
      this.box(d, [0, 1.05, 0.52], [0.05, 2.1, 1.04], "door");
      this.box(d, [-0.06, 1.0, 0.92], [0.05, 0.05, 0.12], "metal");
      // the room beyond the door: a bit of office wall so the doorway is not a void
      this.box(g, [6.5, CEIL / 2, 1.5], [0.15, CEIL, 4], "wall", false);
      this.box(g, [5.6, -0.04, 1.5], [2.2, 0.08, 4], "carpet", false);
    }
  }
  /** cheaper copy for behind the doors: window wall, table + cake, counter, fridge, lights */
  private breakRoomCopy(g: THREE.Group) {
    // local frame: copy room centred at the table, window wall at local z = -2.3 (faces the door when rotated)
    this.box(g, [0, -0.022, 0], [4.6, 0.06, 6.6], "vinyl", false, rep(vinylTex, 3, 4));
    this.wallX(g, -2.25, 2.25, -3.2, "mustard");
    this.wallZ(g, -3.2, 3.2, -2.25, "wall");
    this.wallZ(g, -3.2, 3.2, 2.25, "wall");
    for (const x of [-1.2, 1.2]) this.windowOn(g, [x, 1.6, -3.12], 1.5, 1.3, 0);
    this.ceiling(g, -2.3, 2.3, -3.3, 3.3, [[0, -1.5], [0, 1.5]]);
    // table rotated so its long side faces the door
    const t = new THREE.Group(); t.rotation.y = Math.PI / 2; g.add(t);
    this.table(t, [0, TABLE[1], 0], true, true);
    this.box(g, [-1.9, 0.95, -2.5], [0.7, 1.9, 0.7], "white");
    this.box(g, [1.85, 0.45, -1.8], [0.6, 0.9, 1.8], "cab");
    this.box(g, [1.83, 0.92, -1.8], [0.66, 0.05, 1.9], "top");
  }

  private office(R: THREE.Object3D) {
    const g = new THREE.Group(); R.add(g);
    // outer walls of the floor
    this.wallZ(g, -10, 12, 24, "wall");
    this.wallZ(g, -10, 12, 36, "wall");
    this.wallX(g, 24, 36, 12, "wall");
    for (const z of [-7.2, -3.6, 0, 3.6, 7.2, 10.4]) this.windowOn(g, [24.08, 1.62, z], 2.4, 1.4, Math.PI / 2);
    // lobby
    this.wallX(g, 23.9, 27, -10, "wall"); this.wallX(g, 33, 36.1, -10, "wall");
    this.wallZ(g, -14.1, -10, 27, "teal", [[ELEV[2] - 0.62, ELEV[2] + 0.62, 2.2]]);
    this.wallZ(g, -14.1, -10, 33, "teal", [[STAIR[2] - 0.55, STAIR[2] + 0.55, 2.12]]);
    this.wallX(g, 27, 33, EXIT_Z, "mustard", [[OX - 0.85, OX + 0.85, 2.2]]);
    this.ceiling(g, 24, 36, -14, 12, [[27, 9.6], [33, 9.6], [27, 6.4], [33, 6.4], [27, 3.2], [33, 3.2], [27, 0], [33, 0], [27, -3.2], [33, -3.2], [27, -6.4], [33, -6.4],
      [30, 8], [30, 4.8], [30, 1.6], [30, -1.6], [30, -4.8], [30, -8], [30, -12]]);
    // vestibule beyond the exit (dark), floor + walls
    this.box(g, [OX, -0.04, -16.2], [4.2, 0.08, 4.4], "dark", false);
    this.wallZ(g, -18.4, -14, 28, "dark"); this.wallZ(g, -18.4, -14, 32, "dark"); this.wallX(g, 28, 32, -18.4, "dark");
    this.box(g, [OX, CEIL + 0.05, -16.2], [4.2, 0.1, 4.4], "dark", false).userData.noCast = true;
    // exit door: glass leaves in metal frames + push bar; EXIT pictogram above
    const ED = this.exitDoor; ED.position.set(OX, 0, EXIT_Z); g.add(ED);
    const glass = new THREE.MeshBasicMaterial({ color: "#bfe0f0", transparent: true, opacity: 0.22, depthWrite: false });
    for (const s of [-1, 1]) {
      const cx = s * 0.42;
      this.box(ED, [cx, 1.1, 0], [0.84, 2.2, 0.04], glass, false).layers.set(NOINK);
      for (const x of [cx - 0.4, cx + 0.4]) this.box(ED, [x, 1.1, 0], [0.06, 2.2, 0.07], "metalDark");
      for (const y of [0.04, 2.17]) this.box(ED, [cx, y, 0], [0.84, 0.07, 0.07], "metalDark");
      this.box(ED, [cx, 1.0, 0.07], [0.6, 0.05, 0.05], "metal");
      this.box(ED, [cx, 1.0, -0.07], [0.6, 0.05, 0.05], "metal");
    }
    this.quad(g, [OX, 2.48, EXIT_Z + 0.09], 0.6, 0.3, this.exitSign);
    this.box(g, [OX, 2.48, EXIT_Z + 0.05], [0.66, 0.36, 0.06], "white", false);
    // a chain and padlock on the push bars (it is locked)
    this.box(ED, [0, 1.0, -0.1], [0.5, 0.03, 0.03], "metalDark");
    this.box(ED, [0, 0.92, -0.12], [0.1, 0.12, 0.05], "metal");
    // stair door (hinged at its -z edge, opens into copy room 1) + stair pictogram plate
    const SD = this.stairDoor; SD.position.set(STAIR[0], 0, STAIR[2] - 0.55); g.add(SD);
    this.box(SD, [0, 1.06, 0.55], [0.05, 2.1, 1.08], "door");
    this.box(SD, [-0.06, 1.0, 0.95], [0.06, 0.05, 0.14], "metal");
    this.box(SD, [0, 1.55, 0.55], [0.06, 0.4, 0.3], this.M.black);
    this.box(g, [STAIR[0] - 0.08, 2.35, STAIR[2] - 0.85], [0.02, 0.24, 0.24], "white");
    // elevator: brushed metal frame, two sliding panels, call buttons
    this.box(g, [ELEV[0] + 0.09, 1.15, ELEV[2] - 0.67], [0.06, 2.3, 0.1], "metalDark");
    this.box(g, [ELEV[0] + 0.09, 1.15, ELEV[2] + 0.67], [0.06, 2.3, 0.1], "metalDark");
    this.box(g, [ELEV[0] + 0.09, 2.25, ELEV[2]], [0.06, 0.1, 1.44], "metalDark");
    this.elevL = this.box(g, [ELEV[0] + 0.11, 1.1, ELEV[2] - 0.3], [0.04, 2.2, 0.6], "metal");
    this.elevR = this.box(g, [ELEV[0] + 0.11, 1.1, ELEV[2] + 0.3], [0.04, 2.2, 0.6], "metal");
    this.box(g, [ELEV[0] + 0.1, 1.1, ELEV[2] + 0.95], [0.04, 0.3, 0.14], "metalDark");
    for (const y of [1.04, 1.16]) this.box(g, [ELEV[0] + 0.13, y, ELEV[2] + 0.95], [0.02, 0.06, 0.06], "white");
    this.box(g, [ELEV[0] + 0.09, 2.5, ELEV[2]], [0.03, 0.18, 0.5], this.M.black);
    // cubicles: dividers (fabric in a frame), desks with monitors, chairs, plants
    const cells = [9.6, 6.4, 3.2, 0, -3.2, -6.4];
    for (const side of [-1, 1]) {
      const xa = side < 0 ? 24.1 : 31.6, xb = side < 0 ? 28.4 : 35.9, xm = (xa + xb) / 2, wx = xb - xa;
      for (const zc of [...cells, -9.6]) {
        const zb = zc + 1.6;
        if (zb > 11.9) continue;
        this.box(g, [xm, 0.65, zb], [wx, 1.3, 0.06], "fabric");
        this.box(g, [xm, 1.32, zb], [wx + 0.02, 0.04, 0.09], "frame");
        this.box(g, [side < 0 ? xb : xa, 0.65, zb], [0.06, 1.34, 0.09], "frame");
      }
      for (const zc of cells) {
        if (side > 0 && zc === 0) continue; // printer alcove
        const kev = side < 0 && Math.abs(zc - DESK[2]) < 0.2;
        if (kev) continue; // Kevin's desk is built separately for the time-lapse
        const dz = zc + 1.15;
        this.box(g, [xm, 0.72, dz], [wx - 0.3, 0.05, 0.75], "desk");
        for (const x of [xa + 0.3, xb - 0.3]) this.box(g, [x, 0.36, dz], [0.05, 0.7, 0.65], "frame");
        const mx = xm - side * 0.6;
        this.box(g, [mx, 1.02, dz + 0.1], [0.62, 0.4, 0.04], "black");
        this.quad(g, [mx, 1.02, dz + 0.075], 0.56, 0.34, new THREE.MeshBasicMaterial({ map: screenTex, color: new THREE.Color(1.15, 1.15, 1.15) }), Math.PI);
        this.box(g, [mx, 0.82, dz + 0.12], [0.06, 0.18, 0.06], "black");
        this.box(g, [mx + side * 0.7, 0.76, dz - 0.05], [0.42, 0.02, 0.16], "black");
        if ((zc * 7 + side) % 3 === 0) this.cyl(g, [mx - side * 0.7, 0.8, dz], 0.04, 0.11, "red");
        // chair for the empty desks, tucked toward the desk
        this.box(g, [xm + side * 0.5, 0.46, zc + 0.3], [0.5, 0.06, 0.5], "chair");
        this.box(g, [xm + side * 0.5, 0.76, zc - 0.0], [0.5, 0.56, 0.06], "chair");
        this.cyl(g, [xm + side * 0.5, 0.22, zc + 0.3], 0.03, 0.44, "metalDark");
      }
    }
    // Kevin's desk (faces the aisle, he sits with the window behind him)
    this.box(g, [DESK[0] + 0.8, 0.72, DESK[2]], [0.7, 0.05, 1.7], "desk");
    this.box(g, [DESK[0] + 1.1, 0.36, DESK[2]], [0.05, 0.7, 1.5], "frame");
    this.box(g, [DESK[0] + 0.8, 1.0, DESK[2] - 0.55], [0.04, 0.4, 0.56], "black");
    this.box(g, [DESK[0] + 0.85, 0.82, DESK[2] - 0.55], [0.06, 0.18, 0.06], "black");
    this.box(g, [DESK[0] - 0.05, 0.46, DESK[2]], [0.5, 0.06, 0.5], "chair");
    this.box(g, [DESK[0] - 0.32, 0.8, DESK[2]], [0.06, 0.66, 0.52], "chair");
    for (let i = 0; i < 30; i++) {
      const r = i % 6, l = Math.floor(i / 6);
      const m = this.cyl(g, [DESK[0] + 0.62 + (r % 3) * 0.1, 0.8 + l * 0.11, DESK[2] - 0.3 + Math.floor(r / 3) * 0.1 + (l % 2) * 0.03], 0.04, 0.11, i % 3 ? "white" : "red");
      m.visible = false; this.mugs.push(m);
    }
    this.plant.position.set(DESK[0] + 0.9, 0.745, DESK[2] + 0.62); g.add(this.plant);
    this.plantAt(this.plant, [0, 0, 0], 0.35);
    // printer alcove: printer on a stand, water cooler, a tall plant
    this.box(g, [PRINTER[0], 0.4, PRINTER[2]], [0.7, 0.8, 0.8], "metalDark");
    this.box(g, [PRINTER[0], 0.95, PRINTER[2]], [0.62, 0.3, 0.7], "white");
    this.box(g, [PRINTER[0] - 0.36, 0.9, PRINTER[2]], [0.06, 0.04, 0.4], "black");
    this.box(g, [PRINTER[0] - 0.05, 1.12, PRINTER[2] - 0.2], [0.3, 0.04, 0.2], "black");
    const led = new THREE.Mesh(BOX, this.printerLed); led.scale.set(0.02, 0.025, 0.025); led.position.set(PRINTER[0] - 0.315, 1.02, PRINTER[2] + 0.25); led.userData.noShadow = true; g.add(led);
    this.box(g, [35.5, 0.55, 1.5], [0.36, 1.1, 0.36], "white");
    this.cyl(g, [35.5, 1.3, 1.5], 0.15, 0.4, "candle");
    this.plantAt(g, [35.5, 0, -1.3], 1.3);
    this.plantAt(g, [24.5, 0, 11.4], 1.2);
    this.plantAt(g, [27.5, 0, -13.5], 1.1);
    this.plantAt(g, [32.5, 0, -13.5], 1.1);
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = SHOTS[id - 1], L = LIGHTS[s.light], K = LOOK[s.light];
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 200; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = new THREE.Vector3(...c.look);
    // ---- light: fixed world sun per set (through the windows), horror = overhead fluorescent ----
    const sunDir = new THREE.Vector3(...((s.light === "horror" ? [0.15, 1, 0.1] : s.set === "break" ? [0.32, 0.72, -0.62] : [-0.66, 0.62, 0.22]) as V3)).normalize();
    let lvl = lightLevel(f);
    // time-lapse: days and nights flicker past from "one more week" to past "seventy times"
    let night = 0;
    if (id === 21 && f >= B.week) { const ph = ((f - B.week) / 10) % 1; night = f < B.seventy + 30 ? (ph > 0.55 ? 1 : 0) : 0; }
    if (night) lvl *= 0.35;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI * lvl;
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    const Rr = 9;
    this.sun.position.copy(focus).addScaledVector(sunDir, 40); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 1; sc.far = 90; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias;
    const k = Math.max(0.08, lvl);
    TONE.uLitCol.value.set(L.lit[0] * k, L.lit[1] * k, L.lit[2] * k);
    TONE.uShadeCol.value.set(L.shade[0] * (0.4 + 0.6 * k), L.shade[1] * (0.4 + 0.6 * k), L.shade[2] * (0.4 + 0.6 * k));
    if (night) TONE.uShadeCol.value.multiply(new THREE.Vector3(0.7, 0.75, 1.1));
    TONE.uShadeLift.value.set(...L.lift); TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term;
    TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    CARD_K.uGain.value = 1.03 * (0.25 + 0.75 * k);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = this.fog.color;
    // emissives follow the flicker
    const pk = s.light === "horror" ? 0.9 : s.light === "dim" ? 1.2 : 1.7;
    this.panels.color.setRGB(pk * k, pk * k * (s.light === "horror" ? 1.12 : 1), pk * k * (s.light === "horror" ? 1.05 : 0.95));
    const wv = s.light === "horror" ? 0.12 : s.light === "dim" ? 0.55 : night ? 0.18 : 1;
    this.windowMat.color.setRGB(wv * (night ? 0.6 : 1), wv * (night ? 0.7 : 1), wv);
    this.exitSign.color.setRGB(1.6, 1.6, 1.6);
    this.printerLed.color.setRGB(0.2, (Math.floor(f / 6) % 2 ? 2.2 : 0.6), 0.6);
    for (const fl of this.flames) fl.scale.set(1, 1.6 + 0.25 * Math.sin(f * 1.7 + fl.position.x * 40), 1);
    // ---- props posed by the story ----
    this.platePut.visible = (id === 10 && f >= B.puts + 8) || id === 22 || id === 23;
    const so = id === 13 ? smooth((f - (B.stairsOpen - 4)) / 10) : 0;
    this.stairDoor.rotation.y = 1.75 * so;
    const eo = id === 14 ? smooth((f - (B.elevOpen - 2)) / 14) : 0;
    this.elevL.position.z = ELEV[2] - 0.3 - 0.58 * eo; this.elevR.position.z = ELEV[2] + 0.3 + 0.58 * eo;
    const rattle = id === 12 && [B.locked - 2, B.locked + 8, B.locked + 18].some((q) => f >= q && f < q + 5);
    this.exitDoor.position.z = EXIT_Z + (rattle ? (f % 2 ? 0.02 : -0.02) : 0);
    const weeks = id === 21 ? clamp01((f - B.week) / (B.seventy + 30 - B.week)) : 0;
    this.mugs.forEach((m, i) => { m.visible = id === 21 && i < Math.floor(weeks * 30 + 0.001); });
    this.plant.scale.setScalar(id === 21 ? 1 + 2.2 * weeks : 1);
    // ---- cast + effects (as the bridge world) ----
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, f, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 2.5))) continue;
      const a = this.actor(ai++);
      const [w, h, kk] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, kk, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = false;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}
