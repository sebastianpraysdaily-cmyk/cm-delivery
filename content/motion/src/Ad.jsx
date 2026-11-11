// Savings Challenges Mega Bundle — motion graphics ad (1080x1920, 30fps).
// Real bundle pages + CC0 desk photo + CC0 music (Openverse) + real app recording.
import React from "react";
import { AbsoluteFill, Img, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import timing from "../public/timing.json";
import cells from "../public/cells.json";

const INK = "#1f1b2e", SUN = "#ffd23f", PINK = "#ff5fa2", MINT = "#3ddc97", SKY = "#4cc9f0", GRAPE = "#7b61ff", CREAM = "#fff9f2";
const B = Object.fromEntries(timing.beats.map((b) => [b.id, b]));
const fontFace = `@font-face{font-family:Fredoka;font-weight:700;src:url(${staticFile("fredoka700.woff2")})}@font-face{font-family:Fredoka;font-weight:600;src:url(${staticFile("fredoka600.woff2")})}`;
const PAGE_RATIO = 1056 / 816;
const f = (s) => Math.round(s * 30);

// word timings for captions (spread inside each beat by character weight)
const WORDS = timing.beats.flatMap((b) => {
  const ws = b.text.split(" "); const wt = ws.map((w) => w.length + 2); const tot = wt.reduce((a, c) => a + c, 0); let t = b.start;
  return ws.map((w, i) => { const d = (b.dur * wt[i]) / tot; const o = { id: b.id, w, s: t, e: t + d }; t += d; return o; });
});

function Backdrop() {
  const fr = useCurrentFrame(); const s = interpolate(fr, [0, 600], [1.08, 1.2]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#3a3a3d" }}>
      <Img src={staticFile("photo_1.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${s})`, filter: "blur(6px) brightness(0.72) saturate(0.9)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 30%, rgba(10,8,20,.55) 100%)" }} />
    </AbsoluteFill>
  );
}

function Page({ n, width, x, y, rot = 0, scale = 1, opacity = 1, fill = null, fillColor = PINK, shadow = true }) {
  const h = width * PAGE_RATIO;
  return (
    <div style={{ position: "absolute", left: x - width / 2, top: y - h / 2, width, height: h, transform: `rotate(${rot}deg) scale(${scale})`, opacity, boxShadow: shadow ? "0 40px 80px rgba(0,0,0,.45)" : "none", borderRadius: 6, overflow: "hidden", background: "#fff" }}>
      <Img src={staticFile(`pg${String(n).padStart(2, "0")}.png`)} style={{ width: "100%", height: "100%" }} />
      {fill && fill.map(([cx, cy, cw], i) => (
        <div key={i} style={{ position: "absolute", left: (cx - cw * 0.36) * width, top: cy * h - cw * 0.36 * width, width: cw * 0.72 * width, height: cw * 0.72 * width, borderRadius: "50%", background: fillColor, mixBlendMode: "multiply", opacity: 0.85 }} />
      ))}
    </div>
  );
}

function Headline({ top, lines, at }) {
  const fr = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center" }}>
      {lines.map(([t, color, size], i) => {
        const s = spring({ frame: fr - at - i * 4, fps, config: { damping: 12, stiffness: 180 } });
        return <div key={i} style={{ fontFamily: "Fredoka", fontWeight: 700, fontSize: size, lineHeight: 1.02, color, transform: `translateY(${(1 - s) * 60}px) scale(${0.85 + s * 0.15})`, opacity: s, textShadow: "0 6px 0 rgba(0,0,0,.35)" }}>{t}</div>;
      })}
    </div>
  );
}

function Counter({ top, from, to, at, dur, prefix = "$", color = SUN }) {
  const fr = useCurrentFrame();
  const v = Math.round(interpolate(fr, [at, at + dur], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  const done = fr > at + dur; const bump = done ? interpolate(fr, [at + dur, at + dur + 8], [1.15, 1], { extrapolateRight: "clamp" }) : 1;
  return <div style={{ position: "absolute", top, left: "50%", transform: `translateX(-50%) scale(${bump})`, background: color, color: INK, border: `6px solid ${INK}`, borderRadius: 999, padding: "10px 46px", fontFamily: "Fredoka", fontWeight: 700, fontSize: 84, boxShadow: `8px 8px 0 ${INK}` }}>{prefix}{v.toLocaleString("en-US")}</div>;
}

// fill a page's cells one by one over [a, a+d] frames
const filled = (n, fr, a, d) => { const list = cells[n] || []; const k = Math.floor(interpolate(fr, [a, a + d], [0, list.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })); return list.slice(0, k); };

function Scene1() { // $4,000 in 26 paychecks
  const fr = useCurrentFrame(); const { fps } = useVideoConfig();
  const s = spring({ frame: fr, fps, config: { damping: 14, stiffness: 120 } });
  const out = interpolate(fr, [f(B.p2.start) - 6, f(B.p2.start) + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (<>
    <Headline top={150} at={0} lines={[["SAVE $4,000", "#fff", 128], ["in 26 paychecks", SUN, 88]]} />
    <Page n={23} width={660} x={540 - out * 900} y={1050 + (1 - s) * 900} rot={(1 - s) * 14 - 3 - out * 10} fill={filled(23, fr, 12, f(B.p1.dur) - 6)} fillColor={PINK} />
    <Counter top={430} from={0} to={4000} at={12} dur={f(B.p1.dur) - 6} />
  </>);
}
function Scene2() { // $1,000 by Christmas
  const fr = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: fr, fps, config: { damping: 13, stiffness: 140 } });
  return (<>
    <Headline top={170} at={0} lines={[["$1,000", "#fff", 140], ["by Christmas", MINT, 96]]} />
    <Page n={39} width={660} x={540 + (1 - s) * 900} y={1060} rot={(1 - s) * -12 + 2} fill={filled(39, fr, 4, f(B.p2.dur))} fillColor={MINT} />
  </>);
}
function Scene3() { // $10,000 by next year
  const fr = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: fr, fps, config: { damping: 12, stiffness: 160 } });
  return (<>
    <Headline top={170} at={0} lines={[["$10,000", SUN, 160], ["by next year", "#fff", 92]]} />
    <Page n={20} width={680} x={540} y={1070} scale={0.6 + s * 0.4} rot={(1 - s) * 20} fill={filled(20, fr, 2, f(B.p3.dur) + 4)} fillColor={SKY} />
  </>);
}
const FAN = [4, 14, 19, 23, 27, 30, 35, 39, 40, 42, 44, 48, 52, 62, 64, 66, 31, 20];
function Scene4() { // 63 challenges explode into a grid
  const fr = useCurrentFrame(); const { fps } = useVideoConfig();
  return (<>
    {FAN.map((n, i) => {
      const s = spring({ frame: fr - i * 1.5, fps, config: { damping: 14, stiffness: 110 } });
      const col = i % 3, row = Math.floor(i / 3); const tx = 190 + col * 350, ty = 520 + row * 300;
      return <Page key={n} n={n} width={250} x={540 + (tx - 540) * s} y={1150 + (ty - 1150) * s} rot={(1 - s) * (i % 2 ? 25 : -25) + (i % 3 - 1) * 3} opacity={Math.min(1, s * 1.5)} />;
    })}
    <AbsoluteFill style={{ background: `rgba(10,8,20,${interpolate(fr, [10, 30], [0, 0.45], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })})` }} />
    <Counter top={640} from={0} to={63} at={8} dur={30} prefix="" color={SUN} />
    <Headline top={820} at={10} lines={[["savings", "#fff", 130], ["challenges", "#fff", 130], ["every goal · every amount", SUN, 58]]} />
  </>);
}
function Scene5() { // print it / play it
  const fr = useCurrentFrame(); const { fps } = useVideoConfig();
  const a = spring({ frame: fr, fps, config: { damping: 14 } }), b = spring({ frame: fr - 18, fps, config: { damping: 14 } });
  return (<>
    <div style={{ position: "absolute", left: 60 - (1 - a) * 600, top: 520, transform: `rotate(-5deg)` }}>
      <div style={{ width: 470, height: 608, background: "#fff", boxShadow: "0 30px 70px rgba(0,0,0,.5)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 8 }}>
        {[31, 39, 48, 62].map((n) => <Img key={n} src={staticFile(`pg${n}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", outline: "2px dashed #aaa" }} />)}
      </div>
      <div style={{ marginTop: 26, textAlign: "center", fontFamily: "Fredoka", fontWeight: 700, fontSize: 70, color: "#fff" }}>Print it</div>
    </div>
    <div style={{ position: "absolute", right: 70 - (1 - b) * 700, top: 420, transform: "rotate(5deg)" }}>
      <div style={{ width: 420, height: 860, background: INK, borderRadius: 64, padding: 18, boxShadow: `0 30px 70px rgba(0,0,0,.55)` }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 48, overflow: "hidden" }}><OffthreadVideo src={staticFile("app.mp4")} muted startFrom={60} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
      </div>
      <div style={{ marginTop: 26, textAlign: "center", fontFamily: "Fredoka", fontWeight: 700, fontSize: 70, color: SUN }}>Play it</div>
    </div>
  </>);
}
function Scene6() { // end card
  const fr = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: fr, fps, config: { damping: 11, stiffness: 150 } });
  const pulse = 1 + Math.sin(fr / 5) * 0.03;
  return (<>
    <AbsoluteFill style={{ background: "rgba(10,8,20,.5)" }} />
    <div style={{ position: "absolute", top: 520, left: 90, right: 90, background: CREAM, border: `8px solid ${INK}`, borderRadius: 60, padding: "60px 40px", textAlign: "center", transform: `scale(${0.6 + s * 0.4})`, boxShadow: `14px 14px 0 ${PINK}` }}>
      <div style={{ fontFamily: "Fredoka", fontWeight: 700, fontSize: 130, color: INK, lineHeight: 1 }}>Savings<br />Sprints</div>
      <div style={{ fontFamily: "Fredoka", fontWeight: 600, fontSize: 52, color: INK, marginTop: 30 }}>63 savings challenges<br />+ the game app</div>
    </div>
    <div style={{ position: "absolute", top: 1240, left: "50%", transform: `translateX(-50%) scale(${pulse * s})`, background: SUN, border: `7px solid ${INK}`, borderRadius: 999, padding: "18px 70px", fontFamily: "Fredoka", fontWeight: 700, fontSize: 80, color: INK, boxShadow: `8px 8px 0 ${INK}` }}>link in bio</div>
  </>);
}

function Captions() {
  const fr = useCurrentFrame(); const t = fr / 30;
  const i = WORDS.findIndex((w) => w.s <= t && t < w.e + 0.2);
  if (i < 0) return null;
  // chunk within the current line only, so captions never straddle a scene change
  const lineStart = WORDS.findIndex((w) => w.id === WORDS[i].id); const st = lineStart + Math.floor((i - lineStart) / 3) * 3;
  const chunk = WORDS.slice(st, st + 3).filter((w) => w.id === WORDS[i].id);
  return (
    <div style={{ position: "absolute", bottom: 230, left: 40, right: 40, textAlign: "center", fontFamily: "Fredoka", fontWeight: 700, fontSize: 78, lineHeight: 1.1 }}>
      {chunk.map((w, k) => <span key={k} style={{ color: st + k === i ? SUN : "#fff", opacity: w.s <= t ? 1 : 0.55, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke", margin: "0 10px", display: "inline-block", transform: st + k === i ? "scale(1.08)" : "none" }}>{w.w}</span>)}
    </div>
  );
}

export const Ad = () => {
  const { durationInFrames } = useVideoConfig();
  const seg = (id, next) => [f(B[id].start), next ? f(B[next].start) - f(B[id].start) : durationInFrames - f(B[id].start)];
  const S = [["p1", "p2", Scene1], ["p2", "p3", Scene2], ["p3", "p4", Scene3], ["p4", "p5", Scene4], ["p5", "p6", Scene5], ["p6", null, Scene6]];
  return (
    <AbsoluteFill style={{ background: INK }}>
      <style>{fontFace}</style>
      <Backdrop />
      {S.map(([id, nx, C]) => { const [from, d] = seg(id, nx); return <Sequence key={id} from={from} durationInFrames={d}><C /></Sequence>; })}
      <Captions />
      <Audio src={staticFile("vo.wav")} />
      <Audio src={staticFile("music_blue_sky_mp3.mp3")} volume={(fr) => interpolate(fr, [0, 10, durationInFrames - 30, durationInFrames], [0, 0.16, 0.16, 0], { extrapolateRight: "clamp" })} />
    </AbsoluteFill>
  );
};
