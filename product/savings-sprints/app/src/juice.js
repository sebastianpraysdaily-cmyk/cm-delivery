// Juice engine: haptics, synthesized sound, tilt gravity, physics confetti + particle bursts.
// Everything is progressive enhancement: each feature silently does nothing where unsupported.

/* ---------------- haptics ----------------
   Android/Chrome: navigator.vibrate. iPhone Safari has no Vibration API; the hidden
   <input type=checkbox switch> trick plays a system tick on iOS versions that allow it. */
let iosSwitch = null;
function iosTick() {
  try {
    if (!iosSwitch) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox"; input.setAttribute("switch", "");
      label.appendChild(input);
      label.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none";
      document.body.appendChild(label); iosSwitch = label;
    }
    iosSwitch.click();
  } catch (e) { /* unsupported */ }
}
const canVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;
export function haptic(kind = "tap") {
  if (!settings.haptics) return;
  const P = { tap: [12], pop: [18], combo: [10, 30, 14], milestone: [20, 40, 30], level: [30, 50, 30, 50, 60], win: [40, 60, 40, 60, 120] };
  if (canVibrate) { try { navigator.vibrate(P[kind] || P.tap); } catch (e) {} return; }
  const n = { tap: 1, pop: 1, combo: 2, milestone: 2, level: 3, win: 4 }[kind] || 1;
  for (let i = 0; i < n; i++) setTimeout(iosTick, i * 90);
}

/* ---------------- sound (WebAudio, no files) ---------------- */
let ctx = null;
function ac() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } } return ctx; }
function tone(freq, dur, type = "sine", vol = 0.18, when = 0, slide = 0) {
  const a = ac(); if (!a || !settings.sound) return;
  const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
export const sfx = {
  pop(combo = 1) { const f = 520 * Math.pow(1.06, Math.min(combo, 12)); tone(f, 0.12, "triangle", 0.2, 0, 1.6); tone(f * 2, 0.06, "sine", 0.06, 0.02); },
  undo() { tone(300, 0.12, "sine", 0.12, 0, 0.6); },
  coin() { tone(988, 0.08, "square", 0.08); tone(1319, 0.18, "square", 0.08, 0.07); },
  milestone() { [523, 659, 784].forEach((f, i) => tone(f, 0.18, "triangle", 0.16, i * 0.09)); },
  level() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, "square", 0.09, i * 0.1)); tone(1568, 0.5, "triangle", 0.12, 0.42); },
  win() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, "triangle", 0.15, i * 0.08)); },
  unlock() { tone(440, 0.1, "sine", 0.15); tone(880, 0.3, "sine", 0.15, 0.1, 1.5); },
};
export const settings = { sound: true, haptics: true };

/* ---------------- tilt -> gravity ----------------
   Phones: DeviceOrientation (iPhone asks once, from a tap). Desktop: pointer position stands in for tilt. */
export const gravity = { x: 0, y: 1 };
let tiltOn = false;
function onOrient(e) {
  const g = Math.max(-60, Math.min(60, e.gamma || 0)) / 60;   // left/right
  const b = Math.max(-30, Math.min(90, e.beta ?? 60));          // front/back
  gravity.x = g * 1.1; gravity.y = 0.35 + Math.max(0, Math.min(1, b / 70)) * 0.75;
}
export async function enableTilt() {
  if (tiltOn) return true;
  try {
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === "function") {
      const r = await D.requestPermission(); if (r !== "granted") return false;
    }
    if (D) { window.addEventListener("deviceorientation", onOrient); tiltOn = true; return true; }
  } catch (e) {}
  return false;
}
export function pointerTilt(e) { // desktop stand-in
  if (tiltOn) return;
  const x = (e.clientX / window.innerWidth) * 2 - 1; gravity.x = x * 0.9; gravity.y = 1;
}

