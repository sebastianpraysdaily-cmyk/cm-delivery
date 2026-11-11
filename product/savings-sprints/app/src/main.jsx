import React, { useEffect, useRef, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from "framer-motion";
import { ArrowLeft, Lock, Flame, Snowflake, Trophy, Settings, Volume2, VolumeX, Smartphone, Vibrate, Sparkles, X } from "lucide-react";
import { SPRINTS, LEVELS, BADGES, xpFor, levelOf, load, save, fresh, toggle, unlockedCount, savedIn, totalSaved, pctOf, mysteryIndex } from "./game.js";
import { haptic, sfx, settings, enableTilt, pointerTilt, mountCanvas, burst, confetti, shake } from "./juice.js";

const INK = "#1f1b2e";
const cx = (...c) => c.filter(Boolean).join(" ");
const money = (n) => "$" + n.toLocaleString("en-US");

function Count({ value, prefix = "", className }) {
  const mv = useMotionValue(value); const txt = useTransform(mv, (v) => prefix + Math.round(v).toLocaleString("en-US"));
  useEffect(() => { const c = animate(mv, value, { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }); return c.stop; }, [value]);
  return <motion.span className={className}>{txt}</motion.span>;
}

function LevelRing({ xp }) {
  const lvl = levelOf(xp), a = xpFor(lvl), b = xpFor(lvl + 1), p = (xp - a) / (b - a);
  const R = 22, C = 2 * Math.PI * R;
  return (
    <div className="relative grid size-14 place-items-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90"><circle cx="28" cy="28" r={R} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="6" />
        <motion.circle cx="28" cy="28" r={R} fill="none" stroke="#ffd23f" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} animate={{ strokeDashoffset: C * (1 - p) }} transition={{ type: "spring", stiffness: 120, damping: 20 }} /></svg>
      <span className="font-display text-xl font-bold text-white">{lvl}</span>
    </div>
  );
}

function TopBar({ s, onBadges, onSettings }) {
  const lvl = levelOf(s.xp);
  return (
    <div className="sticky z-30 flex items-center gap-3 bg-ink/95 px-4 pb-3 pt-3 backdrop-blur" style={{ top: "env(safe-area-inset-top,0px)" }}>
      <LevelRing xp={s.xp} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[15px] font-bold text-sun">{LEVELS[Math.min(lvl - 1, LEVELS.length - 1)]}</div>
        <div className="text-[12px] font-semibold text-white/70"><Count value={s.xp} /> XP · {xpFor(lvl + 1) - s.xp} to Lv {lvl + 1}</div>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-white" title="Streak"><Flame className={cx("size-4", s.streak > 0 ? "text-tang" : "text-white/40")} /><span className="font-display text-sm font-bold tabular-nums">{s.streak}</span>{s.freezes > 0 && <Snowflake className="size-3.5 text-sky" />}</div>
      <button onClick={onBadges} aria-label="Badges" className="grid size-9 place-items-center rounded-full bg-white/10 text-sun"><Trophy className="size-4" /></button>
      <button onClick={onSettings} aria-label="Settings" className="grid size-9 place-items-center rounded-full bg-white/10 text-white"><Settings className="size-4" /></button>
    </div>
  );
}

function MiniArt({ sp, s }) {
  const done = new Set(s.filled[sp.id] || []);
  if (sp.kind === "days") return <DaysRing sp={sp} done={done} mini />;
  return (
    <svg viewBox="0 0 1000 1000" className="h-full w-full"><g dangerouslySetInnerHTML={{ __html: sp.svg }} />
      {sp.pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={sp.r} fill={done.has(i) ? "#ffd23f" : "#fff"} stroke={INK} strokeWidth={sp.r * 0.12} />)}</svg>
  );
}

function DaysRing({ sp, done, onTap, mini }) {
  const D = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  return (
    <svg viewBox="0 0 1000 1000" className="h-full w-full">
      <circle cx="500" cy="500" r="440" fill={sp.color} stroke={INK} strokeWidth="14" />
      {D.map((d, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 7, x = 500 + 300 * Math.cos(a), y = 500 + 300 * Math.sin(a), on = done.has(i);
        return <g key={d} onPointerDown={onTap ? (e) => onTap(i, e) : undefined} style={{ cursor: onTap ? "pointer" : "default" }}>
          <circle cx={x} cy={y} r="108" fill={on ? "#3ddc97" : "#fff"} stroke={INK} strokeWidth="10" />
          {!mini && <text x={x} y={y + 18} textAnchor="middle" fontFamily="Fredoka,Inter" fontWeight="700" fontSize="54" fill={INK}>{on ? "✓" : d}</text>}</g>; })}
      {!mini && <text x="500" y="525" textAnchor="middle" fontFamily="Fredoka,Inter" fontWeight="700" fontSize="70" fill={INK}>$0</text>}
    </svg>
  );
}

