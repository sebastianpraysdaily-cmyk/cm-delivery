import * as esbuild from "esbuild";
import { execSync } from "node:child_process";
import fs from "node:fs";
execSync("npx tailwindcss -i src/styles.css -o dist/app.css --minify", { stdio: "inherit" });
const r = await esbuild.build({ entryPoints: ["src/main.jsx"], bundle: true, minify: true, write: false, format: "iife",
  loader: { ".jpg": "dataurl", ".jsx": "jsx" }, jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' } });
const js = r.outputFiles[0].text.replace(/<\/script/g, "<\\/script");
const css = fs.readFileSync("dist/app.css", "utf8");
const head = `<title>Forget-Proof Money</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Forget-Proof Money: the ADHD money system you set up once. 4 setup sessions of 15 minutes, then 10 minutes a week.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&family=Kalam:wght@700&display=swap">
<style>${css}</style>`;
const body = `<div id="root"></div><script>${js}</script>`;
fs.writeFileSync("dist/index.html", head + "\n" + body);           // artifact (skeleton added at publish)
fs.writeFileSync("dist/standalone.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">${head}</head><body>${body}</body></html>`); // for real hosting
console.log("built", (fs.statSync("dist/index.html").size/1024).toFixed(0)+"KB");
