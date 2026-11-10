// Render scene.html frame-by-frame (deterministic) and pipe JPEG frames into FFmpeg.
// Usage: node render.js <page.html> <audio.wav> <out.mp4> [fps]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const [page, wav, out, fpsArg, durArg] = process.argv.slice(2);
  const fps = +(fpsArg || 30), dur = +(durArg || 20), frames = Math.round(dur * fps);
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-i', wav,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-r', String(fps), '-g', String(fps), '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-t', String(dur), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.resolve(page));
  await p.evaluate(() => document.fonts.ready);
  for (let f = 0; f < frames; f++) {
    await p.evaluate(t => window.render(t), f / fps);
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) process.stderr.write(`frame ${f}/${frames}\n`);
  }
  ff.stdin.end();
  await b.close();
  await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
})();
