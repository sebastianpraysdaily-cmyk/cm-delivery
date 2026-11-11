import React, { useEffect, useRef, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from "framer-motion";
import { ArrowLeft, Lock, Flame, Snowflake, Trophy, Settings, Volume2, VolumeX, Smartphone, Vibrate, Sparkles, X } from "lucide-react";
import { SPRINTS, LEVELS, BADGES, xpFor, levelOf, load, save, fresh, toggle, unlockedCount, savedIn, totalSaved, pctOf, mysteryIndex } from "./game.js";
import { haptic, sfx, settings, enableTilt, pointerTilt, mountCanvas, burst, confetti, shake, coins, shockwave, flames, tilt, onShake } from "./juice.js";

const INK = "#1f1b2e";
const cx = (...c) => c.filter(Boolean).join(" ");
const money = (n) => "$" + n.toLocaleString("en-US");
const fillFor = (sp) => (sp.color.toLowerCase() === "#ffd23f" ? "#ff5fa2" : "#ffd23f"); // filled bubbles must contrast with the shape

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
      {sp.pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={sp.r} fill={done.has(i) ? fillFor(sp) : "#fff"} stroke={INK} strokeWidth={sp.r * 0.12} />)}</svg>
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

function useTiltMV() {
  const tx = useMotionValue(0), ty = useMotionValue(0);
  useEffect(() => { let r; const f = () => { tx.set(tx.get() + (tilt.x - tx.get()) * 0.12); ty.set(ty.get() + (tilt.y - ty.get()) * 0.12); r = requestAnimationFrame(f); }; r = requestAnimationFrame(f); return () => cancelAnimationFrame(r); }, []);
  return [tx, ty];
}

// Holographic foil: the card leans and a rainbow sheen slides across it as the phone tilts
function HoloCard({ children, className, strength = 1 }) {
  const [tx, ty] = useTiltMV();
  const rotateY = useTransform(tx, (v) => v * 14 * strength), rotateX = useTransform(ty, (v) => v * -10 * strength);
  const bgPos = useTransform(tx, (v) => `${50 + v * 45}% ${50}%`);
  return (
    <div style={{ perspective: 900 }} className={className}>
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="relative h-full w-full">
        {children}
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ backgroundImage: "linear-gradient(115deg, transparent 18%, rgba(255,255,255,.65) 38%, rgba(255,95,162,.45) 46%, rgba(76,201,240,.45) 54%, rgba(61,220,151,.4) 60%, transparent 78%)", backgroundSize: "250% 250%", backgroundPosition: bgPos, mixBlendMode: "overlay", borderRadius: "inherit" }} />
      </motion.div>
    </div>
  );
}

