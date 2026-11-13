// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
export type Light = "office" | "dim" | "horror" | "dark";
export const LIGHTS: Record<Light, LightPreset> = {
  // bright office morning: sun through the window wall, soft bluish shade (interiors bounce a lot of light)
  office: {
    az: 70, el: 38,
    lit: [1.5, 1.45, 1.32], shade: [0.46, 0.46, 0.56], lift: [0.05, 0.06, 0.1], lambert: 0.35, sideK: 0.86, term: 0.2,
    charTint: [1.0, 0.96, 0.93], charShade: 0.88, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.9, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#dfe6ee", fogNear: 30, fogFar: 260, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55,
    bias: -0.0003, normalBias: 0.012,
  },
  // late, uneasy: half the panels off, cooler, longer shadows
  dim: {
    az: 60, el: 30,
    lit: [1.05, 1.02, 0.98], shade: [0.22, 0.23, 0.33], lift: [0.03, 0.04, 0.09], lambert: 0.4, sideK: 0.84, term: 0.2,
    charTint: [0.86, 0.88, 0.92], charShade: 0.86, charGrad: 0.09, bodyGrad: 0.24, sideTint: [0.85, 0.85, 0.95],
    blob: [0.55, 0.55, 0.6], actorShadow: false,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#4a5566", fogNear: 14, fogFar: 70, sunDisc: "#000000",
    sunCol: "#e8f0ff", sunI: 2.2, sky: "#b0c0d8", ground: "#605870", hemiI: 0.4,
    bias: -0.0003, normalBias: 0.012,
  },
  // horror: one sickly fluorescent key, near-black shade, dark teal fog that swallows the far office
  horror: {
    az: 40, el: 55,
    lit: [0.62, 0.86, 0.82], shade: [0.05, 0.06, 0.11], lift: [0.02, 0.03, 0.06], lambert: 0.5, sideK: 0.8, term: 0.15,
    charTint: [0.66, 0.82, 0.86], charShade: 0.8, charGrad: 0.14, bodyGrad: 0.3, sideTint: [0.7, 0.75, 0.9],
    blob: [0.4, 0.42, 0.5], actorShadow: false,
    top: "#10202a", hor: "#10202a", skyCurve: [0.0, 0.5, 0.6], fog: "#0b161c", fogNear: 5, fogFar: 34, sunDisc: "#000000",
    sunCol: "#d0fff0", sunI: 2.0, sky: "#203040", ground: "#101418", hemiI: 0.3,
    bias: -0.0003, normalBias: 0.012,
  },
  // lights out: only the monitors glow. Cold blue key from the screens, near-black shade, deep blue fog
  dark: {
    az: 0, el: 20,
    lit: [0.34, 0.46, 0.78], shade: [0.04, 0.05, 0.1], lift: [0.015, 0.02, 0.05], lambert: 0.5, sideK: 0.8, term: 0.15,
    charTint: [0.62, 0.74, 1.0], charShade: 0.78, charGrad: 0.16, bodyGrad: 0.32, sideTint: [0.6, 0.68, 0.95],
    blob: [0.35, 0.38, 0.5], actorShadow: false,
    top: "#05080f", hor: "#05080f", skyCurve: [0.0, 0.5, 0.6], fog: "#04070d", fogNear: 9, fogFar: 42, sunDisc: "#000000",
    sunCol: "#a8c8ff", sunI: 1.6, sky: "#18243a", ground: "#06080c", hemiI: 0.25,
    bias: -0.0003, normalBias: 0.012,
  },
};

/** world-only look per light (sky stops by elevation in degrees, river colours, cloud palette). All colours are
 *  ON-SCREEN targets under the current PBR-Neutral tone map; world.ts pre-inverts the tone map (shade.ts untone). */
type _WL = {
  sky: { c: string[]; e: number[] };                         // 5 stops: c[i] at elevation e[i] (deg), smoothstep between
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;                                                 // shade.ts uBounce: albedo x bounce on shaded faces turned to the lens
  sat: number;                                                // shade.ts uSat: world albedo saturation (1 = as painted)
  cloud: { lit: string; mid: string; shade: string };
};
export const LOOK: Record<Light, { bounce: C3; sat: number; window: string[] }> = {
  office: { bounce: [0.02, 0.015, 0.0], sat: 1.06, window: ["#cfe4f7", "#9cc3ea", "#6a9fe0"] },
  dim: { bounce: [0, 0, 0], sat: 0.92, window: ["#8a9ab8", "#5a6a8a", "#33405a"] },
  horror: { bounce: [0, 0, 0], sat: 0.7, window: ["#0e1a24", "#0a141c", "#060c12"] },
  dark: { bounce: [0, 0, 0], sat: 0.8, window: ["#0a1020", "#080c18", "#04060c"] },
};
