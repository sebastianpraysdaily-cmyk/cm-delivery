// Game rules for Savings Sprints. Pure functions over a plain state object; UI turns events into juice.
import SPRINTS from "./sprints.json";
export { SPRINTS };

export const LEVELS = ["Coin Rookie", "Bubble Popper", "Sprint Starter", "Combo Kid", "Steady Saver", "Stash Builder", "Money Ninja", "Vault Keeper", "Savings Legend", "Mythic Saver"];
export const xpFor = (lvl) => 50 * (lvl - 1) * lvl;          // L2=100, L3=300, L4=600, L5=1000 ...
export function levelOf(xp) { let l = 1; while (xp >= xpFor(l + 1)) l++; return l; }

export const BADGES = {
  first_pop: { name: "First Pop", desc: "Color your first bubble", icon: "🫧" },
  combo3: { name: "Combo x3", desc: "3 bubbles in a row", icon: "⚡" },
  combo10: { name: "On Fire", desc: "10-bubble combo", icon: "🔥" },
  streak3: { name: "3-Day Streak", desc: "Save 3 days in a row", icon: "📆" },
  streak7: { name: "Week Warrior", desc: "7-day streak", icon: "🛡️" },
  comeback: { name: "Comeback Kid", desc: "Came back after 3+ days away", icon: "💪" },
  loot: { name: "Lucky Find", desc: "Fill a mystery bubble", icon: "🎁" },
  sprint1: { name: "Sprint Finisher", desc: "Finish a whole sprint", icon: "🏁" },
  nospend: { name: "Buy-Nothing Hero", desc: "Finish the No-Spend Week", icon: "🧘" },
  saved100: { name: "$100 Club", desc: "Save $100 in total", icon: "💵" },
  saved500: { name: "$500 Club", desc: "Save $500 in total", icon: "💰" },
  saved1000: { name: "Four Figures", desc: "Save $1,000 in total", icon: "🏆" },
};

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const weekKey = (d = new Date()) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + "-" + Math.ceil(((t - y) / 86400000 + 1) / 7); };

export function fresh() {
  return { v: 1, xp: 0, filled: {}, completed: {}, badges: {}, streak: 0, lastDay: null, freezes: 1, freezeWeek: weekKey(), combo: 0, comboAt: 0, questDay: null, started: dayKey() };
}
export function load() { try { const s = JSON.parse(localStorage.getItem("ss-state") || "null"); if (s && s.v === 1) return s; } catch (e) {} return fresh(); }
export function save(s) { try { localStorage.setItem("ss-state", JSON.stringify(s)); } catch (e) {} }

export const mysteryIndex = (sp) => sp.kind === "days" ? -1 : ([...sp.id].reduce((a, c) => a + c.charCodeAt(0), 0) * 7) % sp.amounts.length;
export function unlockedCount(xp) { return Math.min(SPRINTS.length, 2 + levelOf(xp)); } // L1: 3 sprints, +1 per level
export function savedIn(s, sp) { return (s.filled[sp.id] || []).reduce((a, i) => a + (sp.amounts[i] || 0), 0); }
export function totalSaved(s) { return SPRINTS.reduce((a, sp) => a + savedIn(s, sp), 0); }
export function pctOf(s, sp) { return Math.round(((s.filled[sp.id] || []).length / sp.amounts.length) * 100); }

/** Toggle one bubble. Returns { state, events[] } where events drive sound/haptics/visuals. */
export function toggle(prev, sp, i, now = Date.now()) {
  const s = JSON.parse(JSON.stringify(prev)); const ev = [];
  const list = new Set(s.filled[sp.id] || []);
  if (list.has(i)) { // undo: no punishment beyond removing the base XP
    list.delete(i); s.filled[sp.id] = [...list]; s.xp = Math.max(0, s.xp - 10); ev.push({ t: "undo" });
    if (s.completed[sp.id] && list.size < sp.amounts.length) delete s.completed[sp.id];
    return { state: s, events: ev };
  }
  const lvlBefore = levelOf(s.xp), unlockedBefore = unlockedCount(s.xp), savedBefore = totalSaved(s), pctBefore = pctOf(s, sp);
  list.add(i); s.filled[sp.id] = [...list];
  // combo: taps within 8s chain together
  s.combo = now - s.comboAt < 8000 ? s.combo + 1 : 1; s.comboAt = now;
  const mult = Math.min(3, 1 + Math.floor((s.combo - 1) / 3) * 0.5);
  let gain = Math.round(10 * mult); ev.push({ t: "pop", combo: s.combo, mult, gain });
  // streak + comeback + daily quest
  const today = dayKey(new Date(now));
  if (s.freezeWeek !== weekKey(new Date(now))) { s.freezeWeek = weekKey(new Date(now)); s.freezes = 1; }
  if (s.lastDay !== today) {
    const gap = s.lastDay ? daysBetween(s.lastDay, today) : 0;
    if (!s.lastDay || gap > 2 || (gap === 2 && s.freezes < 1)) { if (s.lastDay && gap >= 3) award(s, "comeback", ev); s.streak = 1; }
    else if (gap === 1) s.streak += 1;
    else if (gap === 2) { s.freezes -= 1; s.streak += 1; ev.push({ t: "freeze" }); }
    s.lastDay = today;
    if (s.questDay !== today) { s.questDay = today; gain += 25; ev.push({ t: "quest", gain: 25 }); }
    if (s.streak > 1) ev.push({ t: "streak", n: s.streak });
  }
  if (i === mysteryIndex(sp)) { gain += 50; ev.push({ t: "loot", gain: 50 }); award(s, "loot", ev); }
  const pct = pctOf(s, sp);
  for (const m of [25, 50, 75]) if (pctBefore < m && pct >= m) { gain += 25; ev.push({ t: "milestone", m }); }
  if (pct >= 100 && !s.completed[sp.id]) { s.completed[sp.id] = today; gain += 100; ev.push({ t: "complete", sp: sp.id }); award(s, "sprint1", ev); if (sp.kind === "days") award(s, "nospend", ev); }
  s.xp += gain;
  award(s, "first_pop", ev);
  if (s.combo >= 3) award(s, "combo3", ev);
  if (s.combo >= 10) award(s, "combo10", ev);
  if (s.streak >= 3) award(s, "streak3", ev);
  if (s.streak >= 7) award(s, "streak7", ev);
  const saved = totalSaved(s);
  for (const [k, v] of [["saved100", 100], ["saved500", 500], ["saved1000", 1000]]) if (savedBefore < v && saved >= v) award(s, k, ev);
  const lvl = levelOf(s.xp);
  if (lvl > lvlBefore) ev.push({ t: "level", lvl, title: LEVELS[Math.min(lvl - 1, LEVELS.length - 1)] });
  if (unlockedCount(s.xp) > unlockedBefore) ev.push({ t: "unlock", sp: SPRINTS[unlockedCount(s.xp) - 1].name });
  return { state: s, events: ev };
}
function award(s, id, ev) { if (!s.badges[id]) { s.badges[id] = Date.now(); ev.push({ t: "badge", id, ...BADGES[id] }); } }
