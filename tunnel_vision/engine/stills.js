// Usage: node stills.js <page.html> <outdir> t1 t2 ...
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [page, out, ...ts] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.resolve(page));
  await p.evaluate(() => document.fonts.ready);
  for (const t of ts) {
    await p.evaluate(t => window.render(t), +t);
    await p.screenshot({ path: path.join(out, `t${(+t).toFixed(2)}.png`) });
  }
  await b.close();
})();