function Sprint({ s, sp, onTap, back, bump }) {
  const done = new Set(s.filled[sp.id] || []), saved = savedIn(s, sp), pct = pctOf(s, sp), mi = mysteryIndex(sp);
  const combo = Date.now() - s.comboAt < 8000 ? s.combo : 0;
  const [tx, ty] = useTiltMV();
  const rotY = useTransform(tx, (v) => v * 9), rotX = useTransform(ty, (v) => v * -7);
  const backX = useTransform(tx, (v) => v * -18), frontX = useTransform(tx, (v) => v * 12), frontY = useTransform(ty, (v) => v * 8);
  // Mystery Sprint: shake the phone (or press Roll) and a slot-machine highlight picks your next bubble
  const [hot, setHot] = useState(-1), [pick, setPick] = useState(-1), rolling = useRef(false);
  const roll = useCallback(() => {
    if (rolling.current) return; const free = sp.pts.map((_, i) => i).filter((i) => !(s.filled[sp.id] || []).includes(i)); if (!free.length) return;
    rolling.current = true; setPick(-1); let n = 0; const steps = 14 + Math.floor(Math.random() * 6);
    const hop = () => { const i = free[Math.floor(Math.random() * free.length)]; setHot(i); sfx.tick(); haptic("tap"); n++;
      if (n < steps) setTimeout(hop, 50 + n * n * 1.6); else { setPick(i); setHot(-1); rolling.current = false; sfx.milestone(); haptic("combo"); } };
    hop();
  }, [s, sp]);
  useEffect(() => sp.id === "s07" ? onShake(roll) : undefined, [roll, sp.id]);
  return (
    <div className="flex flex-col gap-3 px-4 pb-10 pt-2">
      <div className="flex items-center gap-3">
        <button onClick={back} aria-label="Back" className="grid size-10 place-items-center rounded-full border-[3px] border-ink bg-white text-ink"><ArrowLeft className="size-5" /></button>
        <div className="min-w-0 flex-1"><div className="truncate font-display text-3xl font-bold text-white">{sp.name}</div><div className="text-[13px] font-semibold text-white/70">{sp.days} · {sp.tag}</div></div>
      </div>
      <div className="rounded-[22px] border-[3px] border-ink bg-white p-4 text-ink">
        <div className="flex items-end justify-between">
          <motion.div key={bump} id="saved-target" initial={{ scale: bump ? 1.18 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 12 }} className="origin-left font-display text-4xl font-bold tabular-nums">{sp.kind === "days" ? <>{done.size}<span className="text-lg"> / 7 days</span></> : <><Count value={saved} prefix="$" /><span className="text-lg text-ink/50"> / {money(sp.goal)}</span></>}</motion.div>
          <AnimatePresence>{combo >= 2 && <motion.div key={combo} initial={{ scale: 1.6, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: -6, opacity: 1 }} exit={{ opacity: 0 }} className={cx("rounded-xl border-[3px] border-ink px-2.5 py-1 font-display text-lg font-bold", combo >= 5 ? "bg-[#ee3448] text-white" : "bg-tang")}>COMBO x{combo}</motion.div>}</AnimatePresence>
        </div>
        <div className="relative mt-3 h-5 overflow-hidden rounded-full border-[3px] border-ink bg-[#f3eee6]">
          <motion.div className="relative h-full overflow-hidden" style={{ background: sp.color }} animate={{ width: pct + "%" }} transition={{ type: "spring", stiffness: 160, damping: 22 }}>
            <div className="absolute inset-y-0 w-1/3 animate-[shine_2.4s_linear_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" /></motion.div>
          {[25, 50, 75].map((m) => <div key={m} className="absolute inset-y-0 w-[3px] bg-ink/60" style={{ left: m + "%" }} />)}
        </div>
        <div className="mt-1 flex justify-between text-[11px] font-bold text-ink/60"><span>25%</span><span>50%</span><span>75%</span><span>🏁</span></div>
      </div>
      <div className="relative mx-auto w-full max-w-[420px]" style={{ perspective: 900 }}>
        {sp.kind === "days" ? <DaysRing sp={sp} done={done} onTap={(i, e) => onTap(sp, i, e)} /> : (
          <motion.svg viewBox="0 0 1000 1000" className="w-full touch-manipulation select-none overflow-visible" style={{ rotateX: rotX, rotateY: rotY }}>
            <motion.g style={{ x: backX }} dangerouslySetInnerHTML={{ __html: sp.svg }} />
            <motion.g style={{ x: frontX, y: frontY }}>
            {sp.pts.map(([x, y], i) => {
              const on = done.has(i), myst = i === mi && !on, isHot = hot === i, isPick = pick === i && !on;
              return (
                <motion.g key={i} onPointerDown={(e) => { if (isPick) setPick(-1); onTap(sp, i, e); }} style={{ cursor: "pointer", transformOrigin: `${x}px ${y}px`, transformBox: "view-box" }}
                  animate={on ? { scale: [1.35, 0.9, 1] } : isHot ? { scale: 1.22 } : isPick ? { scale: [1, 1.2, 1] } : { scale: 1 }} transition={isPick ? { duration: 0.8, repeat: Infinity } : { duration: isHot ? 0.08 : 0.35 }}>
                  
                  <circle className={!on ? "breathe" : ""} style={{ animationDelay: `${(i % 7) * 0.31}s` }} cx={x} cy={y} r={sp.r * 1.05} fill={on ? fillFor(sp) : isHot || isPick ? INK : myst ? "#7b61ff" : "#fff"} stroke={isPick ? "#ff5fa2" : INK} strokeWidth={sp.r * (isPick ? 0.3 : 0.13)} />
                  <text x={x} y={y + sp.r * 0.33} textAnchor="middle" fontFamily="Fredoka,Inter" fontWeight="700" fontSize={sp.r * (myst ? 1.0 : 0.85)} fill={myst || isHot || isPick ? "#fff" : INK} style={{ pointerEvents: "none" }}>{myst && !isHot && !isPick ? "?" : sp.amounts[i]}</text>
                </motion.g>
              );
            })}
            </motion.g>
          </motion.svg>)}
      </div>
      {sp.id === "s07" && <button onClick={roll} className="mx-auto flex items-center gap-2 rounded-full border-[3px] border-ink bg-sun px-5 py-3 font-display text-lg font-bold text-ink shadow-[4px_4px_0_#000] active:translate-y-0.5">🎲 Roll my next bubble <span className="text-sm font-semibold opacity-70">or shake your phone</span></button>}
      <p className="text-center text-sm text-white/75">{sp.kind === "days" ? "Tap a day each time you buy nothing extra." : "Saved that amount? Tap the bubble. Purple “?” bubbles hide loot."}</p>
    </div>
  );
}