/* ---------------- particles + confetti (one canvas over everything) ---------------- */
const COLORS = ["#ff5fa2", "#ffd23f", "#3ddc97", "#4cc9f0", "#7b61ff", "#ff8c42", "#ffffff"];
let cv = null, cx2 = null, parts = [], raf = 0, dpr = 1;
export function mountCanvas(canvas) {
  cv = canvas; cx2 = cv.getContext("2d"); resize(); window.addEventListener("resize", resize);
}
function resize() {
  if (!cv) return; dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = window.innerWidth * dpr; cv.height = window.innerHeight * dpr; cv.style.width = "100%"; cv.style.height = "100%";
}
function loop() {
  if (!cx2) return;
  const W = cv.width / dpr, H = cv.height / dpr;
  cx2.setTransform(dpr, 0, 0, dpr, 0, 0); cx2.clearRect(0, 0, W, H);
  const gx = gravity.x * 0.32, gy = gravity.y * 0.32;
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) {
    if (p.kind === "burst") { p.vy += 0.18; p.vx *= 0.96; p.vy *= 0.96; p.life -= 1; }
    else { // confetti: gravity follows phone tilt, piles up on the edge it's tipped toward
      p.vx += gx + Math.sin(p.t * 0.08 + p.seed) * 0.04; p.vy += gy; p.vx *= 0.985; p.vy *= 0.985; p.t++;
      if (p.y > H - p.h / 2) { p.y = H - p.h / 2; p.vy *= -0.25; p.vx *= 0.8; p.rest++; }
      if (p.x < p.w / 2) { p.x = p.w / 2; p.vx *= -0.3; }
      if (p.x > W - p.w / 2) { p.x = W - p.w / 2; p.vx *= -0.3; }
      if (p.rest > 90) p.life -= 2; else p.life -= 0.15;
      p.rot += p.vr * (p.rest > 4 ? 0.2 : 1);
    }
    p.x += p.vx; p.y += p.vy;
    cx2.save(); cx2.globalAlpha = Math.min(1, p.life / 40); cx2.translate(p.x, p.y); cx2.rotate(p.rot);
    cx2.fillStyle = p.c;
    if (p.shape === "c") { cx2.beginPath(); cx2.arc(0, 0, p.w / 2, 0, Math.PI * 2); cx2.fill(); }
    else { cx2.scale(1, Math.cos(p.t * 0.15 + p.seed)); cx2.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
    cx2.restore();
  }
  raf = parts.length ? requestAnimationFrame(loop) : 0;
}
function kick() { if (!raf) raf = requestAnimationFrame(loop); }
const reduce = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function burst(x, y, color, n = 16) {
  if (reduce()) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 5;
    parts.push({ kind: "burst", x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, w: 5 + Math.random() * 5, h: 5, c: Math.random() < 0.7 ? color : "#ffffff", shape: "c", rot: 0, vr: 0, life: 40 + Math.random() * 20, t: 0, seed: 0, rest: 0 });
  }
  kick();
}
// Confetti pours in from above the screen ("from another screen"), falls with tilt gravity, then settles.
export function confetti(n = 160) {
  if (reduce()) return;
  const W = window.innerWidth;
  for (let i = 0; i < n; i++) {
    parts.push({ kind: "conf", x: Math.random() * W, y: -20 - Math.random() * 500, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4,
      w: 7 + Math.random() * 7, h: 10 + Math.random() * 10, c: COLORS[(Math.random() * COLORS.length) | 0], shape: Math.random() < 0.25 ? "c" : "r",
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, life: 220, t: 0, seed: Math.random() * 10, rest: 0 });
  }
  kick();
}

/* screen shake */
export function shake(el, strength = 8) {
  if (!el || reduce() || !el.animate) return;
  el.animate([{ transform: "translate(0,0)" }, { transform: `translate(${-strength}px,${strength / 2}px)` }, { transform: `translate(${strength}px,${-strength / 2}px)` },
    { transform: `translate(${-strength / 2}px,0)` }, { transform: "translate(0,0)" }], { duration: 320, easing: "ease-out" });
}
