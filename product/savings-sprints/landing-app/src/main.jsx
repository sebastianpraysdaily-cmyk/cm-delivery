import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, useMotionValue, useSpring, useTransform, useScroll, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Plus, Minus, ArrowUpRight, Printer, Tablet, Table2, RotateCcw } from "lucide-react";
import cover from "./p01.jpg";
import p04 from "./p04.jpg";
import p05 from "./p05.jpg";
import p07 from "./p07.jpg";
import p08 from "./p08.jpg";
import p09 from "./p09.jpg";
import p11 from "./p11.jpg";
import p13 from "./p13.jpg";
import p15 from "./p15.jpg";
import t04 from "./t04.jpg";
import t05 from "./t05.jpg";
import t08 from "./t08.jpg";
import t15 from "./t15.jpg";

const PRICE = 9, WAS = 14;
const cx = (...c) => c.filter(Boolean).join(" ");

function BuyButton({ className, children, big }) {
  const [clicked, setClicked] = useState(false);
  return (
    <button type="button" onClick={() => setClicked(true)}
      className={cx("group inline-flex items-center justify-center gap-2 rounded-full border-[3px] border-ink bg-sun font-display font-bold text-ink shadow-[4px_4px_0_#1f1b2e] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1f1b2e] active:translate-y-0.5 active:shadow-[2px_2px_0_#1f1b2e] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pink",
        big ? "w-full px-8 py-5 text-xl" : "px-7 py-4 text-lg", className)}>
      {clicked ? "Checkout opens after approval" : children}
      {!clicked && <ArrowUpRight className="size-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
    </button>
  );
}

/* ---------- 1. HERO · adapted from 21st.dev "Credit Card Hero" by ruixen.ui ----------
   Changes: the floating credit cards became real tracker pages from the product; tilt on pointer, float on touch. */
function Floater({ src, alt, className, style, delay = 0, rot = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.img src={src} alt={alt} style={{ ...style, rotate: rot }}
      animate={reduce ? {} : { y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
      className={cx("absolute z-10 rounded-2xl border-[3px] border-ink bg-white shadow-[6px_6px_0_#1f1b2e]", className)} />
  );
}

function Hero() {
  const mx = useMotionValue(450), my = useMotionValue(230);
  const rotateX = useSpring(useTransform(my, [0, 460], [6, -6]), { stiffness: 300, damping: 22 });
  const rotateY = useSpring(useTransform(mx, [0, 900], [-6, 6]), { stiffness: 300, damping: 22 });
  const onMove = ({ clientX, clientY, currentTarget }) => { const r = currentTarget.getBoundingClientRect(); mx.set(clientX - r.left); my.set(clientY - r.top); };
  return (
    <header className="gutter overflow-hidden pb-28 pt-10 sm:pb-36 sm:pt-16" style={{ perspective: 1200 }}>
      <motion.div onMouseMove={onMove} onMouseLeave={() => { mx.set(450); my.set(230); }} style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative mx-auto flex max-w-4xl flex-col items-center rounded-[40px] border-[3px] border-ink bg-ink px-6 pb-40 pt-14 text-center text-white shadow-[10px_10px_0_#ff5fa2] sm:px-12 sm:pb-28 sm:pt-20">
        <div className="relative z-20 flex max-w-2xl flex-col items-center gap-5">
          <div className="flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-sun px-4 py-1.5 font-display text-sm font-bold text-ink">12 color-in money challenges</span>
            <span className="rounded-full bg-mint px-4 py-1.5 font-display text-sm font-bold text-ink">made for ADHD brains</span>
          </div>
          <h1 className="font-display text-[clamp(52px,12vw,104px)] font-bold leading-[.92] tracking-[-0.02em]">Savings<br />Sprints</h1>
          <p className="max-w-[34ch] text-lg leading-relaxed text-[#e6e0f7] sm:text-xl">52-week challenges are a marathon. Your brain wants a sprint. Pick a 7, 14 or 30-day goal, save, and color a bubble. Watch it fill up.</p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-4">
            <BuyButton>Get all 12 for ${PRICE}</BuyButton>
            <span className="text-sm text-[#cfc8e6]"><s>${WAS}</s> launch price</span>
          </div>
        </div>
        <Floater src={t05} alt="Boba Fund tracker" rot={-8} delay={0} style={{ transform: "translateZ(60px)" }} className="-bottom-16 -left-6 w-40 sm:-bottom-20 sm:-left-20 sm:w-56" />
        <Floater src={t08} alt="Level Up tracker" rot={7} delay={1.2} style={{ transform: "translateZ(50px)" }} className="-bottom-20 -right-6 w-40 sm:-right-16 sm:bottom-10 sm:w-56" />
        <Floater src={t04} alt="Weekend Warm-Up tracker" rot={-6} delay={0.6} style={{ transform: "translateZ(40px)" }} className="-left-24 top-10 hidden w-44 lg:block" />
        <Floater src={t15} alt="Emergency Starter tracker" rot={8} delay={1.8} style={{ transform: "translateZ(45px)" }} className="-right-24 -top-8 hidden w-44 lg:block" />
      </motion.div>
    </header>
  );
}

/* ---------- 2. FEATURES · adapted from 21st.dev "Marketing Feature Bento" by isaiahbjork ----------
   Changes: each card carries a small working visual; the main one is a live tracker you can color in. */
function Section({ eyebrow, title, desc, children, id, tint }) {
  return (
    <section id={id} className={cx("gutter py-20 sm:py-28", tint && "bg-panel2")}>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[.2em] text-pink">{eyebrow}</p>
            <h2 className="mt-3 font-display text-[clamp(34px,5vw,56px)] font-bold leading-[1.02]">{title}</h2>
          </div>
          {desc && <p className="max-w-[46ch] text-[17px] leading-7 text-soft">{desc}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

function BentoCard({ title, desc, className, children, bg = "bg-panel" }) {
  return (
    <article className={cx("chunky flex min-w-0 flex-col overflow-hidden rounded-[26px]", bg, className)}>
      <div className="flex min-h-[220px] flex-1 items-center justify-center px-5 pt-6">{children}</div>
      <div className="px-6 pb-6 pt-5">
        <h3 className={cx("font-display text-xl font-bold", bg !== "bg-panel" && "text-ink")}>{title}</h3>
        <p className={cx("mt-1.5 max-w-[48ch] text-[14.5px] leading-6", bg === "bg-panel" ? "text-soft" : "text-ink/80")}>{desc}</p>
      </div>
    </article>
  );
}

const LIVE = [5, 10, 5, 15, 5, 10, 20, 5, 10, 15, 5, 10, 5, 20, 10, 5, 15, 10, 5, 15]; // sums to 200
function LiveTracker() {
  const [on, setOn] = useState(() => new Set([0, 3, 6]));
  const saved = LIVE.reduce((a, v, i) => a + (on.has(i) ? v : 0), 0);
  const pct = Math.round((saved / 200) * 100);
  const toggle = (i) => setOn((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  return (
    <div className="w-full max-w-[460px]">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div><div className="font-display text-sm font-bold uppercase tracking-[.14em] text-soft">Mystery Sprint · $200</div>
          <div className="font-display text-5xl font-bold tabular-nums">${saved}<span className="text-xl text-soft"> saved</span></div></div>
        <button type="button" onClick={() => setOn(new Set())} aria-label="Reset tracker" className="grid size-10 place-items-center rounded-full border-[3px] border-ink bg-white text-ink"><RotateCcw className="size-4" /></button>
      </div>
      <div className="mb-4 h-5 overflow-hidden rounded-full border-[3px] border-ink bg-white"><motion.div className="h-full bg-pink" animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 200, damping: 24 }} /></div>
      <div className="grid grid-cols-5 gap-2.5">
        {LIVE.map((v, i) => (
          <motion.button key={i} type="button" onClick={() => toggle(i)} whileTap={{ scale: 0.85 }} aria-pressed={on.has(i)} aria-label={`Bubble $${v}`}
            animate={{ scale: on.has(i) ? [1.18, 1] : 1 }} transition={{ duration: 0.25 }}
            className={cx("aspect-square rounded-full border-[3px] border-ink font-display text-lg font-bold tabular-nums text-ink", on.has(i) ? "bg-sun" : "bg-white")}>{v}</motion.button>
        ))}
      </div>
      <p className="mt-3 text-center font-display text-base font-bold">{pct >= 100 ? "Sprint complete! 🎉" : `${pct}% · tap a bubble`}</p>
    </div>
  );
}

function Features() {
  return (
    <Section id="inside" eyebrow="What's inside" title="Short goals. Big colors. Bubbles that add up exactly."
      desc="Every tracker is a picture that fills up as you save. It's the 'watch it fill' feeling that makes savings challenges work, in sprints short enough to actually finish.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
        <BentoCard className="lg:col-span-4 lg:row-span-2" title="Try one right now" desc="Tap a bubble when you've saved that amount. The total and the bar update. That small hit is the whole point.">
          <LiveTracker />
        </BentoCard>
        <BentoCard className="lg:col-span-2" bg="bg-pink" title="7, 14 or 30 days" desc="Short enough to finish before boredom hits. No 52-week marathons.">
          <div className="flex gap-2">{[["7", "bg-white"], ["14", "bg-sun"], ["30", "bg-mint"]].map(([n, b]) => <div key={n} className={cx("chunky grid h-24 w-20 place-items-center rounded-2xl font-display text-4xl font-bold text-ink", b)}>{n}</div>)}</div>
        </BentoCard>
        <BentoCard className="lg:col-span-2" bg="bg-mint" title="Rewards at 25, 50, 75, 100%" desc="Pick tiny rewards before you start, so the middle of a sprint still feels good.">
          <div className="grid w-full max-w-[260px] grid-cols-4 gap-1.5">{["25%", "50%", "75%", "100%"].map((x, i) => <div key={x} className={cx("rounded-xl border-[3px] border-dashed border-ink py-3 text-center font-display text-sm font-bold text-ink", i < 2 && "bg-white")}>{x}</div>)}</div>
        </BentoCard>
        <BentoCard className="md:col-span-2 lg:col-span-6" bg="bg-sky" title="Print it, use it on an iPad, or in the spreadsheet" desc="Letter-size and A6 cash-binder PDFs, GoodNotes-friendly pages, and a spreadsheet where bubbles turn color when you tick them.">
          <div className="flex flex-wrap items-center justify-center gap-4">{[[Printer, "Print"], [Tablet, "iPad"], [Table2, "Sheets"]].map(([I, l]) => <div key={l} className="chunky flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-display text-lg font-bold text-ink"><I className="size-6" />{l}</div>)}</div>
        </BentoCard>
      </div>
    </Section>
  );
}

function Peek() {
  const pages = [p04, p05, p07, p08, p09, p11, p13, p15];
  return (
    <div className="gutter pb-10">
      <div className="mx-auto flex max-w-6xl gap-4 overflow-x-auto pb-5" aria-label="Tracker pages">
        {pages.map((p, i) => <img key={i} src={p} alt={`Tracker page ${i + 1}`} className="chunky w-44 shrink-0 rounded-xl sm:w-52" style={{ transform: `rotate(${i % 2 ? 2 : -2}deg)` }} />)}
      </div>
    </div>
  );
}

/* ---------- 3. HOW IT WORKS · adapted from 21st.dev "Stacking Cards" by Khoa Phan (danielpetho) ---------- */
const STEPS = [
  { n: "Step 1", t: "Pick one sprint", d: "Start with the $50 Weekend Warm-Up if you've never finished a challenge. Winning the first one matters more than the amount.", img: p04, bg: "bg-mint" },
  { n: "Step 2", t: "Save any bubble's amount", d: "Move it to savings, drop cash in an envelope, or skip a purchase that costs about that much. Order doesn't matter.", img: p05, bg: "bg-pink" },
  { n: "Step 3", t: "Color it in", d: "Right away. Watching it fill up is the reward your brain is looking for.", img: p11, bg: "bg-sun" },
  { n: "Step 4", t: "Finish, then pick the next", d: "Missed a few days? Keep going. A sprint doesn't reset when life happens.", img: p15, bg: "bg-sky" },
];
function StackCard({ s, i, total, progress }) {
  const scale = useTransform(progress, [i / total, 1], [1, 1 - (total - i) * 0.04]);
  return (
    <div className="sticky top-0 flex h-[70vh] min-h-[440px] items-start justify-center pt-[10vh]">
      <motion.div style={{ scale, top: `${i * 18}px` }} className={cx("chunky relative grid w-full max-w-4xl origin-top gap-6 overflow-hidden rounded-[32px] p-7 text-ink sm:grid-cols-[1.1fr_1fr] sm:p-10", s.bg)}>
        <div className="flex flex-col justify-center">
          <div className="font-display text-sm font-bold uppercase tracking-[.18em]">{s.n}</div>
          <h3 className="mt-3 font-display text-[clamp(30px,4vw,46px)] font-bold leading-[1.02]">{s.t}</h3>
          <p className="mt-3 max-w-[40ch] text-[16px] leading-7">{s.d}</p>
        </div>
        <img src={s.img} alt="" className="hidden max-h-[300px] w-auto justify-self-center rounded-xl border-[3px] border-ink sm:block" />
      </motion.div>
    </div>
  );
}
function How() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <section className="gutter bg-panel2 pt-20 sm:pt-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-display text-sm font-bold uppercase tracking-[.2em] text-pink">How it works</p>
        <h2 className="mt-3 max-w-3xl font-display text-[clamp(34px,5vw,56px)] font-bold leading-[1.02]">Four steps. No spreadsheet skills. No willpower marathon.</h2>
      </div>
      <div ref={ref} className="relative mx-auto max-w-6xl pb-[12vh]">
        {STEPS.map((s, i) => <StackCard key={s.n} s={s} i={i} total={STEPS.length} progress={scrollYProgress} />)}
      </div>
    </section>
  );
}

/* ---------- 4. PRICE · adapted from 21st.dev "Lifetime Deal Pricing Card" by diarmuradi ----------
   Changes: no customer avatars or sales count (we have no customers yet); refund line left out until policy is decided. */
const SPRINTS = [["Weekend Warm-Up", "$50"], ["Boba Fund", "$100"], ["No-Spend Week", "$0"], ["Payday to Payday", "$250"], ["Level Up", "$300"], ["Holiday Gift Fund", "$300"], ["Mystery Sprint", "$200"], ["Grow It", "$500"], ["Guilt-Free Haul", "$150"], ["Mixtape", "$400"], ["Moving Out", "$1,000"], ["Emergency Starter", "$1,000"]];
function Price() {
  return (
    <section id="price" className="gutter py-20 sm:py-28">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
        <span className="rounded-full border-[3px] border-ink bg-mint px-4 py-1 font-display text-sm font-bold text-ink">Launch price</span>
        <h2 className="font-display text-[clamp(34px,5vw,56px)] font-bold leading-[1.02]">All 12 sprints. One price.</h2>
        <p className="max-w-xl text-lg text-soft">Finish all twelve and you've saved $4,250, one short sprint at a time.</p>
        <div className="chunky w-full max-w-3xl rounded-[34px] bg-panel p-7 text-left sm:p-9">
          <div className="grid gap-8 sm:grid-cols-[220px_1fr]">
            <img src={cover} alt="Savings Sprints cover" className="mx-auto w-44 -rotate-3 rounded-xl border-[3px] border-ink sm:w-full" />
            <div className="flex flex-col gap-5">
              <div className="flex items-end gap-3"><span className="font-display text-7xl font-bold leading-none tabular-nums">${PRICE}</span><span className="pb-2 text-2xl text-soft line-through tabular-nums">${WAS}</span></div>
              <p className="text-sm text-soft">One-time payment · instant download · personal use</p>
              <BuyButton big>Get Savings Sprints</BuyButton>
              <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                {SPRINTS.map(([n, g]) => <li key={n} className="flex items-center gap-2.5 text-[14.5px]"><span className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink bg-sun"><Check className="size-3 text-ink" strokeWidth={3} /></span><span className="min-w-0 flex-1">{n}</span><span className="font-semibold tabular-nums text-soft">{g}</span></li>)}
              </ul>
              <p className="text-sm text-soft">Plus: Letter + A6 cash-binder PDFs, spreadsheet version, sprint log.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 5. FAQ · adapted from 21st.dev "Animated Line Accordion" by shadcnspace ---------- */
const FAQS = [
  ["Why sprints instead of a 52-week challenge?", "Long challenges ask you to stay excited for a year, and most people drop them within weeks. A sprint is short enough to finish while it still feels new, and finishing is what builds the habit."],
  ["What if the amounts are too big for me?", "Every sprint works at half size: save half of each bubble's number and still color it in. There's also a No-Spend Week that needs no money at all."],
  ["What do I get, exactly?", "A 17-page PDF in Letter size, the same pages in A6 for cash binders, and a spreadsheet for Google Sheets, Excel or Numbers where bubbles turn color when you tick them. Instant download."],
  ["Do I need a printer?", "No. The pages work in GoodNotes, Notability or any PDF app, and the spreadsheet works on any device."],
  ["Is this financial advice?", "No. It's a motivational tool for saving money. It doesn't consider your situation, and it isn't medical advice or ADHD treatment. Never skip essentials to finish a sprint."],
];
function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="gutter bg-panel2 py-20 sm:py-28">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div><p className="font-display text-sm font-bold uppercase tracking-[.2em] text-pink">Questions</p><h2 className="mt-3 font-display text-[clamp(34px,5vw,52px)] font-bold leading-[1.02]">Before you buy</h2></div>
        <div className="flex flex-col gap-2">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q} className={cx("rounded-2xl transition-colors", isOpen ? "chunky bg-panel" : "hover:bg-panel/60")}>
                <button type="button" id={`faq-${i}`} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)} className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left font-display text-lg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink">
                  {q}{isOpen ? <Minus className="size-5 shrink-0" /> : <Plus className="size-5 shrink-0" />}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden"><p className="px-5 pb-5 text-[15px] leading-7 text-soft">{a}</p></motion.div>}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Final() {
  return (
    <section className="gutter py-20">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-[40px] border-[3px] border-ink bg-pink px-6 py-16 text-center text-ink shadow-[10px_10px_0_#1f1b2e]">
        <h2 className="max-w-2xl font-display text-[clamp(32px,5vw,54px)] font-bold leading-[1.02]">Start the $50 one this weekend.</h2>
        <BuyButton>Get Savings Sprints · ${PRICE}</BuyButton>
      </div>
    </section>
  );
}

function App() {
  return (
    <>
      <div className="bg-ink px-4 py-2 text-center text-[13px] font-bold text-sun">DRAFT FOR APPROVAL · not live · checkout not connected yet</div>
      <Hero /><Features /><Peek /><How /><Price /><Faq /><Final />
      <footer className="gutter pb-12"><p className="mx-auto max-w-4xl text-center text-[13px] leading-6 text-soft">Savings Sprints is a motivational tool for saving money. It is not financial, tax, legal or medical advice and does not diagnose or treat ADHD. Personal-use licence. © 2026 Savings Sprints.<br />UI patterns adapted from 21st.dev components by ruixen.ui, isaiahbjork, Khoa Phan, diarmuradi and shadcnspace.</p></footer>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