function Badges({ s, close }) {
  return <Sheet title="Badges" close={close}>
    <p className="mb-3 text-xs text-white/60">Tilt your phone: earned badges are holographic.</p>
    <div className="grid grid-cols-3 gap-3">{Object.entries(BADGES).map(([k, b]) => { const got = !!s.badges[k];
      const card = <div className={cx("flex h-full flex-col items-center gap-1 rounded-2xl border-[3px] border-ink p-3 text-center", got ? "bg-sun text-ink" : "bg-white/10 text-white")}>
        <div className={cx("text-3xl", !got && "opacity-30 grayscale")}>{b.icon}</div><div className="font-display text-[13px] font-bold leading-tight">{b.name}</div><div className="text-[10.5px] leading-tight opacity-80">{b.desc}</div></div>;
      return got ? <HoloCard key={k} className="rounded-2xl" strength={0.8}>{card}</HoloCard> : <div key={k}>{card}</div>; })}</div>
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
  if (c.type === "loot") return <LootReveal c={c} close={close} />;
  return <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
    <motion.div initial={{ scale: 0.4, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} className="w-full max-w-[360px]">
      <HoloCard className="rounded-[30px]">
        <div className="rounded-[30px] border-[3px] border-ink bg-sun p-7 text-center text-ink shadow-[8px_8px_0_#000]">
          <div className="text-6xl">{c.icon}</div>
          <div className="mt-2 font-display text-[13px] font-bold uppercase tracking-[.2em]">{c.kicker}</div>
          <div className="font-display text-4xl font-bold leading-tight">{c.title}</div>
          <p className="mt-2 font-semibold">{c.body}</p>
          <button onClick={close} className="mt-5 w-full rounded-full border-[3px] border-ink bg-pink py-3 font-display text-xl font-bold shadow-[4px_4px_0_#1f1b2e]">Keep going</button>
        </div>
      </HoloCard>
    </motion.div></motion.div>;
}

// Loot: a gift shakes harder and harder, bursts open behind spinning light rays, then reveals the reward
const REWARD_IDEAS = ["20 minutes of guilt-free scrolling", "Your favourite snack, already in the cupboard", "A long shower with the good playlist", "One episode, zero guilt", "A walk to somewhere you like", "Tell someone you're winning at money"];
function LootReveal({ c, close }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setOpen(true); sfx.win(); haptic("level"); confetti(120); shockwave(window.innerWidth / 2, window.innerHeight * 0.42, "#7b61ff", 1.3); }, 1100); return () => clearTimeout(t); }, []);
  const idea = useRef(REWARD_IDEAS[Math.floor(Math.random() * REWARD_IDEAS.length)]).current;
  return <motion.div className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-black/70 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => open && close()}>
    <motion.div aria-hidden className="absolute left-1/2 top-[42%] size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "repeating-conic-gradient(from 0deg, rgba(255,210,63,.35) 0deg 10deg, transparent 10deg 24deg)" }}
      initial={{ scale: 0, opacity: 0 }} animate={open ? { scale: 1, opacity: 1, rotate: 360 } : { scale: 0.3, opacity: 0.3, rotate: 90 }} transition={open ? { rotate: { duration: 12, repeat: Infinity, ease: "linear" }, scale: { type: "spring", stiffness: 120, damping: 14 } } : { duration: 1 }} />
    <div className="relative flex flex-col items-center text-center">
      <AnimatePresence mode="wait">
        {!open ? <motion.div key="box" className="text-[120px] leading-none" animate={{ rotate: [0, -8, 8, -12, 12, -16, 16, -20, 20, 0], scale: [1, 1, 1.05, 1.05, 1.1, 1.1, 1.15, 1.15, 1.2, 1.25] }} transition={{ duration: 1.1 }} exit={{ scale: 2.2, opacity: 0, transition: { duration: 0.2 } }}>🎁</motion.div>
          : <motion.div key="reward" initial={{ scale: 0.3, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 320, damping: 14 }} className="w-full max-w-[340px]">
            <HoloCard className="rounded-[28px]"><div className="rounded-[28px] border-[3px] border-ink bg-grape p-6 text-white shadow-[8px_8px_0_#000]">
              <div className="font-display text-[13px] font-bold uppercase tracking-[.2em] text-sun">Loot found</div>
              <div className="font-display text-5xl font-bold">+50 XP</div>
              <p className="mt-3 text-sm font-semibold text-white/85">Reward idea for later:</p>
              <p className="font-display text-xl font-bold">{idea}</p>
              <button onClick={close} className="mt-5 w-full rounded-full border-[3px] border-ink bg-sun py-3 font-display text-xl font-bold text-ink shadow-[4px_4px_0_#1f1b2e]">Claim</button>
            </div></HoloCard></motion.div>}
      </AnimatePresence>
    </div></motion.div>;
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
  const [bump, setBump] = useState(0), [heat, setHeat] = useState(0), [onFire, setOnFire] = useState(0), [flash, setFlash] = useState(0);
  useEffect(() => { if (!heat) return; const t = setTimeout(() => setHeat(0), 8000); return () => clearTimeout(t); }, [heat]);  // combo window closes -> glow fades
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
          if (ev.t === "pop") {
            sfx.pop(ev.combo); haptic(ev.combo >= 3 ? "combo" : "pop"); burst(x, y, sp.color, 18 + ev.combo * 2);
            float(x, y - 10, `+${ev.gain} XP${ev.mult > 1 ? ` x${ev.mult}` : ""}`, ev.mult > 1 ? "#ff8c42" : "#ffd23f");
            coins(x, y, document.getElementById("saved-target"), Math.min(8, 2 + ev.combo), () => { setBump((b) => b + 1); sfx.tick(); });
            setHeat(Math.min(1, (ev.combo - 1) / 9));
            if (ev.combo >= 5) flames(4 + ev.combo * 2);
            if (ev.combo === 10) setTimeout(() => { setOnFire((n) => n + 1); sfx.level(); haptic("level"); shockwave(window.innerWidth / 2, window.innerHeight / 2, "#ff8c42", 1.4); flames(60); }, 150);
          }
          if (ev.t === "quest") setTimeout(() => { sfx.coin(); toast({ icon: "🎯", text: "Daily quest done · +25 XP" }); }, (delay += 250));
          if (ev.t === "streak") setTimeout(() => toast({ icon: "🔥", text: `${ev.n}-day streak!` }), (delay += 250));
          if (ev.t === "freeze") setTimeout(() => toast({ icon: "❄️", text: "Streak freeze used. Your streak is safe." }), (delay += 250));
          if (ev.t === "loot") { setTimeout(() => { sfx.coin(); haptic("combo"); burst(x, y, "#7b61ff", 40); }, 120); setTimeout(() => setCelebs((c) => [{ type: "loot" }, ...c]), 450); }
          if (ev.t === "milestone") setTimeout(() => { sfx.milestone(); haptic("milestone"); confetti(60); toast({ icon: "🎉", text: `${ev.m}% there! +25 XP` }); }, (delay += 300));
          if (ev.t === "badge") setTimeout(() => { sfx.unlock(); toast({ icon: ev.icon, text: `Badge: ${ev.name}` }); }, (delay += 400));
          if (ev.t === "unlock") setTimeout(() => toast({ icon: "🔓", text: `Unlocked: ${ev.sp}` }), (delay += 400));
          if (ev.t === "complete") setTimeout(() => { sfx.win(); haptic("win"); confetti(220); shake(rootRef.current, 10); setCelebs((c) => [...c, { icon: "🏁", kicker: "Sprint complete", title: sp.name, body: sp.kind === "days" ? "A whole week of buying nothing extra." : `You saved ${money(sp.goal)}. +100 XP` }]); }, (delay += 500));
          if (ev.t === "level") setTimeout(() => { sfx.level(); haptic("level"); confetti(180); shake(rootRef.current, 12); setFlash((f) => f + 1); shockwave(window.innerWidth / 2, window.innerHeight / 2, "#ffd23f", 1.6); setCelebs((c) => [...c, { icon: "⭐", kicker: `Level ${ev.lvl}`, title: ev.title, body: "New sprint unlocked on your home screen." }]); }, (delay += 600));
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
          {sp ? <Sprint s={s} sp={sp} onTap={onTap} bump={bump} back={() => setView({ name: "home" })} />
            : <Home s={s} tilt={tilt} onEnableTilt={enableTiltNow} open={(id) => { haptic("tap"); setView({ name: "sprint", id }); }} />}
        </motion.div>
      </AnimatePresence>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[45] transition-[box-shadow] duration-500" style={{ boxShadow: heat ? `inset 0 0 ${40 + heat * 90}px ${heat * 26}px rgba(255,${Math.round(140 - heat * 90)},66,${0.25 + heat * 0.45})` : "none" }} />
      <AnimatePresence>{onFire > 0 && <motion.div key={onFire} className="pointer-events-none fixed inset-0 z-[58] grid place-items-center" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 1.1, duration: 0.4 }} onAnimationComplete={() => setOnFire(0)}>
        <motion.div initial={{ scale: 3, rotate: -20 }} animate={{ scale: 1, rotate: -8 }} transition={{ type: "spring", stiffness: 400, damping: 12 }} className="rounded-3xl border-[4px] border-ink bg-[#ee3448] px-6 py-3 font-display text-5xl font-bold text-white shadow-[6px_6px_0_#000]">ON FIRE 🔥</motion.div></motion.div>}</AnimatePresence>
      <AnimatePresence>{flash > 0 && <motion.div key={flash} className="pointer-events-none fixed inset-0 z-[59] bg-white" initial={{ opacity: 0.85 }} animate={{ opacity: 0 }} transition={{ duration: 0.45 }} />}</AnimatePresence>
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
