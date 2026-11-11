// Record a real Savings Sprints app session at 1080x1920, with taps timed to the voiceover beats.
// Usage: node record_app.js <app standalone.html> <video dir with timing.json> <out dir>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [, , src, vdir, out] = process.argv;
  const T = JSON.parse(fs.readFileSync(vdir + '/timing.json', 'utf8'));
  const B = Object.fromEntries(T.beats.map(b => [b.id, b]));
  const t0 = B.demo1.start, END = B.win.start + B.win.dur + 0.3 - t0;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, hasTouch: true, recordVideo: { dir: out, size: { width: 1080, height: 1920 } } });
  const started = Date.now();
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.__juiceScale = 2.5; try { localStorage.clear(); localStorage.setItem('ss-onboarded', '1'); } catch (e) {} });
  await p.goto('file://' + src);
  await p.addStyleTag({ content: 'html{zoom:2.5}' });
  await p.waitForTimeout(400);
  await p.getByText('Continue').click();
  await p.waitForTimeout(700);
  const bubbles = await p.$$('svg.w-full > g > g[style]');
  const centers = [];
  for (const g of bubbles) { const bb = await g.boundingBox(); centers.push([bb.x + bb.width / 2, bb.y + bb.height / 2]); }
  const ready = (Date.now() - started) / 1000;
  const at = async (sec, fn) => { const wait = ready * 1000 + sec * 1000 - (Date.now() - started); if (wait > 0) await p.waitForTimeout(wait); await fn(); };
  const tap = async (i) => { // re-measure each time: the header can shift when COMBO appears
    // dispatch on the bubble itself: the 3D tilt parallax moves bubbles, so screen-coordinate taps can miss
    const gs = await p.$$('svg.w-full > g > g[style]'); const bb = await gs[i].boundingBox();
    await gs[i].dispatchEvent('pointerdown', { clientX: bb.x + bb.width / 2, clientY: bb.y + bb.height / 2, bubbles: true, pointerType: 'touch' });
  };
  const rel = (beat, off) => B[beat].start - t0 + off;
  // demo1: chain 4 bubbles -> combo, XP floats, 25% milestone
  for (const [k, i] of [[0.45, 0], [0.95, 1], [1.45, 2], [1.95, 3]]) await at(rel('demo1', k), () => tap(i));
  // demo2: mystery bubble (index 4) -> LOOT + 50% + level up
  await at(rel('demo2', 0.25), () => tap(4));
  await at(rel('demo2', 2.3), async () => { const k = p.getByText('Claim'); if (await k.count()) await k.first().dispatchEvent('click'); });
  await at(rel('demo2', 3.7), async () => { const k = p.getByText('Keep going'); if (await k.count()) await k.first().dispatchEvent('click'); });
  // win: finish the sprint fast, then "tilt" left and right (pointer stands in for phone tilt)
  for (const [k, i] of [[0.15, 5], [0.37, 6], [0.59, 7], [0.81, 8], [1.03, 9]]) await at(rel('win', k), () => tap(i));
  // safety: re-tap any bubble that is still white (e.g. a tap that landed during a modal fade)
  await at(rel('win', 1.25), async () => {
    const filled = await p.$$eval('svg.w-full > g > g[style] circle', cs => cs.map(c => c.getAttribute('fill')));
    for (let i = 0; i < filled.length; i++) if (filled[i] === '#fff' || filled[i] === '#7b61ff') await tap(i);
    const after = await p.$$eval('svg.w-full > g > g[style] circle', cs => cs.map(c => c.getAttribute('fill')));
    console.log('fills before/after safety', filled.join(','), '|', after.join(','));
  });
  await at(rel('win', 1.6), async () => {
    const filled = await p.$$eval('svg.w-full > g > g[style] circle', cs => cs.map(c => c.getAttribute('fill')));
    for (let i = 0; i < filled.length; i++) if (filled[i] === '#fff' || filled[i] === '#7b61ff') await tap(i);
  });
  await at(rel('win', 1.95), () => p.mouse.move(40, 1000, { steps: 8 }));
  await at(rel('win', 2.9), () => p.mouse.move(1040, 1000, { steps: 8 }));
  await at(END, async () => {});
  const vpath = await p.video().path();
  await ctx.close(); await b.close();
  fs.writeFileSync(out + '/meta.json', JSON.stringify({ video: vpath, ready, duration: END }));
  console.log(vpath, 'ready at', ready.toFixed(2), 's, clip', END.toFixed(2), 's');
})();
