// Screenshot an HTML page at an exact pixel size (used for keepsake prints).
// Usage: node shoot.js <page.html> <out.png> <width> <height>
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [page, out, w, h] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.resolve(page), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: out });
  await b.close();
})();
