// The office world for "Eleven Years": a break room, an open-plan floor of cubicles with a lobby (exit, stairs,
// elevator), and two copies of the break room hidden behind the stair door and the elevator. Everything is built once
// from boxes with painted canvas textures and two-tone shading (shade.ts), then posed per frame (doors, flicker,
// time-lapse) from the timeline in story.ts. Walls, floors and the ceiling only receive shadows; furniture casts them.
import * as THREE from "three";
import { twoTone, TONE, CHAR, untone } from "./shade";
import { LIGHTS, LOOK, Light } from "./lights";
import { NOINK } from "./ink";
import { CARD_K } from "./cardshade";
import { Pool, Actor, Fx, stage, DAVE } from "./cast";
import { Pen, bodyFront } from "./toon";
import {
  FPS, SHOTS, CEIL, TABLE, OX, EXIT_Z, ELEV, PANEL, POSTER, VENT, FIRE, PRINTER, DESK, B, camAt, lightLevel,
  screensDave, clamp01, smooth, V3, BOARD, ACEIL, CEIL_VENT, ROACH, TCAR, CLIFF_X, ISLAND, SX, dreamCar,
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

/** the "window" poster: a painted window (frame, mullions, skyline) with a white paper border, a curling corner */
const posterTex = ctex(512, 400, (g, r) => {
  g.fillStyle = "#fbfaf4"; g.fillRect(0, 0, 512, 400);
  const img = (skylineTex.image as HTMLCanvasElement);
  g.drawImage(img, 0, 60, 512, 380, 30, 30, 452, 340);
  g.fillStyle = "#f4f2ec"; g.fillRect(30, 30, 452, 16); g.fillRect(30, 354, 452, 16); g.fillRect(30, 30, 16, 340); g.fillRect(466, 30, 16, 340);
  g.fillRect(248, 30, 16, 340); g.fillRect(30, 230, 452, 12);
  g.strokeStyle = "rgba(40,40,60,0.55)"; g.lineWidth = 3; g.strokeRect(30, 30, 452, 340);
  g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.moveTo(60, 60); g.lineTo(140, 60); g.lineTo(60, 200); g.fill();
  g.fillStyle = "#d8d4c8"; g.beginPath(); g.moveTo(512, 340); g.lineTo(512, 400); g.lineTo(452, 400); g.closePath(); g.fill();
  g.strokeStyle = "rgba(60,50,40,0.35)"; g.lineWidth = 4; g.strokeRect(2, 2, 508, 396);
  for (const [x, y] of [[0, 0], [470, 0], [0, 358]]) { g.fillStyle = "rgba(240,236,210,0.9)"; g.fillRect(x, y, 42, 42); }
}, 9);
/** tape squares left on the wall behind the poster */
const tapeTex = ctex(64, 64, (g) => { g.fillStyle = "rgba(245,240,215,0.95)"; g.fillRect(8, 8, 48, 48); g.strokeStyle = "rgba(120,110,80,0.4)"; g.lineWidth = 2; g.strokeRect(8, 8, 48, 48); });
/** the review room whiteboard: a line chart that goes down, a down arrow, a frowny face (no text) */
const boardTex = ctex(512, 320, (g) => {
  g.fillStyle = "#fbfcfd"; g.fillRect(0, 0, 512, 320);
  g.strokeStyle = "#2a2a30"; g.lineWidth = 5; g.beginPath(); g.moveTo(50, 30); g.lineTo(50, 280); g.lineTo(470, 280); g.stroke();
  g.strokeStyle = "#d84a3a"; g.lineWidth = 9; g.lineJoin = "round"; g.beginPath();
  [[60, 70], [130, 90], [190, 80], [250, 150], [310, 140], [370, 220], [440, 262]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  g.fillStyle = "#d84a3a"; g.beginPath(); g.moveTo(458, 272); g.lineTo(428, 270); g.lineTo(450, 246); g.fill();
  g.strokeStyle = "#3e7fd2"; g.lineWidth = 6; g.beginPath(); g.arc(400, 80, 36, 0, 7); g.stroke();
  g.fillStyle = "#3e7fd2"; g.beginPath(); g.arc(388, 70, 5, 0, 7); g.arc(412, 70, 5, 0, 7); g.fill();
  g.beginPath(); g.arc(400, 108, 16, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke();
  g.strokeStyle = "#9aa3ad"; g.lineWidth = 10; g.strokeRect(5, 5, 502, 310);
});
/** Kevin's conspiracy board: Linda's photo in the middle, red string to everyone else's, little hearts (no text) */
const boardTexL = (() => {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 666;
  const g = c.getContext("2d")!;
  g.fillStyle = "#c79a62"; g.fillRect(0, 0, 1024, 666);
  for (let i = 0; i < 9000; i++) { g.fillStyle = ["#b5874f", "#d6aa72", "#a8783f"][i % 3]; g.fillRect((i * 7919) % 1024, (i * 104729) % 666, 2, 2); }
  g.strokeStyle = "#6a4a2a"; g.lineWidth = 22; g.strokeRect(0, 0, 1024, 666);
  const C: [number, number] = [512, 333];
  const people: [number, number, string, string, boolean, boolean][] = [ // x, y, hair, jacket, glasses, moustache
    [150, 140, "#9a9aa0", "#c9b48a", true, false], [380, 110, "#e0b050", "#f08a2c", false, false], [650, 110, "#1e1a18", "#2f5f6a", false, true],
    [880, 150, "#c9893a", "#3f9a8a", false, false], [150, 500, "#3a2a1a", "#5d7a3a", false, false], [380, 540, "#5a3b2a", "#c25a7a", false, false],
    [650, 540, "#1e1a18", "#e07a3a", false, false], [880, 500, "#6a3f22", "#6d9ad6", false, false],
  ];
  const photo = (x: number, y: number, s: number, hair: string, jacket: string, gl: boolean, mo: boolean, frame = "#fbfaf4") => {
    g.save(); g.translate(x, y); g.rotate(((x * 13 + y * 7) % 11 - 5) * 0.012);
    g.fillStyle = frame; g.fillRect(-60 * s, -72 * s, 120 * s, 144 * s);
    g.fillStyle = "#dfe8f5"; g.fillRect(-50 * s, -62 * s, 100 * s, 100 * s);
    g.fillStyle = jacket; g.beginPath(); g.ellipse(0, 40 * s, 40 * s, 26 * s, 0, Math.PI, 2 * Math.PI); g.fill();
    g.fillStyle = "#ffe2c2"; g.strokeStyle = "#241726"; g.lineWidth = 4 * s; g.beginPath(); g.ellipse(0, -12 * s, 28 * s, 30 * s, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = hair; g.beginPath(); g.ellipse(0, -28 * s, 29 * s, 16 * s, 0, Math.PI, 2 * Math.PI); g.fill();
    g.fillStyle = "#241726"; g.beginPath(); g.arc(-10 * s, -12 * s, 3.5 * s, 0, 7); g.arc(10 * s, -12 * s, 3.5 * s, 0, 7); g.fill();
    g.beginPath(); g.arc(0, -2 * s, 9 * s, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    if (gl) { g.beginPath(); g.arc(-10 * s, -12 * s, 8 * s, 0, 7); g.moveTo(18 * s, -12 * s); g.arc(10 * s, -12 * s, 8 * s, 0, 7); g.stroke(); }
    if (mo) { g.strokeStyle = "#2a201a"; g.lineWidth = 5 * s; g.beginPath(); g.moveTo(-12 * s, -4 * s); g.lineTo(12 * s, -4 * s); g.stroke(); }
    g.fillStyle = "#c0353a"; g.beginPath(); g.arc(0, -66 * s, 7 * s, 0, 7); g.fill();
    g.restore();
  };
  // string first (under the photos), hearts on each string
  g.strokeStyle = "#d8262c"; g.lineWidth = 5;
  for (const [x, y] of people) { g.beginPath(); g.moveTo(C[0], C[1] - 70); g.quadraticCurveTo((x + C[0]) / 2, (y + C[1]) / 2 + 30, x, y - 66); g.stroke(); }
  for (const [x, y] of people) {
    const hx = (x + C[0]) / 2, hy = (y + C[1]) / 2 + 10;
    g.fillStyle = "#e8326a"; g.beginPath(); g.moveTo(hx, hy + 14); g.bezierCurveTo(hx - 26, hy - 4, hx - 12, hy - 22, hx, hy - 8); g.bezierCurveTo(hx + 12, hy - 22, hx + 26, hy - 4, hx, hy + 14); g.fill();
  }
  for (const [x, y, hr, jk, gl, mo] of people) photo(x, y, 1, hr, jk, gl, mo);
  photo(C[0], C[1], 1.45, "#2a1e1a", "#7b5ac9", false, false, "#ffd6e6"); // Linda
  g.strokeStyle = "#d8262c"; g.lineWidth = 7; g.beginPath(); g.ellipse(C[0], C[1], 120, 130, 0, 0, 7); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
})();
/** a monitor showing Dave: blue glow, his head cropped from the real character drawing */
const daveScreen = (() => {
  const c = document.createElement("canvas"); c.width = 600; c.height = 1000;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(300, 330, 40, 300, 330, 420); gr.addColorStop(0, "#cfe6ff"); gr.addColorStop(1, "#4f8fd6");
  g.fillStyle = gr; g.fillRect(0, 0, 600, 1000);
  bodyFront(new Pen(g), DAVE, { mode: "stand", expr: "creepy", seed: 2 });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(0.8, 0.36); t.offset.set(0.1, 0.505);
  return t;
})();

// ---------------- builders ----------------
const grimeTex = ctex(256, 256, (g, r) => {
  g.fillStyle = "#b8b48a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 26; i++) { const x = r() * 256, y = r() * 256, rr = 10 + r() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(110,95,50,0.28)"); gr.addColorStop(1, "rgba(110,95,50,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr); }
  speckle(g, r, 256, 256, 400, ["rgba(90,80,50,0.25)", "rgba(200,195,160,0.3)"]);
}, 11);
const stainTex = ctex(256, 256, (g, r) => {
  g.fillStyle = "#7a6a58"; g.fillRect(0, 0, 256, 256);
  speckle(g, r, 256, 256, 1800, ["#6e5e4c", "#86766a", "#5e5040"], 2);
  for (let i = 0; i < 9; i++) { const x = r() * 256, y = r() * 256; g.fillStyle = "rgba(60,45,30,0.35)"; g.beginPath(); g.ellipse(x, y, 8 + r() * 22, 6 + r() * 14, r() * 3, 0, 7); g.fill(); }
}, 12);
const pizzaBoxTex = ctex(128, 128, (g) => {
  g.fillStyle = "#e8dcc0"; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "#c0353a"; g.lineWidth = 8; g.beginPath(); g.arc(64, 64, 34, 0, 7); g.stroke();
  g.fillStyle = "#c0353a"; g.beginPath(); g.moveTo(64, 40); g.lineTo(84, 82); g.lineTo(44, 82); g.closePath(); g.fill();
  g.fillStyle = "rgba(150,110,50,0.35)"; g.beginPath(); g.ellipse(30, 96, 16, 10, 0.4, 0, 7); g.fill();
});
const asphaltTex = ctex(256, 256, (g, r) => { g.fillStyle = "#55575c"; g.fillRect(0, 0, 256, 256); speckle(g, r, 256, 256, 2500, ["#4a4c50", "#62646a", "#3e4044"], 2); }, 13);
const sandTex = ctex(256, 256, (g, r) => { g.fillStyle = "#f0d79a"; g.fillRect(0, 0, 256, 256); speckle(g, r, 256, 256, 1500, ["#e6c886", "#f8e4b0", "#dcbc78"], 2); }, 14);
const grassTex = ctex(256, 256, (g, r) => { g.fillStyle = "#6fae4a"; g.fillRect(0, 0, 256, 256); speckle(g, r, 256, 256, 1500, ["#62a040", "#7cbc56", "#5a9238"], 3); }, 15);
const brickTex = ctex(256, 256, (g, r) => {
  g.fillStyle = "#d8cfc0"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) for (let x = (y / 16) % 2 ? -16 : 0; x < 256; x += 32) { g.fillStyle = ["#a8553e", "#b45f44", "#9c4e3a"][Math.floor(r() * 3)]; g.fillRect(x + 1, y + 1, 30, 14); }
}, 16);
const paveTex = ctex(256, 256, (g, r) => {
  g.fillStyle = "#c9c6bf"; g.fillRect(0, 0, 256, 256); speckle(g, r, 256, 256, 900, ["#bdbab2", "#d4d1ca"], 2);
  g.strokeStyle = "rgba(90,88,84,0.6)"; g.lineWidth = 2; for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
}, 17);
const oceanTex = ctex(256, 256, (g, r) => {
  g.fillStyle = "#2a8fd0"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(220,245,255,0.55)"; g.lineWidth = 2;
  for (let i = 0; i < 60; i++) { const x = r() * 256, y = r() * 256, w = 6 + r() * 14; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 3, x + w, y); g.stroke(); }
}, 18);
const curtainTex = ctex(128, 128, (g) => { for (let x = 0; x < 128; x += 16) { g.fillStyle = x % 32 ? "#6a6a8a" : "#5a5a7a"; g.fillRect(x, 0, 16, 128); } });
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
  private poster = new THREE.Group();
  private grate = new THREE.Group();
  private fireDoor = new THREE.Group();
  private spill!: THREE.MeshBasicMaterial;
  private bulb!: THREE.MeshBasicMaterial;
  private buttonMat!: THREE.MeshBasicMaterial;
  private screens: THREE.MeshBasicMaterial[] = [];
  private elevL!: THREE.Mesh; private elevR!: THREE.Mesh;
  private exitDoor = new THREE.Group();
  private platePut!: THREE.Group;
  private mugs: THREE.Mesh[] = [];
  private plant = new THREE.Group();
  private flames: THREE.Mesh[] = [];
  private printerLed!: THREE.MeshBasicMaterial;
  private dcar = new THREE.Group(); private wingL = new THREE.Group(); private wingR = new THREE.Group();
  private aptBulb!: THREE.MeshBasicMaterial; private ocean!: THREE.Mesh; private streetDoor = new THREE.Group();
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
      door: mat("#b8875a"), cake: mat("#fbf5ea"), chocolate: mat("#5a3424"), cakeChair: mat("#3c3f52"), fire: mat("#c0353a"), icing: mat("#e8739a"), candle: mat("#7fb8f0"),
      cardboard: mat("#c8a070"),
      cork: mat("#ffffff", { map: corkTex }), red: mat("#e04848"), paper: mat("#f7f7f2"), duct: mat("#c3c8ce"), ductIn: mat("#1a1c22"),
    };
    // floors (receive only)
    this.box(R, [0, -0.05, 0], [9.4, 0.1, 7.4], "vinyl", false, rep(vinylTex, 5, 4));
    this.box(R, [30, -0.05, -3], [24, 0.1, 32], "carpet", false, rep(carpetTex, 18, 24));
    this.breakRoom(R, [0, 0, 0], 1, true);
    this.office(R);
    this.apartment(R);
    this.traffic(R);
    this.coast(R);
    this.street(R);
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
    // a cake shaped like Dave's office chair: star base, pole, seat, backrest, armrests, icing trim, eleven candles
    this.box(p, [c[0], c[1] + 0.01, c[2]], [0.62, 0.02, 0.5], "white");
    for (let i = 0; i < 5; i++) { const a = i * 1.2566; const leg = this.box(p, [c[0] + Math.cos(a) * 0.1, c[1] + 0.035, c[2] + Math.sin(a) * 0.1], [0.2, 0.03, 0.04], "chocolate"); leg.rotation.y = -a; }
    this.cyl(p, [c[0], c[1] + 0.09, c[2]], 0.025, 0.1, "chocolate");
    this.box(p, [c[0], c[1] + 0.16, c[2]], [0.3, 0.06, 0.28], "cakeChair");
    this.box(p, [c[0], c[1] + 0.3, c[2] - 0.13], [0.3, 0.24, 0.05], "cakeChair");
    this.box(p, [c[0], c[1] + 0.195, c[2]], [0.31, 0.015, 0.29], "icing");
    this.box(p, [c[0], c[1] + 0.425, c[2] - 0.13], [0.31, 0.015, 0.06], "icing");
    for (const sx of [-1, 1]) { this.box(p, [c[0] + sx * 0.16, c[1] + 0.23, c[2] + 0.01], [0.03, 0.02, 0.18], "chocolate"); this.box(p, [c[0] + sx * 0.16, c[1] + 0.205, c[2] + 0.06], [0.025, 0.05, 0.025], "chocolate"); }
    if (candles) for (let i = 0; i < 11; i++) {
      const x = c[0] - 0.125 + (i % 6) * 0.05 + (i >= 6 ? 0.025 : 0), z = c[2] + (i >= 6 ? 0.06 : -0.04);
      this.cyl(p, [x, c[1] + 0.225, z], 0.006, 0.06, "candle", false);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 1.8, 0.6) }));
      fl.scale.set(1, 1.7, 1); fl.position.set(x, c[1] + 0.27, z); fl.userData.noShadow = true; p.add(fl); this.flames.push(fl);
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
  private office(R: THREE.Object3D) {
    const g = new THREE.Group(); R.add(g);
    // outer walls of the floor
    this.wallZ(g, -10, 12, 24, "wall");
    this.wallZ(g, -10, 12, 36, "wall");
    this.wallX(g, 24, 36, 12, "wall");
    for (const z of [-7.2, -3.6, 0, 3.6, 7.2, 10.4]) this.windowOn(g, [24.08, 1.62, z], 2.4, 1.4, Math.PI / 2);
    // lobby
    this.wallX(g, 23.9, 27, -10, "wall"); this.wallX(g, 33, 36.1, -10, "wall", [[FIRE[0] - 0.5, FIRE[0] + 0.5, 2.1]]);
    this.wallZ(g, -14.1, -10, 27, "teal", [[ELEV[2] - 0.62, ELEV[2] + 0.62, 2.2]]);
    this.wallZ(g, -14.1, -10, 33, "teal");
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
    // the "window" poster on the lobby's right wall (hinged at its bottom edge so it can fall off) + tape left behind
    const tape = new THREE.MeshBasicMaterial({ map: tapeTex, transparent: true });
    const tapeLit = twoTone(new THREE.MeshLambertMaterial({ map: tapeTex, transparent: true }));
    void tape;
    for (const [dy, dz] of [[0.52, -0.68], [0.52, 0.68], [-0.52, -0.68]]) this.quad(g, [POSTER[0] - 0.003, POSTER[1] + dy, POSTER[2] + dz], 0.09, 0.09, tapeLit, -Math.PI / 2);
    const PG = this.poster; PG.position.set(POSTER[0] - 0.01, POSTER[1] - 0.56, POSTER[2]); g.add(PG);
    const pf = twoTone(new THREE.MeshLambertMaterial({ map: posterTex }));
    const pb = this.M.paper;
    const front = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 1.11), pf); front.position.set(0, 0.555, 0); front.rotation.y = -Math.PI / 2; PG.add(front);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 1.11), pb); back.position.set(0.002, 0.555, 0); back.rotation.y = Math.PI / 2; PG.add(back);
    // supply closet behind the door: x 33..36, z -14..-10: shelves of boxes and paper, a mop, a crate, one bare bulb
    this.wallX(g, 33, 36.1, EXIT_Z, "wall");
    const shelf = (x0: number, x1: number, z: number, dz: number, along: "x" | "z") => {
      for (const y of [0.05, 0.6, 1.15, 1.7, 2.2]) {
        if (along === "x") this.box(g, [(x0 + x1) / 2, y, z], [x1 - x0, 0.04, dz], "metal");
        else this.box(g, [z, y, (x0 + x1) / 2], [dz, 0.04, x1 - x0], "metal");
      }
      for (const t of [x0 + 0.02, x1 - 0.02]) for (const e of [-1, 1]) {
        if (along === "x") this.box(g, [t, 1.1, z + e * dz * 0.45], [0.04, 2.2, 0.04], "metalDark");
        else this.box(g, [z + e * dz * 0.45, 1.1, t], [0.04, 2.2, 0.04], "metalDark");
      }
      let k = 0;
      for (const y of [0.07, 0.62, 1.17, 1.72]) for (let u = x0 + 0.2; u < x1 - 0.15; u += 0.42) {
        const kind = (k++ * 7) % 5, h = 0.22 + 0.1 * (kind % 3);
        const col = ["cardboard", "paper", "cardboard", "white", "cardboard"][kind];
        if (along === "x") this.box(g, [u, y + h / 2, z], [0.34, h, dz * 0.8], col);
        else this.box(g, [z, y + h / 2, u], [dz * 0.8, h, 0.34], col);
      }
    };
    shelf(33.25, 35.75, EXIT_Z + 0.32, 0.5, "x");
    shelf(-13.5, -10.9, 35.62, 0.5, "z");
    shelf(-13.5, -10.9, 33.38, 0.5, "z");
    this.box(g, [34.12, 0.21, -12.62], [0.46, 0.42, 0.42], "cardboard"); // Kevin's crate (Monday)
    this.cyl(g, [33.85, 0.15, -10.85], 0.16, 0.3, "fire");                // mop bucket
    const mop = this.cyl(g, [33.78, 0.85, -10.87], 0.015, 1.4, "wood"); mop.rotation.z = -0.12;
    this.box(g, [34.5, 2.62, -12.2], [0.01, 0.56, 0.01], "black");       // the bare bulb on its cord
    this.bulb = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.1, 1.5) });
    const bl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), this.bulb); bl.position.set(34.5, 2.31, -12.2); bl.userData.noShadow = true; g.add(bl);
    // the elevator car behind the lobby's left wall: floor, walls, ceiling light, mirror back wall, handrail
    const ex = ELEV[0], ez = ELEV[2];
    this.box(g, [ex - 0.8, -0.02, ez], [1.5, 0.06, 1.3], "vinyl");
    this.box(g, [ex - 1.52, 1.15, ez], [0.06, 2.3, 1.3], "metal");
    for (const sz of [-1, 1]) this.box(g, [ex - 0.8, 1.15, ez + sz * 0.65], [1.5, 2.3, 0.06], "wood");
    this.box(g, [ex - 0.8, 2.32, ez], [1.5, 0.06, 1.3], "frame");
    this.quad(g, [ex - 0.8, 2.285, ez], 0.9, 0.7, this.panels, 0, Math.PI / 2);
    this.box(g, [ex - 1.46, 0.95, ez], [0.04, 0.04, 1.1], "metalDark");
    this.box(g, [ex - 1.485, 1.5, ez], [0.01, 1.1, 0.9], "white");
    // fire exit door (hinged at its +x edge, swings into the review room) + glowing exit pictogram above
    const FD = this.fireDoor; FD.position.set(FIRE[0] + 0.48, 0, FIRE[2]); g.add(FD);
    this.box(FD, [-0.48, 1.04, 0], [0.96, 2.08, 0.05], "door");
    this.box(FD, [-0.12, 1.0, 0.06], [0.06, 0.06, 0.12], "metal");
    this.box(g, [FIRE[0] + 0.25, 1.65, FIRE[2] + 0.04], [0.26, 0.18, 0.02], "white", false); // blank sign plate
    // the conspiracy board above the vent, and a tall plant by Kevin's cubicle (the watcher's cover in shot 2)
    this.box(g, [BOARD[0], BOARD[1], BOARD[2] + 0.01], [2.06, 1.38, 0.03], "wood");
    this.quad(g, [BOARD[0], BOARD[1], BOARD[2] - 0.01], 2.0, 1.3, twoTone(new THREE.MeshLambertMaterial({ map: boardTexL })), Math.PI);
    this.spill = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.75, 1.6), side: THREE.DoubleSide });
    // floor-level air vent housing on the far wall: duct box with an open front, dark inside, a grate that comes off
    const vx = VENT[0], vz = VENT[2];
    for (const sx of [-1, 1]) this.box(g, [vx + sx * 0.385, 0.29, vz + 0.25], [0.07, 0.58, 0.5], "duct");
    this.box(g, [vx, 0.545, vz + 0.25], [0.84, 0.07, 0.5], "duct");
    this.box(g, [vx, 0.03, vz + 0.25], [0.84, 0.06, 0.5], "duct");
    this.box(g, [vx, 0.29, vz + 0.49], [0.7, 0.5, 0.02], "ductIn");
    for (const sx of [-1, 1]) this.box(g, [vx + sx * 0.345, 0.29, vz + 0.25], [0.01, 0.46, 0.48], "ductIn");
    this.box(g, [vx, 0.505, vz + 0.25], [0.68, 0.01, 0.48], "ductIn");
    const GR = this.grate; GR.position.set(vx, 0.06, vz - 0.02); g.add(GR);
    this.box(GR, [0, 0.22, 0], [0.7, 0.03, 0.025], "metal"); this.box(GR, [0, 0.0, 0], [0.7, 0.03, 0.025], "metal");
    this.box(GR, [0, 0.44, 0], [0.7, 0.03, 0.025], "metal");
    for (let i = 0; i < 8; i++) this.box(GR, [-0.3 + i * 0.086, 0.22, 0], [0.02, 0.44, 0.02], "metal");
    for (const sx of [-1, 1]) this.box(GR, [sx * 0.34, 0.22, 0], [0.03, 0.47, 0.025], "metal");
    // elevator: brushed metal frame, two sliding panels, call buttons
    this.box(g, [ELEV[0] + 0.09, 1.15, ELEV[2] - 0.67], [0.06, 2.3, 0.1], "metalDark");
    this.box(g, [ELEV[0] + 0.09, 1.15, ELEV[2] + 0.67], [0.06, 2.3, 0.1], "metalDark");
    this.box(g, [ELEV[0] + 0.09, 2.25, ELEV[2]], [0.06, 0.1, 1.44], "metalDark");
    this.elevL = this.box(g, [ELEV[0] + 0.11, 1.1, ELEV[2] - 0.3], [0.04, 2.2, 0.6], "metal");
    this.elevR = this.box(g, [ELEV[0] + 0.11, 1.1, ELEV[2] + 0.3], [0.04, 2.2, 0.6], "metal");
    this.box(g, [ELEV[0] + 0.1, 1.1, ELEV[2] + 0.95], [0.04, 0.3, 0.16], "metalDark");
    this.buttonMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.85, 0.85, 0.82) });
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 28), this.buttonMat);
    btn.rotation.z = Math.PI / 2; btn.position.set(PANEL[0] + 0.005, PANEL[1], PANEL[2]); btn.userData.noShadow = true; g.add(btn);
    this.cyl(g, [PANEL[0] - 0.004, PANEL[1], PANEL[2]], 0.045, 0.012, "metal").rotation.z = Math.PI / 2;
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
        // monitors at the aisle end of each desk, turned to face the aisle (so "every screen" reads from it)
        // (angled toward the lobby end: normal (+-0.6, 0, -0.8))
        const mx = side < 0 ? xb - 0.5 : xa + 0.5, sx = side < 0 ? 1 : -1, yaw = Math.atan2(sx * 0.6, -0.8);
        const mon = this.box(g, [mx, 1.02, dz], [0.62, 0.4, 0.04], "black"); mon.rotation.y = yaw;
        const sm = new THREE.MeshBasicMaterial({ map: screenTex, color: new THREE.Color(1.15, 1.15, 1.15), fog: false }); this.screens.push(sm);
        this.quad(g, [mx + sx * 0.6 * 0.025, 1.02, dz - 0.8 * 0.025], 0.56, 0.34, sm, yaw);
        this.box(g, [mx - sx * 0.6 * 0.05, 0.79, dz + 0.8 * 0.05], [0.06, 0.12, 0.06], "black");
        this.box(g, [xm, 0.76, dz - 0.05], [0.42, 0.02, 0.16], "black");
        if ((zc * 7 + side) % 3 === 0) this.cyl(g, [xm - side * 0.9, 0.8, dz], 0.04, 0.11, "red");
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
    this.ceilVent(g);
  }

  // ================= GRWM sets =================
  private setWings(w: number) {
    const s = Math.max(0.001, w);
    this.wingL.scale.set(s, 1, 1); this.wingR.scale.set(s, 1, 1);
    this.wingL.visible = this.wingR.visible = w > 0.01;
  }
  /** a boxy little hatchback facing -z, origin between the wheels on the ground. Open windows (glass is NOINK). */
  private car(p: THREE.Object3D, pos: V3, col: string, yaw = 0, driver = false) {
    const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = yaw; p.add(g);
    const body = mat(col);
    this.box(g, [0, 0.62, 0], [1.72, 0.62, 3.9], body);                 // lower body
    this.box(g, [0, 0.95, -1.45], [1.7, 0.06, 1.0], body);              // bonnet top
    // cabin: 4 pillars + roof, open sides so we can see in
    for (const [x, z] of [[-0.8, -0.75], [0.8, -0.75], [-0.8, 1.3], [0.8, 1.3]] as const) this.box(g, [x, 1.25, z], [0.08, 0.62, 0.1], body);
    this.box(g, [0, 1.58, 0.28], [1.7, 0.07, 2.2], body);
    this.box(g, [0, 1.25, 1.75], [1.7, 0.62, 0.12], body);              // tailgate
    const glass = new THREE.MeshBasicMaterial({ color: "#bfe0f0", transparent: true, opacity: 0.18, depthWrite: false });
    this.box(g, [0, 1.25, -0.78], [1.55, 0.58, 0.02], glass, false).layers.set(NOINK);
    for (const x of [-0.95, 0.95]) for (const z of [-1.2, 1.2]) { const w = this.cyl(g, [x, 0.33, z], 0.33, 0.24, "black"); w.rotation.z = Math.PI / 2; }
    for (const x of [-0.6, 0.6]) this.box(g, [x, 0.72, -1.96], [0.32, 0.14, 0.04], "white", false);
    for (const x of [-0.6, 0.6]) this.box(g, [x, 0.72, 1.96], [0.3, 0.12, 0.04], "red", false);
    this.box(g, [0, 0.98, 0.4], [1.6, 0.06, 2.0], "dark", false);       // floor / seats base
    if (driver) {
      this.box(g, [-0.32, 0.75, 0.62], [0.55, 0.5, 0.12], "chair");   // driver seat back (behind Trevor)
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.03, 8, 24), this.M.black);
      wheel.position.set(-0.32, 1.12, -0.32); wheel.rotation.x = -1.1; g.add(wheel);
      this.box(g, [0, 1.0, -0.55], [1.6, 0.18, 0.3], "dark", false); // dashboard
    }
    return g;
  }
  private apartment(R: THREE.Object3D) {
    const g = new THREE.Group(); R.add(g);
    const x0 = -43, x1 = -37, z0 = -2.5, z1 = 2.5, H = ACEIL;
    this.M.grime = mat("#ffffff", { map: grimeTex }); this.M.stain = mat("#ffffff", { map: rep(stainTex, 3, 3) });
    this.M.pbox = mat("#ffffff", { map: pizzaBoxTex }); this.M.mattress = mat("#d8d0e0"); this.M.sheet = mat("#7a8ab0");
    this.M.curtain = mat("#ffffff", { map: curtainTex }); this.M.dish = mat("#e8eef0"); this.M.laundry = mat("#5a6aa0"); this.M.laundry2 = mat("#c06040");
    this.box(g, [-40, -0.05, 0], [6, 0.1, 5], "stain", false);
    this.box(g, [-40, H + 0.05, 0], [6, 0.1, 5], "grime", false).userData.noCast = true;
    for (const [z, nz] of [[z0, 1], [z1, -1]] as const) this.box(g, [-40, H / 2, z - 0.07 * nz], [6.2, H, 0.15], "grime", false);
    this.box(g, [x0 - 0.07, H / 2, 0], [0.15, H, 5.2], "grime", false);
    this.box(g, [x1 + 0.07, H / 2, 0], [0.15, H, 5.2], "grime", false);
    // a window on the back wall with a sagging curtain and a dirty grey sky
    const win = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.75, 0.78, 0.74) });
    this.quad(g, [-39.6, 1.55, z0 + 0.01], 1.2, 0.9, win);
    this.box(g, [-39.6, 1.55, z0 + 0.04], [1.32, 0.06, 0.08], "white", false).position.y = 1.03;
    this.box(g, [-39.6, 2.03, z0 + 0.06], [1.6, 0.04, 0.04], "metalDark", false);
    const cur = this.box(g, [-39.15, 1.5, z0 + 0.08], [0.55, 1.05, 0.03], "curtain", false); cur.rotation.z = 0.06;
    // the mattress on the floor, a balled-up sheet, a pillow
    this.box(g, [-41.4, 0.11, -1.7], [1.9, 0.22, 1.35], "mattress");
    const sh = this.box(g, [-41.0, 0.27, -1.9], [1.1, 0.14, 0.8], "sheet"); sh.rotation.y = 0.3;
    this.box(g, [-42.05, 0.28, -1.75], [0.45, 0.12, 0.32], "white");
    // the sink counter on the left wall, a tower of dishes, the mirror
    this.box(g, [-42.65, 0.45, 0.4], [0.62, 0.9, 2.4], "cab");
    this.box(g, [-42.63, 0.92, 0.4], [0.68, 0.05, 2.5], "top");
    this.box(g, [-42.6, 0.93, 0.3], [0.42, 0.02, 0.5], "metalDark", false);
    for (let i = 0; i < 9; i++) this.cyl(g, [-42.62 + (i % 2) * 0.03, 0.97 + i * 0.045, 0.85 + (i % 3) * 0.02], 0.13, 0.03, "dish");
    for (let i = 0; i < 4; i++) this.cyl(g, [-42.55, 1.0 + i * 0.1, 1.25], 0.05, 0.1, i % 2 ? "red" : "white");
    this.box(g, [-42.9, 1.6, 0.3], [0.03, 0.62, 0.48], "frame", false);
    this.quad(g, [-42.88, 1.6, 0.3], 0.42, 0.56, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.6, 0.62) }), Math.PI / 2);
    // pizza boxes: a stack on the counter (the roach's), towers on the floor
    for (let i = 0; i < 3; i++) this.box(g, [ROACH[0] + 0.02 * (i % 2), 0.95 + i * 0.012 + 0.006, ROACH[2]], [0.42, 0.012, 0.42], i === 2 ? "pbox" : "cardboard");
    for (const [x, z, n] of [[-37.6, -2.0, 7], [-38.1, -2.05, 4], [-42.5, -0.1, 3]] as const)
      for (let i = 0; i < n; i++) { const b = this.box(g, [x, 0.03 + i * 0.05, z], [0.42, 0.05, 0.42], i === n - 1 ? "pbox" : "cardboard"); b.rotation.y = i * 0.17; }
    // the "breakfast" counter: a little table with an open box
    this.box(g, [-39.6, 0.74, -0.25], [0.8, 0.04, 0.6], "wood");
    for (const [dx, dz] of [[-0.35, -0.25], [0.35, -0.25], [-0.35, 0.25], [0.35, 0.25]]) this.box(g, [-39.6 + dx, 0.36, -0.25 + dz], [0.04, 0.72, 0.04], "metalDark");
    this.box(g, [-39.6, 0.78, -0.3], [0.42, 0.03, 0.42], "pbox");
    // mini fridge, a chair buried in laundry, a laundry pile, cans
    this.box(g, [-37.4, 0.42, -0.9], [0.5, 0.84, 0.5], "white");
    this.box(g, [-37.9, 0.23, 0.2], [0.45, 0.06, 0.45], "chair"); this.box(g, [-37.7, 0.5, 0.2], [0.06, 0.55, 0.45], "chair");
    for (let i = 0; i < 6; i++) { const b = this.box(g, [-37.95 + 0.08 * Math.sin(i), 0.32 + i * 0.07, 0.2 + 0.06 * Math.cos(i * 2)], [0.42, 0.08, 0.4], i % 2 ? "laundry" : "laundry2"); b.rotation.y = i * 0.5; }
    for (let i = 0; i < 5; i++) { const b = this.box(g, [-40.6 + 0.3 * Math.sin(i * 1.7), 0.06, 1.6 + 0.2 * Math.cos(i)], [0.4, 0.12, 0.3], i % 2 ? "laundry" : "laundry2"); b.rotation.y = i; }
    for (const [x, z] of [[-40.2, 1.9], [-38.4, -1.4], [-41.8, 0.9], [-39.0, 1.9]] as const) this.cyl(g, [x, 0.06, z], 0.033, 0.12, "red");
    // door on the right wall
    this.box(g, [x1 - 0.02, 1.02, 1.55], [0.06, 2.05, 0.9], "door");
    this.box(g, [x1 - 0.08, 1.0, 1.2], [0.06, 0.05, 0.1], "metal");
    // one bare bulb
    this.box(g, [-40, H - 0.2, 0], [0.01, 0.4, 0.01], "black");
    this.aptBulb = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.2, 1.3) });
    const bl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), this.aptBulb); bl.position.set(-40, H - 0.45, 0); bl.userData.noShadow = true; g.add(bl);
  }
  private traffic(R: THREE.Object3D) {
    const g = new THREE.Group(); R.add(g);
    const X = TCAR[0];
    this.box(g, [X, -0.05, -10], [14, 0.1, 80], "dark", false, rep(asphaltTex, 6, 30));
    for (let z = -48; z < 30; z += 4) for (const x of [-1.75, 1.75]) this.box(g, [X + x, 0.005, z], [0.12, 0.01, 1.8], "white", false);
    for (const sx of [-1, 1]) this.box(g, [X + sx * 8.5, 0.07, -10], [3, 0.14, 80], "frame", false);
    // grey office blocks along both sides
    for (let i = 0; i < 9; i++) for (const sx of [-1, 1]) {
      const h = 12 + ((i * 7 + (sx > 0 ? 3 : 0)) % 5) * 4, z = 20 - i * 9;
      this.box(g, [X + sx * 15, h / 2, z], [9, h, 8], i % 2 ? "metal" : "frame", false);
      for (let fl = 1; fl < h / 3; fl++) this.box(g, [X + sx * 10.45, fl * 3, z], [0.05, 1.1, 6.6], "metalDark", false);
    }
    const cols = ["#c95a4a", "#e2c14a", "#4a7ac9", "#8a8f99", "#f4f2ec", "#3a3f4a", "#6aa060"];
    this.car(g, TCAR, "#5fa3a0", 0, true);
    let k = 0;
    for (const lane of [-3.5, 0, 3.5]) for (let z = -32; z < 24; z += 5.2) {
      if (lane === 0 && z > -10 && z < 4) continue;
      this.car(g, [X + lane + 0.15 * Math.sin(k), 0, z + 0.6 * Math.cos(k * 1.3)], cols[k++ % cols.length], 0.03 * Math.sin(k));
    }
    // the bus in front of Trevor, its back to him
    this.box(g, [X, 1.65, -7.6], [2.5, 2.9, 10], mat("#e8b23a"));
    this.box(g, [X, 2.1, -2.58], [2.2, 1.0, 0.04], "black", false);
    for (const x of [-0.9, 0.9]) this.box(g, [X + x, 0.85, -2.58], [0.3, 0.16, 0.04], "red", false);
    for (const x of [-1.15, 1.15]) for (const z of [-4, -11]) { const w = this.cyl(g, [X + x, 0.45, z], 0.45, 0.3, "black"); w.rotation.z = Math.PI / 2; }
  }
  private coast(R: THREE.Object3D) {
    const g = new THREE.Group(); R.add(g);
    this.M.grass = mat("#ffffff", { map: rep(grassTex, 10, 40) }); this.M.cliff = mat("#b89a70"); this.M.sand = mat("#ffffff", { map: rep(sandTex, 4, 4) });
    this.M.palm = mat("#8a6a44"); this.M.frond = mat("#3f9a4a"); this.M.wing = mat("#f4f2ec");
    // plateau (top at y 0) with a cliff face dropping to the sea
    this.box(g, [CLIFF_X - 32, -13, 0], [64, 26, 220], "cliff");
    this.box(g, [CLIFF_X - 32, -0.04, 0], [64, 0.1, 220], "grass", false);
    this.box(g, [-199, 0.012, 0], [4.2, 0.02, 220], "dark", false, rep(asphaltTex, 2, 80));
    for (let z = -100; z < 100; z += 5) this.box(g, [-199, 0.03, z], [0.12, 0.01, 2.2], "white", false);
    for (let i = 0; i < 18; i++) { const z = -90 + i * 11; this.plantAt(g, [-206 - 3 * Math.sin(i), 0, z], 2.2 + Math.sin(i * 3)); }
    // the sea
    const om = new THREE.MeshBasicMaterial({ map: rep(oceanTex, 40, 40), color: new THREE.Color(0.95, 1.0, 1.05) });
    this.ocean = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), om); this.ocean.rotation.x = -Math.PI / 2; this.ocean.position.set(CLIFF_X + 400, -25, 0);
    this.ocean.userData.noShadow = true; this.ocean.layers.set(NOINK); g.add(this.ocean);
    // the island with a palm tree and a deck chair
    const I = ISLAND;
    const isl = this.cyl(g, [I[0], I[1] - 0.6, I[2]], 9, 1.2, "sand"); isl.userData.noCast = true;
    const palm = (x: number, z: number, h: number, lean: number) => {
      const t = new THREE.Group(); t.position.set(x, I[1], z); t.rotation.z = lean; g.add(t);
      for (let i = 0; i < 6; i++) this.cyl(t, [0.04 * i, (i + 0.5) * h / 6, 0], 0.16 - i * 0.012, h / 6 + 0.02, "palm");
      for (let i = 0; i < 7; i++) {
        const a = i * 0.9, f = new THREE.Mesh(new THREE.ConeGeometry(0.25, 2.4, 4), this.M.frond);
        f.position.set(0.25 + Math.cos(a) * 0.9, h - 0.1, Math.sin(a) * 0.9); f.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1 - 0.0); g.add(f);
        f.position.add(t.position); f.position.x += Math.sin(lean) * -h;
      }
    };
    palm(I[0] + 2.2, I[2] - 2.0, 5.5, -0.15);
    palm(I[0] - 4.0, I[2] - 3.5, 4.4, 0.12);
    // the daydream car (posed per frame) with fold-out wings
    const D = this.dcar; g.add(D);
    this.car(D, [0, 0, 0], "#5fa3a0", 0, true);
    for (const [w, sx] of [[this.wingL, -1], [this.wingR, 1]] as const) {
      w.position.set(sx * 0.86, 1.0, 0.1); D.add(w);
      this.box(w, [sx * 1.6, 0, 0], [3.2, 0.06, 1.2], "wing").userData.noCast = true;
      this.box(w, [sx * 3.0, 0.12, 0.35], [0.4, 0.24, 0.5], "red", false);
    }
  }
  private street(R: THREE.Object3D) {
    const g = new THREE.Group(); R.add(g);
    this.M.brick = mat("#ffffff", { map: rep(brickTex, 6, 4) }); this.M.pave = mat("#ffffff", { map: rep(paveTex, 10, 2) });
    // the office building facade, glass entrance, a little canopy
    this.box(g, [SX, 7, -0.6], [26, 14, 1.2], "brick", false);
    for (let fl = 1; fl < 5; fl++) for (let i = -5; i <= 5; i++) if (!(fl === 1 && Math.abs(i) < 1)) this.box(g, [SX + i * 2.2, fl * 2.9 + 0.2, 0.02], [1.3, 1.5, 0.04], "metalDark", false);
    this.box(g, [SX, 1.3, 0.0], [2.4, 2.7, 0.06], "dark", false);
    const D = this.streetDoor; D.position.set(SX - 1.0, 0, 0.12); g.add(D);
    const glass = new THREE.MeshBasicMaterial({ color: "#bfe0f0", transparent: true, opacity: 0.3, depthWrite: false });
    this.box(D, [0.5, 1.15, 0], [0.98, 2.3, 0.03], glass, false).layers.set(NOINK);
    for (const x of [0.02, 0.98]) this.box(D, [x, 1.15, 0], [0.05, 2.3, 0.06], "metalDark");
    for (const y of [0.03, 2.27]) this.box(D, [0.5, y, 0], [0.98, 0.06, 0.06], "metalDark");
    this.box(g, [SX + 0.5, 1.15, 0.1], [0.98, 2.3, 0.03], glass, false).layers.set(NOINK);
    this.box(g, [SX, 2.95, 0.8], [3.4, 0.12, 1.6], "red");
    // pavement, curb, road, the far side
    this.box(g, [SX, 0.06, 2.2], [40, 0.12, 4.4], "pave", false);
    this.box(g, [SX, 0.07, 4.45], [40, 0.14, 0.2], "frame", false);
    this.box(g, [SX, -0.02, 9.5], [40, 0.04, 10], "dark", false, rep(asphaltTex, 8, 2));
    this.box(g, [SX, 6, 20], [40, 12, 2], "brick", false);
    // a lamp post, a bench, a bin
    this.cyl(g, [SX + 4.2, 2.2, 3.9], 0.06, 4.4, "metalDark"); this.box(g, [SX + 3.8, 4.35, 3.9], [0.9, 0.12, 0.25], "metalDark");
    this.box(g, [SX - 4.0, 0.55, 3.6], [1.6, 0.08, 0.45], "wood"); this.box(g, [SX - 4.0, 0.85, 3.85], [1.6, 0.45, 0.06], "wood");
    for (const dx of [-0.7, 0.7]) this.box(g, [SX - 4.0 + dx, 0.3, 3.6], [0.06, 0.5, 0.4], "metalDark");
    this.cyl(g, [SX + 2.6, 0.5, 3.9], 0.28, 0.8, "teal");
  }
  /** the ceiling vent Dave hangs out of */
  private ceilVent(g: THREE.Object3D) {
    const [x, , z] = CEIL_VENT;
    this.box(g, [x, CEIL - 0.005, z], [0.9, 0.02, 0.9], "ductIn", false).userData.noCast = true;
    for (const [dx, dz, w, d] of [[0, -0.47, 1.0, 0.06], [0, 0.47, 1.0, 0.06], [-0.47, 0, 0.06, 1.0], [0.47, 0, 0.06, 1.0]] as const) this.box(g, [x + dx, CEIL - 0.02, z + dz], [w, 0.04, d], "duct", false);
    const gr = this.box(g, [x + 0.62, CEIL - 0.3, z + 0.2], [0.8, 0.03, 0.8], "metal"); gr.rotation.z = 1.2; // the grate, hanging open
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
    const sunDir = new THREE.Vector3(...((s.set === "apt" ? [0.35, 0.9, 0.45] : s.set === "traffic" ? [0.3, 0.9, 0.4] : s.set === "coast" ? [0.55, 0.62, 0.55] : s.set === "street" ? [0.45, 0.7, 0.55] : [-0.66, 0.62, 0.22]) as V3)).normalize();
    let lvl = lightLevel(f);
    // time-lapse: days and nights flicker past from "one more week" to past "seventy times"
    let night = 0;
    if (night) lvl *= 0.35;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI * lvl;
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    const Rr = s.set === "coast" ? 22 : s.set === "traffic" ? 16 : s.set === "street" ? 12 : 9;
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
    const pk = s.light === "horror" ? 0.9 : s.light === "dim" ? 1.2 : s.light === "dark" ? 0.0 : 1.7;
    this.panels.color.setRGB(pk * k, pk * k * (s.light === "horror" ? 1.12 : 1), pk * k * (s.light === "horror" ? 1.05 : 0.95));
    const nt = s.light === "dim" || s.light === "dark";
    const wv = s.light === "dark" ? 0.12 : s.light === "dim" ? 0.3 : 1;
    this.windowMat.color.setRGB(wv * (nt ? 0.35 : 1), wv * (nt ? 0.45 : 1), wv * (nt ? 1.0 : 1));
    this.exitSign.color.setRGB(1.6, 1.6, 1.6);
    this.printerLed.color.setRGB(0.2, (Math.floor(f / 6) % 2 ? 2.2 : 0.6), 0.6);
    for (const fl of this.flames) fl.scale.set(1, 1.6 + 0.25 * Math.sin(f * 1.7 + fl.position.x * 40), 1);
    // ---- props posed by the story ----
    this.platePut.visible = false;
    this.poster.rotation.z = 0; this.poster.position.set(POSTER[0] - 0.01, POSTER[1] - 0.56, POSTER[2]);
    this.grate.rotation.x = 0; this.grate.position.set(VENT[0], 0.06, VENT[2] - 0.02);
    this.fireDoor.rotation.y = 0;
    this.bulb.color.setRGB(2.4 * k + 0.2, 2.1 * k + 0.15, 1.5 * k + 0.1);
    this.elevL.position.z = ELEV[2] - 0.3; this.elevR.position.z = ELEV[2] + 0.3;
    // the daydream car
    const dc = dreamCar(f);
    this.dcar.visible = s.set === "coast" && id !== 13 || id === 13;
    if (id === 13) { this.dcar.position.set(ISLAND[0] - 2.4, ISLAND[1] + 0.05, ISLAND[2] - 2.6); this.dcar.rotation.set(0, 0.5, 0, "YXZ"); this.setWings(1); }
    else { this.dcar.position.set(...dc.pos); this.dcar.rotation.set(dc.pitch, -dc.yaw, dc.roll, "YXZ"); this.setWings(dc.wings); }
    this.ocean.position.y = -25 + 0.04 * Math.sin(f * 0.1);
    this.aptBulb.color.setRGB(2.6, 2.2, 1.3);
    // the street door: kicked open for the toss
    const dOpen = id === 27 ? Math.sin(Math.PI * clamp01((f - 2103) / 22)) : 0;
    this.streetDoor.rotation.y = -1.4 * dOpen;
    this.buttonMat.color.setRGB(0.85, 0.85, 0.82);
    for (const m of this.screens) { const on = s.light === "dark" || lvl < 0.5 ? 0.08 : s.light === "dim" ? 1.3 : 1.15; m.map = screenTex; m.color.setRGB(on, on, on); }
    this.mugs.forEach((m) => { m.visible = false; });
    this.plant.scale.setScalar(1);
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
      const sy = (p.sy ?? 1) * (1 + 0.007 * Math.sin(f * 0.19 + ai * 1.7)), sx = (p.sx ?? 1) / Math.sqrt(1 + 0.007 * Math.sin(f * 0.19 + ai * 1.7));
      a.mesh.scale.set((p.mirror ? -sc2 : sc2) * sx, sc2 * sy, sc2);
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
