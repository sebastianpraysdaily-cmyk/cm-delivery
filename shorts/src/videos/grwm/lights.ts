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
export type Light = "office" | "dim" | "horror" | "dark" | "apt" | "gray" | "dream" | "sunny";
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
  // dingy apartment: one bare yellow bulb, grimy greenish shade
  apt: {
    az: 50, el: 50,
    lit: [1.25, 1.1, 0.8], shade: [0.26, 0.27, 0.24], lift: [0.04, 0.045, 0.04], lambert: 0.45, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.93, 0.8], charShade: 0.86, charGrad: 0.1, bodyGrad: 0.24, sideTint: [0.9, 0.88, 0.82],
    blob: [0.5, 0.48, 0.44], actorShadow: false,
    top: "#3a3a30", hor: "#3a3a30", skyCurve: [0.0, 0.5, 0.6], fog: "#2e2c26", fogNear: 12, fogFar: 60, sunDisc: "#000000",
    sunCol: "#ffe0a0", sunI: 2.4, sky: "#c8b890", ground: "#504838", hemiI: 0.45,
    bias: -0.0003, normalBias: 0.012,
  },
  // overcast gridlock: flat grey light, desaturated
  gray: {
    az: 30, el: 60,
    lit: [1.18, 1.2, 1.24], shade: [0.42, 0.44, 0.5], lift: [0.06, 0.065, 0.08], lambert: 0.3, sideK: 0.88, term: 0.25,
    charTint: [0.92, 0.93, 0.96], charShade: 0.9, charGrad: 0.06, bodyGrad: 0.18, sideTint: [0.9, 0.9, 0.94],
    blob: [0.55, 0.56, 0.6], actorShadow: false,
    top: "#8f969e", hor: "#b9bdc2", skyCurve: [0.0, 0.5, 0.6], fog: "#a9aeb4", fogNear: 25, fogFar: 160, sunDisc: "#000000",
    sunCol: "#eef0f4", sunI: 2.0, sky: "#c8ccd2", ground: "#6a6a6a", hemiI: 0.6,
    bias: -0.0003, normalBias: 0.012,
  },
  // the daydream: postcard sun, saturated, warm key, blue shade
  dream: {
    az: 70, el: 42,
    lit: [1.65, 1.52, 1.3], shade: [0.34, 0.36, 0.55], lift: [0.05, 0.07, 0.13], lambert: 0.35, sideK: 0.86, term: 0.2,
    charTint: [1.02, 0.98, 0.92], charShade: 0.88, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.9, 0.98],
    blob: [0.4, 0.42, 0.6], actorShadow: false,
    top: "#2f86e8", hor: "#9fd4f5", skyCurve: [0.0, 0.5, 0.6], fog: "#9fd4f5", fogNear: 60, fogFar: 420, sunDisc: "#000000",
    sunCol: "#fff1d0", sunI: 3.0, sky: "#bfe2ff", ground: "#c8b080", hemiI: 0.6,
    bias: -0.0003, normalBias: 0.012,
  },
  // the street after the sun comes out
  sunny: {
    az: 60, el: 40,
    lit: [1.6, 1.48, 1.28], shade: [0.36, 0.37, 0.52], lift: [0.05, 0.065, 0.12], lambert: 0.35, sideK: 0.86, term: 0.2,
    charTint: [1.02, 0.97, 0.9], charShade: 0.88, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.9, 0.98],
    blob: [0.42, 0.44, 0.6], actorShadow: false,
    top: "#3e8ae0", hor: "#b4d8f2", skyCurve: [0.0, 0.5, 0.6], fog: "#b4d8f2", fogNear: 40, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff0d0", sunI: 2.9, sky: "#cfe6ff", ground: "#b49a78", hemiI: 0.55,
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
  apt: { bounce: [0.01, 0.01, 0], sat: 0.8, window: ["#8a8a7a", "#6a6a5a", "#4a4a40"] },
  gray: { bounce: [0, 0, 0], sat: 0.7, window: ["#b0b4b8", "#9aa0a6", "#80868c"] },
  dream: { bounce: [0.02, 0.015, 0], sat: 1.18, window: ["#cfe4f7", "#9cc3ea", "#6a9fe0"] },
  sunny: { bounce: [0.02, 0.015, 0], sat: 1.1, window: ["#cfe4f7", "#9cc3ea", "#6a9fe0"] },
};
