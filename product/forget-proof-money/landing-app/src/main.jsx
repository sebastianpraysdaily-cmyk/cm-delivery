import React, { useRef, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { motion, useMotionValue, useSpring, useTransform, useScroll, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Plus, Minus, Lock, Unlock, ArrowUpRight, Timer, Phone } from "lucide-react";
import cover from "./page01.jpg";
import p03 from "./page03.jpg";
import p05 from "./page05.jpg";
import p07 from "./page07.jpg";
import p09 from "./page09.jpg";
import p10 from "./page10.jpg";
import p13 from "./page13.jpg";

const PRICE = 12, WAS = 17;
const cx = (...c) => c.filter(Boolean).join(" ");

function BuyButton({ className, children, big }) {
  const [clicked, setClicked] = useState(false);
  return (
    <button type="button" onClick={() => setClicked(true)}
      className={cx("group inline-flex items-center justify-center gap-2 rounded-full bg-mint font-extrabold text-[#10261e] shadow-[0_10px_30px_-10px_rgba(47,191,143,.8)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-12px_rgba(47,191,143,.9)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-coral",
        big ? "w-full px-8 py-5 text-lg" : "px-7 py-4 text-base", className)}>
      {clicked ? "Checkout opens after approval" : children}
      {!clicked && <ArrowUpRight className="size-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
    </button>
  );
}

/* ---------- 1. HERO · adapted from 21st.dev "Credit Card Hero" by ruixen.ui ----------
   Changes: the two decorative credit cards became our 4 accounts (the product's core idea),
   tilt kept on pointer devices, gentle float added for touch screens. */
const ACCTS = [
  { name: "BILLS", job: "Autopay only. Never look.", amt: "$945", bg: "bg-bills", fg: "text-white" },
  { name: "SPEND", job: "Your card. Your one number.", amt: "$400", bg: "bg-mint", fg: "text-[#10261e]" },
  { name: "BUFFER", job: "Oops money.", amt: "$25", bg: "bg-peri", fg: "text-white" },
  { name: "GOALS", job: "Money with a name on it.", amt: "$30", bg: "bg-coral", fg: "text-white" },
];

function AccountCard({ a, className, style, delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div style={style}
      animate={reduce ? {} : { y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
      className={cx("absolute z-10 rounded-2xl p-4 shadow-2xl ring-1 ring-black/5", a.bg, a.fg, className)}>
      <div className="flex items-start justify-between">
        <span className="font-display text-[13px] font-bold tracking-[.18em] opacity-80">{a.name}</span>
        <span className="h-5 w-7 rounded-[5px] bg-white/30" />
      </div>
      <div className="mt-3 font-display text-2xl font-bold tabular-nums sm:text-3xl">{a.amt}</div>
      <div className="mt-1 text-[12px] font-semibold opacity-85 sm:text-[13px]">{a.job}</div>
    </motion.div>
  );
}

function Hero() {
  const mouseX = useMotionValue(300), mouseY = useMotionValue(200);
  const rotateX = useSpring(useTransform(mouseY, [0, 460], [6, -6]), { stiffness: 300, damping: 22 });
  const rotateY = useSpring(useTransform(mouseX, [0, 900], [-6, 6]), { stiffness: 300, damping: 22 });
  const onMove = ({ clientX, clientY, currentTarget }) => {
    const r = currentTarget.getBoundingClientRect(); mouseX.set(clientX - r.left); mouseY.set(clientY - r.top);
  };
  return (
    <header className="gutter overflow-hidden pb-24 pt-10 sm:pb-32 sm:pt-16" style={{ perspective: 1200 }}>
      <motion.div onMouseMove={onMove} onMouseLeave={() => { mouseX.set(450); mouseY.set(230); }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative mx-auto flex max-w-4xl flex-col items-center rounded-[36px] border-[10px] border-panel2 bg-ink px-6 pb-36 pt-16 text-center text-white shadow-[0_40px_80px_-30px_rgba(29,36,64,.55)] sm:px-12 sm:pb-24 sm:pt-20">
        <div className="relative z-20 flex max-w-2xl flex-col items-center gap-5">
          <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-display text-[12px] font-bold uppercase tracking-[.2em] text-mint">The ADHD money system you set up once</span>
          <h1 className="font-display text-[clamp(46px,10vw,88px)] font-bold leading-[.95] tracking-[-0.04em]">Forget-Proof Money</h1>
          <p className="max-w-[36ch] text-lg leading-relaxed text-[#c9cfe6] sm:text-xl">You're not bad with money. You've been using systems that need a perfect memory. This one moves the remembering out of your head and into your bank.</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            <BuyButton>Get it for ${PRICE}</BuyButton>
            <span className="text-sm text-[#aab2cf]"><s>${WAS}</s> launch price</span>
          </div>
          <p className="font-hand text-2xl text-coral">no willpower required ✦</p>
        </div>
        {/* floating account cards, outside the copy */}
        <AccountCard a={ACCTS[0]} delay={0} style={{ transform: "translateZ(60px)" }} className="-bottom-12 -left-6 w-48 sm:-bottom-14 sm:-left-20 sm:w-60" />
        <AccountCard a={ACCTS[1]} delay={1.2} style={{ transform: "translateZ(50px)" }} className="-bottom-16 -right-6 w-48 sm:-right-16 sm:bottom-20 sm:w-60" />
        <AccountCard a={ACCTS[2]} delay={0.6} style={{ transform: "translateZ(40px)" }} className="-left-20 top-8 hidden w-48 lg:block" />
        <AccountCard a={ACCTS[3]} delay={1.8} style={{ transform: "translateZ(45px)" }} className="-right-20 -top-8 hidden w-48 lg:block" />
      </motion.div>
    </header>
  );
}

/* ---------- 2. FEATURES · adapted from 21st.dev "Marketing Feature Bento" by isaiahbjork ----------
   Changes: kept the idea that each card carries a small working visual; visuals rebuilt for this product
   (a live Safe-to-Spend calculator, the 4-account split, Parking Lot locks, Money Date timer, late-fee script). */
function Section({ eyebrow, title, desc, children, id, tint }) {
  return (
    <section id={id} className={cx("gutter py-20 sm:py-28", tint && "bg-panel2")}>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
          <div>
            <p className="font-display text-[13px] font-bold uppercase tracking-[.2em] text-mint">{eyebrow}</p>
            <h2 className="mt-3 font-display text-[clamp(32px,5vw,52px)] font-bold leading-[1.02] tracking-[-0.03em]">{title}</h2>
          </div>
          {desc && <p className="max-w-[46ch] text-[17px] leading-7 text-soft">{desc}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

function BentoCard({ title, desc, className, children, delay = 0 }) {
  return (
    <motion.article initial={{ opacity: 1, y: 0 }} whileInView={{ y: [12, 0] }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay }}
      className={cx("group flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-line bg-panel shadow-[0_1px_0_rgba(0,0,0,.03),0_12px_30px_-18px_rgba(29,36,64,.25)]", className)}>
      <div className="flex min-h-[210px] flex-1 items-center justify-center px-5 pt-6">{children}</div>
      <div className="px-6 pb-6 pt-5">
        <h3 className="font-display text-[18px] font-bold tracking-[-0.01em]">{title}</h3>
        <p className="mt-1.5 max-w-[48ch] text-[14.5px] leading-6 text-soft">{desc}</p>
      </div>
    </motion.article>
  );
}

function SafeToSpend() {
  const [bal, setBal] = useState(400), [days, setDays] = useState(14);
  const perDay = bal / days;
  return (
    <div className="w-full max-w-[340px] rounded-2xl border border-line bg-panel2 p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] font-bold uppercase tracking-[.14em] text-soft">Safe-to-Spend</span>
        <span className="rounded-full bg-mint-l px-2 py-0.5 text-[11px] font-bold text-mint">try it</span>
      </div>
      <div className="mt-2 font-display text-[44px] font-bold leading-none tabular-nums">${perDay.toFixed(2)}<span className="ml-1 text-base font-semibold text-soft">/day</span></div>
      <label className="mt-4 block text-[13px] font-semibold" htmlFor="bal">In SPEND: <span className="tabular-nums">${bal}</span></label>
      <input id="bal" type="range" min="50" max="1500" step="10" value={bal} onChange={(e) => setBal(+e.target.value)} className="w-full" />
      <label className="mt-2 block text-[13px] font-semibold" htmlFor="days">Days to payday: <span className="tabular-nums">{days}</span></label>
      <input id="days" type="range" min="1" max="31" value={days} onChange={(e) => setDays(+e.target.value)} className="w-full" />
    </div>
  );
}

function SplitVisual() {
  return (
    <div className="w-full max-w-[560px]">
      <div className="mx-auto w-fit rounded-xl bg-ink px-5 py-3 text-center font-display text-white">
        <div className="text-[11px] font-bold uppercase tracking-[.18em] text-mint">Payday</div>
        <div className="text-2xl font-bold tabular-nums">+$1,400</div>
      </div>
      <svg viewBox="0 0 400 40" className="mx-auto block h-10 w-full max-w-[420px]" aria-hidden>
        {[50, 150, 250, 350].map((x, i) => (
          <motion.path key={x} d={`M200 0 C200 22 ${x} 18 ${x} 40`} fill="none" stroke="currentColor" className="text-line" strokeWidth="3"
            initial={false} />
        ))}
      </svg>
      <div className="grid grid-cols-4 gap-2">
        {ACCTS.map((a) => (
          <div key={a.name} className={cx("rounded-xl p-2.5 text-center sm:p-3", a.bg, a.fg)}>
            <div className="text-[10px] font-bold tracking-[.12em] opacity-85 sm:text-[11px]">{a.name}</div>
            <div className="font-display text-base font-bold tabular-nums sm:text-xl">{a.amt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParkingLot() {
  const items = [["Ukulele", "$89", "Unlocks Thu", true], ["Crochet kit", "$64", "Unlocked", false], ["Film camera", "$210", "Unlocks Sat", true]];
  return (
    <div className="flex w-full max-w-[320px] flex-col gap-2">
      {items.map(([n, p, s, locked], i) => (
        <div key={n} className="flex items-center gap-3 rounded-xl border border-line bg-panel2 px-3 py-2.5 transition group-hover:translate-x-1" style={{ transitionDelay: `${i * 60}ms` }}>
          <span className={cx("grid size-8 place-items-center rounded-lg", locked ? "bg-coral-l text-coral" : "bg-mint-l text-mint")}>
            {locked ? <Lock className="size-4" /> : <Unlock className="size-4" />}
          </span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold">{n}</span><span className="block text-[12px] text-soft">{s}</span></span>
          <span className="font-display font-bold tabular-nums">{p}</span>
        </div>
      ))}
    </div>
  );
}

function MoneyDate() {
  return (
    <div className="relative grid size-40 place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r="44" fill="none" stroke="var(--line)" strokeWidth="7" />
        <motion.circle cx="50" cy="50" r="44" fill="none" stroke="#2fbf8f" strokeWidth="7" strokeLinecap="round"
          initial={{ pathLength: 1 }} whileInView={{ pathLength: [1, 0.35] }} viewport={{ once: true }} transition={{ duration: 2.2, ease: "easeInOut" }} />
      </svg>
      <div className="text-center"><Timer className="mx-auto size-5 text-mint" /><div className="font-display text-3xl font-bold tabular-nums">10:00</div><div className="text-[12px] font-semibold text-soft">treat first</div></div>
    </div>
  );
}

function Script() {
  return (
    <div className="w-full max-w-[360px] overflow-hidden rounded-2xl border border-line bg-panel2">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2 text-[12px] font-semibold text-soft"><Phone className="size-3.5" /> late-fee call script</div>
      <p className="px-4 py-3 text-[14px] leading-6">
        <b>You:</b> "I've set up autopay now so it won't happen again. Is there any way you could <span className="rounded bg-mint-l px-1 font-semibold text-mint">waive this one as a courtesy?</span>"
      </p>
    </div>
  );
}

function Features() {
  return (
    <Section id="inside" eyebrow="What's inside" title="Four accounts. One job each. Everything else is automatic."
      desc="A 14-page printable guide plus a spreadsheet that does the maths. Each piece removes one thing your brain used to have to remember.">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
        <BentoCard className="lg:col-span-4" title="The payday split" desc="Your pay lands and splits itself into Bills, Spend, Buffer and Goals. Bills pay themselves from an account you never look at.">
          <SplitVisual />
        </BentoCard>
        <BentoCard className="lg:col-span-2" delay={0.05} title="One number to remember" desc="Money in SPEND ÷ days to payday. Under it? You're fine. Drag the sliders.">
          <SafeToSpend />
        </BentoCard>
        <BentoCard className="lg:col-span-2" delay={0.1} title="The Impulse Parking Lot" desc="Not no. Just not yet. Park it for 72 hours, then buy it guilt-free if you still want it.">
          <ParkingLot />
        </BentoCard>
        <BentoCard className="lg:col-span-2" delay={0.15} title="The 10-Minute Money Date" desc="Once a week. Same treat, timer on. When it rings, you're allowed to stop.">
          <MoneyDate />
        </BentoCard>
        <BentoCard className="md:col-span-2 lg:col-span-2" delay={0.2} title="Get your ADHD tax back" desc="A word-for-word script for asking companies to waive a late fee. Works in chat too.">
          <Script />
        </BentoCard>
      </div>
    </Section>
  );
}

/* ---------- 3. SETUP · adapted from 21st.dev "Stacking Cards" by Khoa Phan (danielpetho) ----------
   Changes: window scroll instead of a container, cards hold the 4 setup sessions with their guide page. */
const SESSIONS = [
  { n: "Session 1", t: "The Bill Dump", d: "Get every bill out of your head and onto one page. A prompt list catches the ones you always forget.", img: p03, bg: "bg-bills", fg: "text-white" },
  { n: "Session 2", t: "The 4 Accounts", d: "Open Bills, Spend, Buffer and Goals, then work out your payday split. A worked example shows the maths.", img: p05, bg: "bg-mint", fg: "text-[#10261e]" },
  { n: "Session 3", t: "Your Safe-to-Spend number", d: "One number between paydays. No categories. No tracking every coffee.", img: p07, bg: "bg-peri", fg: "text-white" },
  { n: "Session 4", t: "Autopay everything", d: "Switch every bill to autopay from the Bills account and stop paying late fees for bills you could afford.", img: p09, bg: "bg-coral", fg: "text-white" },
];

function StackCard({ s, i, total, progress }) {
  const scale = useTransform(progress, [i / total, 1], [1, 1 - (total - i) * 0.04]);
  return (
    <div className="sticky top-0 flex h-[70vh] min-h-[440px] items-start justify-center pt-[10vh]">
      <motion.div style={{ scale, top: `${i * 18}px` }} className={cx("relative grid w-full max-w-4xl origin-top gap-6 overflow-hidden rounded-[30px] p-7 shadow-[0_30px_60px_-30px_rgba(29,36,64,.6)] sm:grid-cols-[1.1fr_1fr] sm:p-10", s.bg, s.fg)}>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 font-display text-[13px] font-bold uppercase tracking-[.18em] opacity-85">{s.n}<span className="rounded-full bg-black/15 px-2.5 py-0.5 normal-case tracking-normal">15 min</span></div>
          <h3 className="mt-3 font-display text-[clamp(28px,4vw,42px)] font-bold leading-[1.02] tracking-[-0.02em]">{s.t}</h3>
          <p className="mt-3 max-w-[40ch] text-[16px] leading-7 opacity-90">{s.d}</p>
        </div>
        <img src={s.img} alt={`Guide page for ${s.t}`} className="hidden max-h-[300px] w-auto justify-self-center rounded-xl shadow-xl ring-1 ring-black/10 sm:block" />
      </motion.div>
    </div>
  );
}

function Setup() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <section className="gutter bg-panel2 pt-20 sm:pt-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-display text-[13px] font-bold uppercase tracking-[.2em] text-mint">How it works</p>
        <h2 className="mt-3 max-w-3xl font-display text-[clamp(32px,5vw,52px)] font-bold leading-[1.02] tracking-[-0.03em]">Set it up in four 15-minute sessions. Then 10 minutes a week.</h2>
      </div>
      <div ref={ref} className="relative mx-auto max-w-6xl pb-[12vh]">
        {SESSIONS.map((s, i) => <StackCard key={s.n} s={s} i={i} total={SESSIONS.length} progress={scrollYProgress} />)}
      </div>
    </section>
  );
}

/* ---------- 4. PRICE · adapted from 21st.dev "Lifetime Deal Pricing Card" by diarmuradi ----------
   Changes: removed the customer-avatar row and "847 people" count (we have no customers yet, so it would be fake),
   removed the money-back line (refund policy not decided). */
const INCLUDED = ["14-page printable PDF guide", "Spreadsheet that does the maths", "Payday Split calculator", "Safe-to-Spend calculator", "Impulse Parking Lot", "10-Minute Money Date", "Late-fee call script", "15-Minute Restart for off weeks"];

function Price() {
  return (
    <section id="price" className="gutter py-20 sm:py-28">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
        <span className="rounded-full bg-mint-l px-3 py-1 text-[13px] font-bold text-mint">Launch price</span>
        <h2 className="font-display text-[clamp(32px,5vw,52px)] font-bold leading-[1.02] tracking-[-0.03em]">One price. Set it up once.</h2>
        <p className="max-w-xl text-lg text-soft">Instant download. Works on paper, in any PDF app, or in Google Sheets, Excel and Numbers.</p>
        <div className="w-full max-w-2xl rounded-[34px] bg-panel2 p-1.5">
          <div className="grid gap-7 rounded-[28px] bg-panel p-7 text-left shadow-[0_24px_50px_-30px_rgba(29,36,64,.45)] sm:grid-cols-[200px_1fr] sm:p-9">
            <img src={cover} alt="Forget-Proof Money guide cover" className="mx-auto w-40 -rotate-3 rounded-lg shadow-xl ring-1 ring-black/10 sm:w-full" />
            <div className="flex flex-col gap-5">
              <div className="flex items-end gap-3">
                <span className="font-display text-7xl font-bold leading-none tracking-[-0.04em] tabular-nums">${PRICE}</span>
                <span className="pb-2 text-2xl text-soft line-through tabular-nums">${WAS}</span>
              </div>
              <p className="text-sm text-soft">One-time payment · instant download · personal use</p>
              <BuyButton big>Get Forget-Proof Money</BuyButton>
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {INCLUDED.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14.5px]"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-mint"><Check className="size-3 text-[#10261e]" strokeWidth={3} /></span>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 5. FAQ · adapted from 21st.dev "Animated Line Accordion" by shadcnspace ----------
   Changes: Radix swapped for a small Framer Motion accordion (no extra dependency); same highlighted open item + plus/minus. */
const FAQS = [
  ["Do I need to switch banks?", "Usually not. Many banks let you open extra accounts or \"pots\" for free in the app. If yours doesn't, a second free bank account works. The guide shows both routes."],
  ["My income is irregular. Does this still work?", "Yes. You build the split around your lowest month from the last six months, and anything above it goes to your Buffer first."],
  ["What if I fall off for a few weeks?", "That's what it's built for. Bills keep paying and savings keep moving while you're not looking. The 15-Minute Restart gets you back in without starting over."],
  ["Do I need Google Sheets or Excel?", "No. The PDF works on paper or in any PDF app. The spreadsheet is a bonus that does the maths, and it opens in Google Sheets, Excel or Numbers."],
  ["Is this financial advice?", "No. It's an educational system for organising your own money. It doesn't consider your personal situation, and it isn't medical advice or ADHD treatment."],
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="gutter bg-panel2 py-20 sm:py-28">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[.2em] text-mint">Questions</p>
          <h2 className="mt-3 font-display text-[clamp(32px,5vw,48px)] font-bold leading-[1.02] tracking-[-0.03em]">Before you buy</h2>
        </div>
        <div className="flex flex-col gap-2">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q} className={cx("rounded-2xl transition-colors duration-300", isOpen ? "bg-panel shadow-[0_12px_30px_-20px_rgba(29,36,64,.4)]" : "bg-transparent hover:bg-panel/60")}>
                <button type="button" id={`faq-${i}`} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[16px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint rounded-2xl">
                  {q}{isOpen ? <Minus className="size-4 shrink-0" /> : <Plus className="size-4 shrink-0" />}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="overflow-hidden">
                      <p className="px-5 pb-5 text-[15px] leading-7 text-soft">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Peek() {
  const pages = [cover, p05, p07, p09, p10, p13];
  return (
    <div className="gutter pb-6">
      <div className="mx-auto flex max-w-6xl gap-4 overflow-x-auto pb-4" aria-label="Pages from the guide">
        {pages.map((p, i) => <img key={i} src={p} alt={`Guide page ${i + 1}`} className="w-44 shrink-0 rounded-lg shadow-lg ring-1 ring-black/10 sm:w-52" style={{ transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }} />)}
      </div>
    </div>
  );
}

function Final() {
  return (
    <section className="gutter py-20">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-[36px] bg-ink px-6 py-16 text-center text-white">
        <h2 className="max-w-2xl font-display text-[clamp(30px,5vw,48px)] font-bold leading-[1.05] tracking-[-0.03em]">Stop making your brain remember. <span className="text-mint">Make your bank do it.</span></h2>
        <BuyButton>Get Forget-Proof Money · ${PRICE}</BuyButton>
        <p className="font-hand text-2xl text-coral">Not "no". Just "not yet". ✦</p>
      </div>
    </section>
  );
}

function App() {
  return (
    <>
      <div className="bg-coral px-4 py-2 text-center text-[13px] font-bold text-white">DRAFT FOR APPROVAL · not live · checkout not connected yet</div>
      <Hero />
      <Features />
      <Peek />
      <Setup />
      <Price />
      <Faq />
      <Final />
      <footer className="gutter pb-12">
        <p className="mx-auto max-w-4xl text-center text-[13px] leading-6 text-soft">Forget-Proof Money is general educational material. It is not financial, tax, legal or medical advice and does not diagnose or treat ADHD. Bank features vary; check your providers' terms and fees. Personal-use licence. © 2026 Forget-Proof Money.<br />UI patterns adapted from 21st.dev components by ruixen.ui, isaiahbjork, Khoa Phan, diarmuradi and shadcnspace.</p>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
