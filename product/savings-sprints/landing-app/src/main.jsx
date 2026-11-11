import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, useMotionValue, useSpring, useTransform, useScroll, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Plus, Minus, ArrowUpRight, X as XIcon, Zap, Gift, Snowflake, Trophy, Printer, Table2, Smartphone, RotateCcw } from "lucide-react";
import { haptic, sfx, mountCanvas, burst, confetti, pointerTilt, enableTilt, settings } from "../../app/src/juice.js";
import cover from "./p01.jpg";
import p04 from "./p04.jpg";
import p05 from "./p05.jpg";
import p07 from "./p07.jpg";
import p08 from "./p08.jpg";
import p09 from "./p09.jpg";
import p11 from "./p11.jpg";
import p13 from "./p13.jpg";
import p15 from "./p15.jpg";

const PRICE = 9, WAS = 14;
const cx = (...c) => c.filter(Boolean).join(" ");

function BuyButton({ className, children, big }) {
  const [clicked, setClicked] = useState(false);
  return (
    <button type="button" onClick={(e) => { setClicked(true); haptic("tap"); sfx.coin(); burst(e.clientX, e.clientY, "#ffd23f", 20); }}
      className={cx("group inline-flex items-center justify-center gap-2 rounded-full border-[3px] border-ink bg-sun font-display font-bold text-ink shadow-[4px_4px_0_#1f1b2e] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1f1b2e] active:translate-y-0.5 active:shadow-[2px_2px_0_#1f1b2e] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pink",
        big ? "w-full px-8 py-5 text-xl" : "px-7 py-4 text-lg", className)}>
      {clicked ? "Checkout opens after approval" : children}
      {!clicked && <ArrowUpRight className="size-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
    </button>
  );
}

/* ---------- HERO · adapted from 21st.dev "Credit Card Hero" by ruixen.ui ----------
   Changes: the tilting card is now a phone playing a real recording of the app; floating chips are game rewards. */
function Phone({ className }) {
  return (
    <div className={cx("relative rounded-[46px] border-[3px] border-ink bg-ink p-3 shadow-[10px_10px_0_#ff5fa2]", className)}>
      <div className="absolute left-1/2 top-4 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
      <video src="appdemo.mp4" autoPlay muted loop playsInline className="block aspect-[9/16] w-full rounded-[34px] bg-ink object-cover" aria-label="Recording of the Savings Sprints app: tapping bubbles, combo, loot, level up and confetti" />
    </div>
  );
}
function Chip({ children, className, delay }) {
  const reduce = useReducedMotion();
  return <motion.div animate={reduce ? {} : { y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
    className={cx("absolute z-20 rounded-2xl border-[3px] border-ink px-3 py-2 font-display text-base font-bold text-ink shadow-[4px_4px_0_#1f1b2e]", className)}>{children}</motion.div>;
}
function Hero() {
  const mx = useMotionValue(300), my = useMotionValue(300);
  const rotateX = useSpring(useTransform(my, [0, 600], [8, -8]), { stiffness: 260, damping: 22 });
  const rotateY = useSpring(useTransform(mx, [0, 500], [-10, 10]), { stiffness: 260, damping: 22 });
  return (
    <header className="gutter overflow-hidden bg-ink pb-20 pt-12 text-white sm:pb-28 sm:pt-16">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col items-start gap-6">
          <span className="rounded-full bg-sun px-4 py-1.5 font-display text-sm font-bold text-ink">UNPOPULAR OPINION</span>
          <h1 className="font-display text-[clamp(44px,8vw,86px)] font-bold leading-[.95]">
            Savings challenges are{" "}
            <motion.span initial={{ scale: 2.2, rotate: -14, opacity: 0 }} animate={{ scale: 1, rotate: -6, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 14, delay: 0.5 }}
              className="inline-block rounded-2xl border-[6px] border-[#ee3448] px-3 text-[#ee3448]">rigged</motion.span>{" "}
            against ADHD brains.
          </h1>
          <p className="max-w-[44ch] text-lg leading-relaxed text-[#e6e0f7] sm:text-xl">52 weeks with zero reward until the end? Of course you quit by week three. So we turned saving into a game: short sprints, combos, hidden loot, levels, and a streak that forgives a bad day.</p>
          <div className="flex flex-wrap items-center gap-4">
            <BuyButton>Get Savings Sprints · ${PRICE}</BuyButton>
            <a href="#play" className="font-display text-lg font-bold text-sun underline decoration-[3px] underline-offset-4">Play a sprint first ↓</a>
          </div>
          <p className="text-sm text-[#bdb6d3]"><s>${WAS}</s> launch price · app + 12 printable sprints + spreadsheet</p>
        </div>
        <div className="relative mx-auto w-[min(78vw,330px)]" style={{ perspective: 1100 }}
          onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set(e.clientX - r.left); my.set(e.clientY - r.top); }} onMouseLeave={() => { mx.set(165); my.set(300); }}>
          <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}><Phone /></motion.div>
          <Chip className="-left-10 top-16 bg-tang" delay={0}>COMBO x5</Chip>
          <Chip className="-right-8 top-40 bg-grape text-white" delay={0.8}>LOOT! +50 XP</Chip>
          <Chip className="-left-6 bottom-24 bg-mint" delay={1.6}>Level 3 ⭐</Chip>
          <Chip className="-right-6 bottom-8 bg-sky" delay={2.2}>🔥 4-day streak</Chip>
        </div>
      </div>
    </header>
  );
}