function Home({ s, open, onEnableTilt, tilt }) {
  const unl = unlockedCount(s.xp), saved = totalSaved(s), questDone = s.questDay === new Date().toISOString().slice(0, 10);
  const current = SPRINTS.slice(0, unl).find((sp) => !s.completed[sp.id] && (s.filled[sp.id] || []).length) || SPRINTS.slice(0, unl).find((sp) => !s.completed[sp.id]) || SPRINTS[0];
  return (
    <div className="flex flex-col gap-4 px-4 pb-10 pt-2">
      <div className="rounded-[26px] border-[3px] border-ink bg-sun p-5 text-ink shadow-[5px_5px_0_#000]">
        <div className="text-[12px] font-bold uppercase tracking-[.16em]">Total saved</div>
        <div className="font-display text-5xl font-bold tabular-nums"><Count value={saved} prefix="$" /></div>
        <div className="mt-2 text-sm font-semibold">{Object.keys(s.completed).length} sprints finished · {Object.keys(s.badges).length}/{Object.keys(BADGES).length} badges</div>
      </div>
      <div className={cx("flex items-center gap-3 rounded-2xl border-[3px] border-ink p-4 text-ink", questDone ? "bg-mint" : "bg-white")}>
        <span className="text-2xl">{questDone ? "✅" : "🎯"}</span>
        <div className="flex-1"><div className="font-display font-bold">Daily quest</div><div className="text-sm">{questDone ? "Done! +25 XP banked. Come back tomorrow." : "Color 1 bubble today · +25 XP"}</div></div>
      </div>
      {!tilt && <button onClick={onEnableTilt} className="flex items-center gap-3 rounded-2xl border-[3px] border-dashed border-white/40 p-3 text-left text-white"><Smartphone className="size-6 text-sky" /><span className="text-sm"><b>Turn on tilt confetti.</b> Celebrations fall toward the side you tip your phone.</span></button>}
      <button onClick={() => open(current.id)} className="flex items-center gap-4 rounded-[26px] border-[3px] border-ink bg-pink p-4 text-left text-ink shadow-[5px_5px_0_#000] active:translate-y-0.5">
        <div className="size-20 shrink-0"><MiniArt sp={current} s={s} /></div>
        <div className="min-w-0 flex-1"><div className="text-[12px] font-bold uppercase tracking-[.14em]">Continue</div><div className="truncate font-display text-2xl font-bold">{current.name}</div><div className="text-sm font-semibold">{money(savedIn(s, current))} / {money(current.goal)} · {pctOf(s, current)}%</div></div>
      </button>
      <h2 className="mt-2 font-display text-2xl font-bold text-white">Your sprints</h2>
      <div className="grid grid-cols-2 gap-3">
        {SPRINTS.map((sp, i) => {
          const locked = i >= unl, pct = pctOf(s, sp), done = !!s.completed[sp.id];
          return (
            <motion.button key={sp.id} whileTap={locked ? { x: [0, -6, 6, -4, 0] } : { scale: 0.96 }} onClick={() => locked ? (haptic("tap"), sfx.undo()) : open(sp.id)}
              className={cx("relative flex flex-col items-start gap-2 overflow-hidden rounded-[22px] border-[3px] border-ink p-3 text-left text-ink", locked ? "bg-white/15" : "bg-white")}>
              {done && <span className="absolute right-2 top-2 rounded-full bg-mint px-2 py-0.5 text-[11px] font-bold">DONE</span>}
              <div className={cx("aspect-square w-full", locked && "opacity-25 grayscale")}><MiniArt sp={sp} s={s} /></div>
              <div className={cx("w-full", locked && "text-white")}>
                <div className="truncate font-display text-[16px] font-bold">{sp.name}</div>
                {locked ? <div className="flex items-center gap-1 text-[12px] font-semibold text-white/80"><Lock className="size-3" />Unlocks at Lv {i - 1}</div>
                  : <><div className="text-[12px] font-semibold">{sp.goal ? money(sp.goal) : "No money"} · {sp.days.replace(" sprint", "")}</div>
                    <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full border-2 border-ink bg-white"><div className="h-full" style={{ width: pct + "%", background: sp.color }} /></div></>}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function Floaters({ items }) {
  return <div className="pointer-events-none fixed inset-0 z-40">
    <AnimatePresence>{items.map((f) => (
      <motion.div key={f.id} initial={{ opacity: 0, y: 0, scale: 0.6 }} animate={{ opacity: 1, y: -70, scale: 1 }} exit={{ opacity: 0, y: -110 }} transition={{ duration: 0.7, ease: "easeOut" }}
        className="absolute -translate-x-1/2 whitespace-nowrap font-display text-2xl font-bold" style={{ left: f.x, top: f.y, color: f.color, textShadow: `0 3px 0 ${INK}, 0 -2px 0 ${INK}, 2px 0 0 ${INK}, -2px 0 0 ${INK}` }}>{f.text}</motion.div>))}
    </AnimatePresence></div>;
}

function Sprint({ s, sp, onTap, back }) {
  const done = new Set(s.filled[sp.id] || []), saved = savedIn(s, sp), pct = pctOf(s, sp), mi = mysteryIndex(sp);
  const combo = Date.now() - s.comboAt < 8000 ? s.combo : 0;
  return (
    <div className="flex flex-col gap-3 px-4 pb-10 pt-2">
      <div className="flex items-center gap-3">
        <button onClick={back} aria-label="Back" className="grid size-10 place-items-center rounded-full border-[3px] border-ink bg-white text-ink"><ArrowLeft className="size-5" /></button>
        <div className="min-w-0 flex-1"><div className="truncate font-display text-3xl font-bold text-white">{sp.name}</div><div className="text-[13px] font-semibold text-white/70">{sp.days} · {sp.tag}</div></div>
      </div>
      <div className="rounded-[22px] border-[3px] border-ink bg-white p-4 text-ink">
        <div className="flex items-end justify-between">
          <div className="font-display text-4xl font-bold tabular-nums">{sp.kind === "days" ? <>{done.size}<span className="text-lg"> / 7 days</span></> : <><Count value={saved} prefix="$" /><span className="text-lg text-ink/50"> / {money(sp.goal)}</span></>}</div>
          <AnimatePresence>{combo >= 2 && <motion.div key={combo} initial={{ scale: 1.6, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: -6, opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border-[3px] border-ink bg-tang px-2.5 py-1 font-display text-lg font-bold">COMBO x{combo}</motion.div>}</AnimatePresence>
        </div>
        <div className="relative mt-3 h-5 overflow-hidden rounded-full border-[3px] border-ink bg-[#f3eee6]">
          <motion.div className="relative h-full overflow-hidden" style={{ background: sp.color }} animate={{ width: pct + "%" }} transition={{ type: "spring", stiffness: 160, damping: 22 }}>
            <div className="absolute inset-y-0 w-1/3 animate-[shine_2.4s_linear_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" /></motion.div>
          {[25, 50, 75].map((m) => <div key={m} className="absolute inset-y-0 w-[3px] bg-ink/60" style={{ left: m + "%" }} />)}
        </div>
        <div className="mt-1 flex justify-between text-[11px] font-bold text-ink/60"><span>25%</span><span>50%</span><span>75%</span><span>🏁</span></div>
      </div>
      <div className="relative mx-auto w-full max-w-[420px]">
        {sp.kind === "days" ? <DaysRing sp={sp} done={done} onTap={(i, e) => onTap(sp, i, e)} /> : (
          <svg viewBox="0 0 1000 1000" className="w-full touch-manipulation select-none">
            <g dangerouslySetInnerHTML={{ __html: sp.svg }} />
            {sp.pts.map(([x, y], i) => {
              const on = done.has(i), myst = i === mi && !on;
              return (
                <motion.g key={i} onPointerDown={(e) => onTap(sp, i, e)} style={{ cursor: "pointer", transformOrigin: `${x}px ${y}px`, transformBox: "view-box" }}
                  animate={on ? { scale: [1.35, 0.9, 1] } : { scale: 1 }} transition={{ duration: 0.35 }}>
                  <circle cx={x} cy={y} r={sp.r * 1.05} fill={on ? "#ffd23f" : myst ? "#7b61ff" : "#fff"} stroke={INK} strokeWidth={sp.r * 0.13} />
                  <text x={x} y={y + sp.r * 0.33} textAnchor="middle" fontFamily="Fredoka,Inter" fontWeight="700" fontSize={sp.r * (myst ? 1.0 : 0.85)} fill={myst ? "#fff" : INK}>{myst ? "?" : sp.amounts[i]}</text>
                </motion.g>
              );
            })}
          </svg>)}
      </div>
      <p className="text-center text-sm text-white/75">{sp.kind === "days" ? "Tap a day each time you buy nothing extra." : "Saved that amount? Tap the bubble. Purple “?” bubbles hide bonus XP."}</p>
    </div>
  );
}

function Badges({ s, close }) {
  return <Sheet title="Badges" close={close}>
    <div className="grid grid-cols-3 gap-3">{Object.entries(BADGES).map(([k, b]) => { const got = !!s.badges[k];
      return <div key={k} className={cx("flex flex-col items-center gap-1 rounded-2xl border-[3px] border-ink p-3 text-center", got ? "bg-sun" : "bg-white/10 text-white")}>
        <div className={cx("text-3xl", !got && "opacity-30 grayscale")}>{b.icon}</div><div className="font-display text-[13px] font-bold leading-tight">{b.name}</div><div className="text-[10.5px] leading-tight opacity-80">{b.desc}</div></div>; })}</div>
  </Sheet>;
}

function SettingsSheet({ close, prefs, setPrefs, onEnableTilt, tilt, reset }) {
  const Row = ({ icon: I, label, on, flip }) => <button onClick={flip} className="flex w-full items-center gap-3 rounded-2xl border-[3px] border-ink bg-white p-3 text-ink"><I className="size-5" /><span className="flex-1 text-left font-semibold">{label}</span><span className={cx("h-7 w-12 rounded-full border-[3px] border-ink p-0.5 transition", on ? "bg-mint" : "bg-[#ddd]")}><span className={cx("block size-5 rounded-full border-2 border-ink bg-white transition", on && "translate-x-5")} /></span></button>;
  return <Sheet title="Settings" close={close}>
    <div className="flex flex-col gap-2">
      <Row icon={prefs.sound ? Volume2 : VolumeX} label="Sound effects" on={prefs.sound} flip={() => setPrefs({ ...prefs, sound: !prefs.sound })} />
      <Row icon={Vibrate} label="Haptics (vibration)" on={prefs.haptics} flip={() => setPrefs({ ...prefs, haptics: !prefs.haptics })} />
      <Row icon={Smartphone} label="Tilt confetti (motion)" on={tilt} flip={onEnableTilt} />
      <p className="px-1 text-xs text-white/60">Haptics work on Android. iPhone Safari doesn't allow web vibration on every version; the app tries a system tick where it can. Tilt needs one tap to allow motion on iPhone.</p>
      <button onClick={reset} className="mt-3 rounded-2xl border-[3px] border-ink bg-white/10 p-3 font-semibold text-white">Reset all progress</button>
    </div>
  </Sheet>;
}

function Sheet({ title, close, children }) {
  return <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
    <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="max-h-[85vh] w-full max-w-[460px] overflow-y-auto rounded-t-[30px] border-[3px] border-b-0 border-ink bg-[#2a2440] p-5" style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
      <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl font-bold text-white">{title}</h2><button onClick={close} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-white/10 text-white"><X className="size-4" /></button></div>
      {children}</motion.div></motion.div>;
}

function Celebration({ c, close }) {
  return <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
    <motion.div initial={{ scale: 0.4, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}
      className="w-full max-w-[360px] rounded-[30px] border-[3px] border-ink bg-sun p-7 text-center text-ink shadow-[8px_8px_0_#000]">
      <div className="text-6xl">{c.icon}</div>
      <div className="mt-2 font-display text-[13px] font-bold uppercase tracking-[.2em]">{c.kicker}</div>
      <div className="font-display text-4xl font-bold leading-tight">{c.title}</div>
      <p className="mt-2 font-semibold">{c.body}</p>
      <button onClick={close} className="mt-5 w-full rounded-full border-[3px] border-ink bg-pink py-3 font-display text-xl font-bold shadow-[4px_4px_0_#1f1b2e]">Keep going</button>
    </motion.div></motion.div>;
}

function Onboarding({ done, onEnableTilt }) {
  const [i, setI] = useState(0);
  const cards = [
    { icon: "🫧", t: "Sprints, not marathons", b: "Pick a 7, 14 or 30-day goal. Short enough to finish before boredom wins." },
    { icon: "⚡", t: "Save, then tap", b: "Saved a bubble's amount? Tap it. Chain taps for combos, hit milestones, level up." },
    { icon: "📱", t: "Tilt for confetti", b: "Big wins rain confetti from the top of your screen. Tip your phone and it slides that way." },
  ];
  const c = cards[i];
  return <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-ink p-8 text-center text-white">
    <motion.div key={i} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-7xl">{c.icon}</motion.div>
    <div><h1 className="font-display text-4xl font-bold">{c.t}</h1><p className="mx-auto mt-3 max-w-[30ch] text-lg text-white/80">{c.b}</p></div>
    <div className="flex gap-2">{cards.map((_, k) => <span key={k} className={cx("h-2.5 rounded-full transition-all", k === i ? "w-8 bg-sun" : "w-2.5 bg-white/30")} />)}</div>
    {i < 2 ? <button onClick={() => { setI(i + 1); haptic("tap"); sfx.pop(i + 1); }} className="w-full max-w-[320px] rounded-full border-[3px] border-ink bg-sun py-4 font-display text-xl font-bold text-ink shadow-[4px_4px_0_#000]">Next</button>
      : <div className="flex w-full max-w-[320px] flex-col gap-2">
        <button onClick={async () => { await onEnableTilt(); confetti(120); sfx.win(); haptic("win"); done(); }} className="rounded-full border-[3px] border-ink bg-sun py-4 font-display text-xl font-bold text-ink shadow-[4px_4px_0_#000]">Allow motion & start</button>
        <button onClick={done} className="py-2 text-sm font-semibold text-white/70">Start without motion</button></div>}
  </div>;
}

function App() {
  const [s, setS] = useState(load);
  const [view, setView] = useState({ name: "home" });
  const [floaters, setFloaters] = useState([]);
  const [celebs, setCelebs] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [tilt, setTilt] = useState(false);
  const [prefs, setPrefsState] = useState(() => { try { return JSON.parse(localStorage.getItem("ss-prefs")) || { sound: true, haptics: true }; } catch (e) { return { sound: true, haptics: true }; } });
  const [onboard, setOnboard] = useState(() => { try { return !localStorage.getItem("ss-onboarded"); } catch (e) { return true; } });
  const canvasRef = useRef(null), rootRef = useRef(null), fid = useRef(0);
  useEffect(() => { mountCanvas(canvasRef.current); const m = (e) => pointerTilt(e); window.addEventListener("pointermove", m); return () => window.removeEventListener("pointermove", m); }, []);
  useEffect(() => { save(s); }, [s]);
  useEffect(() => { Object.assign(settings, prefs); try { localStorage.setItem("ss-prefs", JSON.stringify(prefs)); } catch (e) {} }, [prefs]);
  const enableTiltNow = async () => { const ok = await enableTilt(); setTilt(ok); if (ok) { haptic("milestone"); sfx.unlock(); } return ok; };
  const float = (x, y, text, color) => { const id = ++fid.current; setFloaters((f) => [...f, { id, x, y, text, color }]); setTimeout(() => setFloaters((f) => f.filter((z) => z.id !== id)), 750); };
  // toast queue: at most 2 on screen, each ~1.6s, so wins read one at a time instead of piling up
  const toast = (t) => { const id = ++fid.current; setToasts((q) => [...q, { id, ...t }]); };
  useEffect(() => {
    if (!toasts.length || celebs.length) return;
    const tm = setTimeout(() => setToasts((q) => q.slice(1)), 1600);
    return () => clearTimeout(tm);
  }, [toasts, celebs.length]);

  const onTap = useCallback((sp, i, e) => {
    const x = e.clientX, y = e.clientY;
    setS((prev) => {
      const { state, events } = toggle(prev, sp, i);
      queueMicrotask(() => {
        let delay = 0;
        for (const ev of events) {
          if (ev.t === "undo") { sfx.undo(); haptic("tap"); float(x, y, "undo", "#ffffff"); }
          if (ev.t === "pop") { sfx.pop(ev.combo); haptic(ev.combo >= 3 ? "combo" : "pop"); burst(x, y, sp.color, 18 + ev.combo * 2); float(x, y - 10, `+${ev.gain} XP${ev.mult > 1 ? ` x${ev.mult}` : ""}`, ev.mult > 1 ? "#ff8c42" : "#ffd23f"); }
          if (ev.t === "quest") setTimeout(() => { sfx.coin(); toast({ icon: "🎯", text: "Daily quest done · +25 XP" }); }, (delay += 250));
          if (ev.t === "streak") setTimeout(() => toast({ icon: "🔥", text: `${ev.n}-day streak!` }), (delay += 250));
          if (ev.t === "freeze") setTimeout(() => toast({ icon: "❄️", text: "Streak freeze used. Your streak is safe." }), (delay += 250));
          if (ev.t === "loot") setTimeout(() => { sfx.coin(); haptic("combo"); burst(x, y, "#7b61ff", 40); float(x, y - 50, "LOOT! +50 XP", "#7b61ff"); }, 120);
          if (ev.t === "milestone") setTimeout(() => { sfx.milestone(); haptic("milestone"); confetti(60); toast({ icon: "🎉", text: `${ev.m}% there! +25 XP` }); }, (delay += 300));
          if (ev.t === "badge") setTimeout(() => { sfx.unlock(); toast({ icon: ev.icon, text: `Badge: ${ev.name}` }); }, (delay += 400));
          if (ev.t === "unlock") setTimeout(() => toast({ icon: "🔓", text: `Unlocked: ${ev.sp}` }), (delay += 400));
          if (ev.t === "complete") setTimeout(() => { sfx.win(); haptic("win"); confetti(220); shake(rootRef.current, 10); setCelebs((c) => [...c, { icon: "🏁", kicker: "Sprint complete", title: sp.name, body: sp.kind === "days" ? "A whole week of buying nothing extra." : `You saved ${money(sp.goal)}. +100 XP` }]); }, (delay += 500));
          if (ev.t === "level") setTimeout(() => { sfx.level(); haptic("level"); confetti(180); shake(rootRef.current, 12); setCelebs((c) => [...c, { icon: "⭐", kicker: `Level ${ev.lvl}`, title: ev.title, body: "New sprint unlocked on your home screen." }]); }, (delay += 600));
        }
      });
      return state;
    });
  }, []);

  const sp = view.name === "sprint" ? SPRINTS.find((z) => z.id === view.id) : null;
  return (
    <div ref={rootRef} className="mx-auto min-h-full max-w-[460px] bg-ink">
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[60]" />
      <TopBar s={s} onBadges={() => setSheet("badges")} onSettings={() => setSheet("settings")} />
      <AnimatePresence mode="wait">
        <motion.div key={view.name + (view.id || "")} initial={{ opacity: 0, x: view.name === "sprint" ? 40 : -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {sp ? <Sprint s={s} sp={sp} onTap={onTap} back={() => setView({ name: "home" })} />
            : <Home s={s} tilt={tilt} onEnableTilt={enableTiltNow} open={(id) => { haptic("tap"); setView({ name: "sprint", id }); }} />}
        </motion.div>
      </AnimatePresence>
      <Floaters items={floaters} />
      <div className="pointer-events-none fixed inset-x-0 z-[55] flex flex-col items-center gap-2 px-4" style={{ top: "calc(env(safe-area-inset-top,0px) + 76px)" }}>
        <AnimatePresence>{(celebs.length ? [] : toasts.slice(0, 2)).map((t) => <motion.div key={t.id} initial={{ y: -30, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }}
          className="flex items-center gap-2 rounded-full border-[3px] border-ink bg-white px-4 py-2 font-display font-bold text-ink shadow-[3px_3px_0_#000]"><span>{t.icon}</span>{t.text}</motion.div>)}</AnimatePresence>
      </div>
      <AnimatePresence>
        {sheet === "badges" && <Badges s={s} close={() => setSheet(null)} />}
        {sheet === "settings" && <SettingsSheet close={() => setSheet(null)} prefs={prefs} setPrefs={setPrefsState} tilt={tilt} onEnableTilt={enableTiltNow} reset={() => { setS(fresh()); setSheet(null); }} />}
        {celebs[0] && <Celebration key="c" c={celebs[0]} close={() => setCelebs((c) => c.slice(1))} />}
      </AnimatePresence>
      {onboard && <Onboarding onEnableTilt={enableTiltNow} done={() => { setOnboard(false); try { localStorage.setItem("ss-onboarded", "1"); } catch (e) {} }} />}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