/* ---------- WHY · the controversial claim, backed by the mechanism ---------- */
function Why() {
  const rows = [["Reward", "Week 52. Maybe.", "Every single bubble"], ["Length", "A whole year", "7, 14 or 30 days"], ["Bad week", "Streak dies, you quit", "Streak freeze saves it"], ["Feels like", "Homework", "A game you want to open"]];
  return (
    <section className="gutter py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <p className="font-display text-sm font-bold uppercase tracking-[.2em] text-pink">Why they're rigged</p>
        <h2 className="mt-3 max-w-3xl font-display text-[clamp(34px,5vw,56px)] font-bold leading-[1.02]">They're built for brains that run on willpower. Yours runs on reward.</h2>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-y-3 text-left">
            <thead><tr className="font-display text-lg"><th className="w-1/4" /><th className="px-4 text-soft">52-week challenge</th><th className="px-4 text-pink">Savings Sprints</th></tr></thead>
            <tbody>{rows.map(([k, a, b]) => (
              <tr key={k}><td className="font-display text-lg font-bold">{k}</td>
                <td className="chunky rounded-l-2xl bg-panel px-4 py-4"><span className="flex items-center gap-2 text-soft"><XIcon className="size-5 shrink-0 text-[#ee3448]" />{a}</span></td>
                <td className="chunky rounded-r-2xl bg-sun px-4 py-4 font-semibold text-ink"><span className="flex items-center gap-2"><Check className="size-5 shrink-0" strokeWidth={3} />{b}</span></td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ---------- PLAY · a real, juicy demo sprint (same engine as the app) ---------- */
const DEMO = [5, 10, 5, 15, 5, 10, 20, 5, 10, 15, 5, 10, 5, 20, 10, 5, 15, 10, 5, 15]; // $200
const LOOT = 13;
function Play() {
  const [on, setOn] = useState(() => new Set());
  const [xp, setXp] = useState(0); const [combo, setCombo] = useState(0); const last = useRef(0);
  const [floaters, setFloaters] = useState([]); const fid = useRef(0); const [done, setDone] = useState(false);
  const saved = DEMO.reduce((a, v, i) => a + (on.has(i) ? v : 0), 0), pct = Math.round((saved / 200) * 100);
  const float = (x, y, text, color) => { const id = ++fid.current; setFloaters((f) => [...f, { id, x, y, text, color }]); setTimeout(() => setFloaters((f) => f.filter((z) => z.id !== id)), 750); };
  const tap = (i, e) => {
    const x = e.clientX, y = e.clientY;
    if (on.has(i)) { const n = new Set(on); n.delete(i); setOn(n); sfx.undo(); haptic("tap"); return; }
    const now = Date.now(); const c = now - last.current < 8000 ? combo + 1 : 1; last.current = now; setCombo(c);
    const mult = Math.min(3, 1 + Math.floor((c - 1) / 3) * 0.5); let gain = Math.round(10 * mult);
    const n = new Set(on); n.add(i); setOn(n);
    sfx.pop(c); haptic(c >= 3 ? "combo" : "pop"); burst(x, y, "#ff5fa2", 18 + c * 2); float(x, y - 10, `+${gain} XP${mult > 1 ? ` x${mult}` : ""}`, mult > 1 ? "#ff8c42" : "#ffd23f");
    if (i === LOOT) { gain += 50; setTimeout(() => { sfx.coin(); burst(x, y, "#7b61ff", 40); float(x, y - 50, "LOOT! +50 XP", "#7b61ff"); }, 120); }
    const before = Math.round((DEMO.reduce((a, v, k) => a + (on.has(k) ? v : 0), 0) / 200) * 100), after = Math.round(((saved + DEMO[i]) / 200) * 100);
    for (const m of [25, 50, 75]) if (before < m && after >= m) setTimeout(() => { sfx.milestone(); confetti(50); }, 200);
    if (after >= 100) setTimeout(() => { sfx.win(); haptic("win"); confetti(220); setDone(true); }, 350);
    setXp((v) => v + gain);
  };
  return (
    <section id="play" className="gutter bg-ink py-20 text-white sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[.2em] text-sun">Play one now</p>
          <h2 className="mt-3 font-display text-[clamp(34px,5vw,56px)] font-bold leading-[1.02]">Pop a bubble. Feel that? That's the whole trick.</h2>
          <p className="mt-4 max-w-[44ch] text-lg text-[#e6e0f7]">This is a pretend $200 sprint. Tap bubbles fast to chain combos. One purple bubble hides loot. Fill it to see what finishing feels like.</p>
          <p className="mt-3 text-sm text-[#bdb6d3]">Sound on for the full effect. On an Android phone you'll feel it too.</p>
        </div>
        <div className="chunky relative rounded-[30px] bg-panel p-5 text-fg">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div><div className="font-display text-sm font-bold uppercase tracking-[.14em] text-soft">Mystery Sprint · $200</div><div className="font-display text-5xl font-bold tabular-nums">${saved}</div></div>
            <div className="flex items-center gap-2">
              <AnimatePresence>{combo >= 2 && Date.now() - last.current < 8000 && <motion.div key={combo} initial={{ scale: 1.6, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: -6, opacity: 1 }} className="rounded-xl border-[3px] border-ink bg-tang px-2.5 py-1 font-display text-lg font-bold text-ink">x{combo}</motion.div>}</AnimatePresence>
              <div className="rounded-xl border-[3px] border-ink bg-sun px-2.5 py-1 font-display text-lg font-bold tabular-nums text-ink">{xp} XP</div>
              <button type="button" onClick={() => { setOn(new Set()); setXp(0); setCombo(0); setDone(false); }} aria-label="Reset demo" className="grid size-10 place-items-center rounded-full border-[3px] border-ink bg-white text-ink"><RotateCcw className="size-4" /></button>
            </div>
          </div>
          <div className="mb-4 h-5 overflow-hidden rounded-full border-[3px] border-ink bg-white"><motion.div className="h-full bg-pink" animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 200, damping: 24 }} /></div>
          <div className="grid grid-cols-5 gap-2.5">
            {DEMO.map((v, i) => { const isOn = on.has(i), loot = i === LOOT && !isOn;
              return <motion.button key={i} type="button" onPointerDown={(e) => tap(i, e)} whileTap={{ scale: 0.82 }} aria-pressed={isOn} aria-label={loot ? "Mystery bubble" : `Bubble $${v}`}
                animate={{ scale: isOn ? [1.25, 0.92, 1] : 1 }} transition={{ duration: 0.3 }}
                className={cx("aspect-square touch-manipulation rounded-full border-[3px] border-ink font-display text-lg font-bold tabular-nums", isOn ? "bg-sun text-ink" : loot ? "bg-grape text-white" : "bg-white text-ink")}>{loot ? "?" : v}</motion.button>; })}
          </div>
          <AnimatePresence>{done && <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 16 }}
            className="absolute inset-0 grid place-items-center rounded-[27px] bg-sun/95 p-6 text-center text-ink">
            <div><div className="text-5xl">🏁</div><div className="mt-1 font-display text-3xl font-bold">Sprint complete!</div><p className="mt-1 font-semibold">{xp} XP on a pretend $200. Now imagine it's real money.</p><BuyButton className="mt-4">Get the real ones · ${PRICE}</BuyButton></div>
          </motion.div>}</AnimatePresence>
        </div>
      </div>
      <div className="pointer-events-none fixed inset-0 z-40"><AnimatePresence>{floaters.map((f) => (
        <motion.div key={f.id} initial={{ opacity: 0, y: 0, scale: 0.6 }} animate={{ opacity: 1, y: -70, scale: 1 }} exit={{ opacity: 0, y: -110 }} transition={{ duration: 0.7 }}
          className="absolute -translate-x-1/2 whitespace-nowrap font-display text-2xl font-bold" style={{ left: f.x, top: f.y, color: f.color, textShadow: "0 3px 0 #1f1b2e, 0 -2px 0 #1f1b2e, 2px 0 0 #1f1b2e, -2px 0 0 #1f1b2e" }}>{f.text}</motion.div>))}</AnimatePresence></div>
    </section>
  );
}

/* ---------- INSIDE · adapted from 21st.dev "Marketing Feature Bento" by isaiahbjork ---------- */
function Card({ title, desc, className, children, bg = "bg-panel" }) {
  return <article className={cx("chunky flex min-w-0 flex-col overflow-hidden rounded-[26px]", bg, className)}>
    <div className="flex min-h-[190px] flex-1 items-center justify-center px-5 pt-6">{children}</div>
    <div className="px-6 pb-6 pt-5"><h3 className={cx("font-display text-xl font-bold", bg !== "bg-panel" && "text-ink")}>{title}</h3><p className={cx("mt-1.5 max-w-[48ch] text-[14.5px] leading-6", bg === "bg-panel" ? "text-soft" : "text-ink/80")}>{desc}</p></div></article>;
}
function Inside() {
  const badges = [["🫧", "First Pop"], ["⚡", "Combo x3"], ["🔥", "On Fire"], ["💪", "Comeback Kid"], ["🎁", "Lucky Find"], ["🏁", "Finisher"], ["💵", "$100 Club"], ["🏆", "Four Figures"]];
  return (
    <section id="inside" className="gutter py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-display text-sm font-bold uppercase tracking-[.2em] text-pink">What you get</p>
        <h2 className="mt-3 max-w-3xl font-display text-[clamp(34px,5vw,56px)] font-bold leading-[1.02]">A game app, 12 sprints, and trackers you can print.</h2>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card className="lg:col-span-3" bg="bg-tang" title="Combos and multipliers" desc="Save a few in a row and your XP multiplies. The pop sound climbs with every combo.">
            <div className="flex items-end gap-2">{[["x1", "h-12"], ["x1.5", "h-20"], ["x2", "h-28"], ["x3", "h-36"]].map(([m, h]) => <div key={m} className={cx("chunky grid w-16 place-items-end rounded-xl bg-white pb-2 font-display text-lg font-bold text-ink", h)}>{m}</div>)}</div>
          </Card>
          <Card className="lg:col-span-3" bg="bg-grape" title="Hidden loot" desc="Every sprint hides a mystery bubble worth bonus XP. You never know which one until you save it.">
            <div className="flex gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className={cx("chunky grid size-16 place-items-center rounded-full font-display text-2xl font-bold", i === 2 ? "bg-sun text-ink" : "bg-white text-ink")}>{i === 2 ? <Gift className="size-7" /> : "?"}</div>)}</div>
          </Card>
          <Card className="lg:col-span-2" bg="bg-sky" title="A streak that forgives" desc="Miss a day? A weekly streak freeze saves it, and coming back earns a badge, not shame.">
            <div className="flex items-center gap-3 font-display text-4xl font-bold text-ink">🔥 4 <Snowflake className="size-9" /></div>
          </Card>
          <Card className="lg:col-span-4" title="12 badges to collect" desc="From First Pop to Four Figures. Levels unlock new sprints as you go.">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{badges.map(([e, n], i) => <div key={n} className={cx("chunky flex flex-col items-center gap-1 rounded-2xl p-2 text-center", i < 5 ? "bg-sun text-ink" : "bg-panel2 opacity-60")}><span className="text-2xl">{e}</span><span className="font-display text-[11px] font-bold leading-tight">{n}</span></div>)}</div>
          </Card>
          <Card className="md:col-span-2 lg:col-span-6" bg="bg-mint" title="Works on any phone. Prints too." desc="Open the app link and tap Add to Home Screen: no app store, iPhone or Android. Plus Letter + A6 cash-binder PDFs and a spreadsheet where bubbles turn color.">
            <div className="flex flex-wrap items-center justify-center gap-3">{[[Smartphone, "Phone app"], [Printer, "Printables"], [Table2, "Spreadsheet"]].map(([I, l]) => <div key={l} className="chunky flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-display text-lg font-bold text-ink"><I className="size-6" />{l}</div>)}</div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Peek() {
  const pages = [p04, p05, p07, p08, p09, p11, p13, p15];
  return <div className="gutter pb-16"><div className="mx-auto max-w-6xl"><p className="mb-4 font-display text-lg font-bold">The 12 printable trackers</p>
    <div className="flex gap-4 overflow-x-auto pb-5" aria-label="Printable tracker pages">{pages.map((p, i) => <img key={i} src={p} alt={`Tracker page ${i + 1}`} className="chunky w-40 shrink-0 rounded-xl sm:w-48" style={{ transform: `rotate(${i % 2 ? 2 : -2}deg)` }} />)}</div></div></div>;
}

/* ---------- PRICE · adapted from 21st.dev "Lifetime Deal Pricing Card" by diarmuradi (no fake social proof) ---------- */
function Price() {
  const items = ["Savings Sprints game app (iPhone + Android)", "12 sprints, $0 to $1,000", "Combos, loot, levels, 12 badges", "Forgiving streak with weekly freeze", "Letter + A6 printable trackers", "Spreadsheet with color-fill bubbles"];
  return (
    <section id="price" className="gutter bg-panel2 py-20 sm:py-28">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
        <span className="rounded-full border-[3px] border-ink bg-mint px-4 py-1 font-display text-sm font-bold text-ink">Launch price</span>
        <h2 className="font-display text-[clamp(34px,5vw,56px)] font-bold leading-[1.02]">Less than the boba you'll skip in week one.</h2>
        <div className="chunky w-full max-w-3xl rounded-[34px] bg-panel p-7 text-left sm:p-9">
          <div className="grid gap-8 sm:grid-cols-[200px_1fr]">
            <img src={cover} alt="Savings Sprints printable cover" className="mx-auto w-40 -rotate-3 rounded-xl border-[3px] border-ink sm:w-full" />
            <div className="flex flex-col gap-5">
              <div className="flex items-end gap-3"><span className="font-display text-7xl font-bold leading-none tabular-nums">${PRICE}</span><span className="pb-2 text-2xl text-soft line-through tabular-nums">${WAS}</span></div>
              <p className="text-sm text-soft">One-time payment · instant access · personal use</p>
              <BuyButton big>Get Savings Sprints</BuyButton>
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">{items.map((f) => <li key={f} className="flex items-start gap-2.5 text-[14.5px]"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink bg-sun"><Check className="size-3 text-ink" strokeWidth={3} /></span>{f}</li>)}</ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ · adapted from 21st.dev "Animated Line Accordion" by shadcnspace ---------- */
const FAQS = [
  ["Is it in the App Store?", "No store needed. It's a web app: open the link, tap Share then Add to Home Screen, and it sits on your phone like any app. Works on iPhone and Android, and your progress stays on your phone."],
  ["Do I feel it vibrate?", "On Android, yes: taps, combos and level-ups all have their own buzz. iPhone Safari limits web vibration, so on iPhone you get the sounds, confetti and animations, and a light tick where iOS allows it."],
  ["What if the amounts are too big?", "Save half of each bubble and still tap it. There's also a No-Spend Week that needs no money at all."],
  ["Isn't 'rigged' a bit much?", "A little. Long challenges work for some people. But a reward that only arrives after 52 weeks is a bad deal for a brain that runs on quick feedback, and that's who this is for."],
  ["Is this financial advice?", "No. It's a motivational tool for saving money. It isn't financial, medical or ADHD-treatment advice. Never skip essentials to finish a sprint."],
];
function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="gutter py-20 sm:py-28">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div><p className="font-display text-sm font-bold uppercase tracking-[.2em] text-pink">Questions</p><h2 className="mt-3 font-display text-[clamp(34px,5vw,52px)] font-bold leading-[1.02]">Before you buy</h2></div>
        <div className="flex flex-col gap-2">{FAQS.map(([q, a], i) => { const isOpen = open === i;
          return <div key={q} className={cx("rounded-2xl transition-colors", isOpen ? "chunky bg-panel" : "hover:bg-panel/60")}>
            <button type="button" id={`faq-${i}`} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)} className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left font-display text-lg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink">{q}{isOpen ? <Minus className="size-5 shrink-0" /> : <Plus className="size-5 shrink-0" />}</button>
            <AnimatePresence initial={false}>{isOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden"><p className="px-5 pb-5 text-[15px] leading-7 text-soft">{a}</p></motion.div>}</AnimatePresence></div>; })}</div>
      </div>
    </section>
  );
}

function Final() {
  return <section className="gutter pb-20"><div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-[40px] border-[3px] border-ink bg-pink px-6 py-16 text-center text-ink shadow-[10px_10px_0_#1f1b2e]">
    <h2 className="max-w-2xl font-display text-[clamp(32px,5vw,54px)] font-bold leading-[1.02]">Stop doing year-long challenges. Start a 7-day sprint.</h2>
    <BuyButton>Get Savings Sprints · ${PRICE}</BuyButton></div></section>;
}

function App() {
  const cv = useRef(null);
  useEffect(() => { mountCanvas(cv.current); const m = (e) => pointerTilt(e); window.addEventListener("pointermove", m); return () => window.removeEventListener("pointermove", m); }, []);
  return (
    <>
      <canvas ref={cv} className="pointer-events-none fixed inset-0 z-[60]" />
      <div className="bg-sun px-4 py-2 text-center text-[13px] font-bold text-ink">DRAFT FOR APPROVAL · not live · checkout not connected yet</div>
      <Hero /><Why /><Play /><Inside /><Peek /><Price /><Faq /><Final />
      <footer className="gutter pb-12"><p className="mx-auto max-w-4xl text-center text-[13px] leading-6 text-soft">Savings Sprints is a motivational tool for saving money. It is not financial, tax, legal or medical advice and does not diagnose or treat ADHD. Personal-use licence. © 2026 Savings Sprints.<br />UI patterns adapted from 21st.dev components by ruixen.ui, isaiahbjork, diarmuradi and shadcnspace.</p></footer>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
