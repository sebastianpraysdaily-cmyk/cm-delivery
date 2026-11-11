"""Forget-Proof Money video renderer: 1080x1920, 30fps, PIL frames piped to ffmpeg.
Usage: python3 render.py content/v001
"""
import json, math, subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

D = sys.argv[1]
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/.."
W, H, FPS = 1080, 1920, 30
INK = (29, 36, 64); CREAM = (251, 247, 239); MINT = (47, 191, 143); CORAL = (255, 122, 89)
PERI = (107, 123, 214); WHITE = (255, 255, 255); SOFT = (150, 158, 190); GREY = (90, 98, 128)
IF = "/usr/share/fonts/opentype/inter/"
def F(name, size):
    p = {"black": IF + "Inter-Black.otf", "bold": IF + "Inter-Bold.otf", "xb": IF + "Inter-ExtraBold.otf", "semi": IF + "Inter-SemiBold.otf",
         "sg": ROOT + "/build/font/SpaceGrotesk.ttf", "hand": ROOT + "/build/font/Kalam-Bold.ttf"}[name]
    f = ImageFont.truetype(p, size)
    if name == "sg":
        try: f.set_variation_by_axes([700])
        except Exception: pass
    return f

S = json.load(open(f"{D}/timing.json"))
beats = S["beats"]; B = {b["id"]: b for b in beats}
TOTAL = beats[-1]["start"] + beats[-1]["dur"] + 0.9
NF = int(TOTAL * FPS)

# word timings: spread within each beat by character weight
words = []
for b in beats:
    ws = b["text"].split(); wt = [len(w) + 2 for w in ws]; tot = sum(wt); t = b["start"]
    for w, x in zip(ws, wt):
        d = b["dur"] * x / tot; words.append((b["id"], w, t, t + d)); t += d

def ease(x): x = max(0, min(1, x)); return 1 - (1 - x) ** 3
def pop(x):  # overshoot
    x = max(0, min(1, x)); c = 1.7; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2

def rrect(d, box, r, fill, outline=None, width=0):
    d.rounded_rectangle(box, r, fill=fill, outline=outline, width=width)

def text_c(d, xy, s, font, fill, anchor="mm"):
    d.text(xy, s, font=font, fill=fill, anchor=anchor)

def wrap(s, font, maxw, d):
    out, cur = [], ""
    for w in s.split():
        t = (cur + " " + w).strip()
        if d.textlength(t, font=font) <= maxw: cur = t
        else: out.append(cur); cur = w
    out.append(cur); return out

cover = Image.open(f"{D}/assets/cover.png").convert("RGBA") if os.path.exists(f"{D}/assets/cover.png") else None
PAGES = [Image.open(f"{D}/assets/page{n:02d}.png").convert("RGBA") for n in (3, 5, 7, 9, 13) if os.path.exists(f"{D}/assets/page{n:02d}.png")]
SHEET = Image.open(f"{D}/assets/sheet_split.png").convert("RGBA") if os.path.exists(f"{D}/assets/sheet_split.png") else None

def shadowed(img, page, x, y, rot=0, blur=16, alpha=80):
    pg = page.rotate(rot, expand=True, resample=Image.BICUBIC) if rot else page
    sh = Image.new("RGBA", pg.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rectangle((8, 8, pg.size[0] - 1, pg.size[1] - 1), fill=(0, 0, 0, alpha))
    sh = sh.filter(ImageFilter.GaussianBlur(blur)); img.paste(sh, (int(x + 14), int(y + 20)), sh); img.paste(pg, (int(x), int(y)), pg)

def product_scene(t):
    """guide pages flip in, then the spreadsheet on a laptop doing the split maths"""
    img = bg(CREAM); d = ImageDraw.Draw(img); b = B["product"]; lt = t - b["start"]; half = b["dur"] * 0.5
    text_c(d, (W / 2, 190), "Forget-Proof Money", F("black", 76), INK)
    if lt < half:  # guide pages
        text_c(d, (W / 2, 290), "14-page printable guide", F("bold", 44), MINT)
        n = len(PAGES); pw = 640; ph = int(pw * 1056 / 816)
        for k, pg in enumerate(PAGES):
            e = ease((lt - k * half / n * 0.9) / 0.28)
            if e <= 0: continue
            im = pg.resize((pw, ph), Image.LANCZOS)
            rot = (k - n / 2) * 2.2; x = W / 2 - pw / 2 + (k - n / 2) * 14 + (1 - e) * 700; y = 400 + k * 10
            shadowed(img, im, x, y, rot)
    else:  # spreadsheet on laptop
        text_c(d, (W / 2, 290), "+ a spreadsheet that does the maths", F("bold", 44), MINT)
        e = ease((lt - half) / 0.35)
        lx, ly, lw, lh = 60, 520 + (1 - e) * 120, W - 120, 420
        rrect(d, (lx, ly, lx + lw, ly + lh), 34, (30, 32, 44))
        rrect(d, (lx + 22, ly + 22, lx + lw - 22, ly + lh - 22), 14, WHITE)
        d.polygon([(lx - 50, ly + lh), (lx + lw + 50, ly + lh), (lx + lw + 10, ly + lh + 46), (lx - 10, ly + lh + 46)], fill=(52, 55, 72))
        if SHEET is not None:
            sw = lw - 60; shh = int(SHEET.height * sw / SHEET.width)
            if shh > lh - 60: shh = lh - 60; sw = int(SHEET.width * shh / SHEET.height)
            sim = SHEET.resize((sw, shh), Image.LANCZOS); sx = lx + (lw - sw) // 2; sy = int(ly + (lh - shh) / 2)
            img.paste(sim, (sx, sy), sim)
            # highlight the two answers the viewer cares about (BILLS + SPEND rows), after a beat
            if lt - half > 0.9:
                for fy, col in ((0.46, MINT), (0.86, CORAL)):  # BILLS row, SPEND row in the zoomed table
                    yy = sy + int(shh * fy); d.rounded_rectangle((sx + int(sw * 0.62), yy - 22, sx + sw + 8, yy + 22), 10, outline=col, width=6)
        text_c(d, (W / 2, 1290), "4 setup sessions × 15 min", F("black", 54), INK)
    captions(img, t, ["product"])
    return img

def bg(color=INK):
    return Image.new("RGB", (W, H), color)

def captions(img, t, ids):
    """karaoke chunk captions for beats in ids"""
    cur = [w for w in words if w[0] in ids]
    act = [i for i, w in enumerate(cur) if w[2] <= t < w[3] + 0.25]
    if not act: return
    i = act[-1]; start = (i // 3) * 3; chunk = cur[start:start + 3]
    d = ImageDraw.Draw(img); size = 76; f = F("black", size)
    parts = [w[1] for w in chunk]; widths = [d.textlength(p + " ", font=f) for p in parts]
    while sum(widths) > W - 90 and size > 40:  # shrink long chunks so they never run off screen
        size -= 4; f = F("black", size); widths = [d.textlength(p + " ", font=f) for p in parts]
    x = (W - sum(widths)) / 2; y = 1430
    for k, (p, wd) in enumerate(zip(parts, widths)):
        on = chunk[k][2] <= t
        col = (255, 214, 64) if start + k == i else (WHITE if on else (WHITE[0], WHITE[1], WHITE[2]))
        if not on: col = (175, 180, 200)
        for dx, dy in [(-4, 0), (4, 0), (0, -4), (0, 4), (-3, -3), (3, 3), (-3, 3), (3, -3)]:
            d.text((x + dx, y + dy), p, font=f, fill=(10, 12, 25))
        d.text((x, y), p, font=f, fill=col)
        x += wd

ACCTS = [("BILLS", "Autopay only. Never look.", (58, 70, 124), WHITE, "don't touch"),
         ("SPEND", "Your one number.", MINT, INK, "your card"),
         ("BUFFER", "Oops money.", PERI, WHITE, "for surprises"),
         ("GOALS", "Money with a name.", CORAL, WHITE, "e.g. Japan trip")]
AMTS = ["$945", "$400", "$25", "$30"]

def card_grid(img, t, focus=None, appear=1.0, split_t=None):
    d = ImageDraw.Draw(img)
    cx, cy = W / 2, 960; cw, ch = 440, 330; gap = 36
    pos = [(cx - cw - gap / 2, cy - ch - gap / 2), (cx + gap / 2, cy - ch - gap / 2), (cx - cw - gap / 2, cy + gap / 2), (cx + gap / 2, cy + gap / 2)]
    for i, (name, sub, col, tc, tag) in enumerate(ACCTS):
        a = ease((appear - i * 0.12) / 0.5) if split_t is not None else 1
        if a <= 0: continue
        x, y = pos[i]
        x = cx - cw / 2 + (x - (cx - cw / 2)) * a; y = cy - ch / 2 + (y - (cy - ch / 2)) * a
        sc = 1.0; dim = False
        if focus is not None:
            if i == focus[0]: sc = 1 + 0.08 * pop(focus[1] / 0.35)
            elif i < focus[0]: dim = False
            else: dim = True
        layer = Image.new("RGBA", (int(cw), int(ch)), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
        fill = col if not dim else tuple(int(c * 0.35 + 30 * 0.65) for c in col)
        rrect(ld, (0, 0, cw - 1, ch - 1), 36, fill, outline=(255, 255, 255) if (focus and i == focus[0]) else None, width=6)
        tcol = tc if not dim else (120, 125, 150)
        ld.text((34, 34), f"{i+1}", font=F("sg", 40), fill=tcol)
        ld.text((34, 92), name, font=F("black", 70), fill=tcol)
        ld.text((34, 190), AMTS[i], font=F("sg", 58), fill=tcol)
        ld.text((34, 262), tag, font=F("semi", 30), fill=tcol)
        if sc != 1: layer = layer.resize((int(cw * sc), int(ch * sc)), Image.LANCZOS)
        img.paste(layer, (int(x - (cw * sc - cw) / 2), int(y - (ch * sc - ch) / 2)), layer)

def phone(img, t0, t):
    """bank app phone showing payday then hobby spending"""
    d = ImageDraw.Draw(img); px, py, pw, ph = 250, 300, 580, 1060
    rrect(d, (px - 16, py - 16, px + pw + 16, py + ph + 16), 80, (12, 14, 28))
    rrect(d, (px, py, px + pw, py + ph), 66, CREAM)
    text_c(d, (W / 2, py + 90), "My Bank", F("bold", 34), GREY)
    lt = t - t0
    spends = [(0.9, "Ukulele", 89), (1.5, "Crochet starter kit", 64), (2.1, "Film camera", 210)]
    bal = 1400 - sum(a for s, n, a in spends if lt > s)
    text_c(d, (W / 2, py + 190), "Balance", F("semi", 32), GREY)
    text_c(d, (W / 2, py + 270), f"${bal:,.2f}", F("black", 84), INK)
    a = ease(lt / 0.4)
    rrect(d, (px + 40, py + 360, px + pw - 40, py + 470), 28, MINT)
    text_c(d, (W / 2, py + 415), "+$1,400.00  PAYDAY", F("black", 38), INK)
    for k, (s, n, amt) in enumerate(spends):
        e = ease((lt - s) / 0.3)
        if e <= 0: continue
        y = py + 520 + k * 140; x = px + 40 + (1 - e) * 500
        rrect(d, (x, y, x + pw - 80, y + 112), 26, WHITE, outline=(230, 225, 214), width=3)
        d.text((x + 30, y + 22), n, font=F("bold", 36), fill=INK)
        d.text((x + 30, y + 66), "new hobby", font=F("semi", 26), fill=CORAL)
        d.text((x + pw - 110, y + 40), f"-${amt}", font=F("black", 38), fill=CORAL, anchor="ra")

def frame(n):
    t = n / FPS
    def inb(i): b = B[i]; return b["start"] - 0.09 <= t < b["start"] + b["dur"] + 0.18
    if t < B["relate"]["start"] - 0.09:  # HOOK
        img = bg(INK); d = ImageDraw.Draw(img); z = 1 + 0.02 * t
        f1 = F("black", int(104 * z)); f2 = F("black", int(104 * z))
        y = 560
        for line in ["Your ADHD", "brain isn't bad", "with money."]:
            text_c(d, (W / 2, y), line, f1, WHITE); y += 125
        if t > 1.85:
            e = ease((t - 1.85) / 0.25); y += 60
            for line in ["It's bad at", "remembering."]:
                text_c(d, (W / 2, y + (1 - e) * 40), line, f2, MINT); y += 125
        return img
    if t < B["turn"]["start"] - 0.09:  # PAYDAY
        img = bg((240, 235, 225)); phone(img, B["relate"]["start"], t); captions(img, t, ["relate"]); return img
    if t < B["promise"]["start"] - 0.09:  # TURN
        img = bg(INK); d = ImageDraw.Draw(img); lt = t - B["turn"]["start"]
        y = 600
        for line in ["Stop making", "your brain", "remember."]:
            text_c(d, (W / 2, y), line, F("black", 104), WHITE); y += 125
        if lt > 1.45:
            e = pop((lt - 1.45) / 0.3)
            f = F("black", int(110 * e)) if e > 0.05 else None
            if f:
                rrect(d, (90, 1080, W - 90, 1290), 40, MINT)
                text_c(d, (W / 2, 1185), "Make your bank do it.", F("black", 80), INK)
        return img
    if t < B["a1"]["start"] - 0.09:  # SPLIT
        img = bg(INK); d = ImageDraw.Draw(img); lt = t - B["promise"]["start"]
        text_c(d, (W / 2, 330), "4 accounts.", F("black", 110), WHITE)
        if lt > 0.85: text_c(d, (W / 2, 460), "1 job each.", F("black", 110), MINT)
        card_grid(img, t, appear=lt / 1.2, split_t=0)
        return img
    for i, aid in enumerate(["a1", "a2", "a3", "a4"]):
        nxt = ["a2", "a3", "a4", "intens"][i]
        if t < B[nxt]["start"] - 0.09:
            img = bg(INK); d = ImageDraw.Draw(img)
            text_c(d, (W / 2, 330), "4 accounts.", F("black", 110), WHITE)
            text_c(d, (W / 2, 460), "1 job each.", F("black", 110), MINT)
            card_grid(img, t, focus=(i, t - B[aid]["start"]))
            captions(img, t, [aid]); return img
    if t < B["product"]["start"] - 0.09:  # WEEKS
        img = bg(INK); d = ImageDraw.Draw(img); lt = t - B["intens"]["start"]
        text_c(d, (W / 2, 360), "Even the weeks", F("black", 96), WHITE)
        text_c(d, (W / 2, 475), "you forget it exists:", F("black", 96), WHITE)
        rows = [("Week 1", "checked in", True), ("Week 2", "forgot", False), ("Week 3", "forgot", False), ("Week 4", "checked in", True)]
        for k, (wk, st, me) in enumerate(rows):
            e = ease((lt - 0.3 - k * 0.35) / 0.3)
            if e <= 0: continue
            y = 640 + k * 175; x = 110 + (1 - e) * 60
            rrect(d, (x, y, W - 110, y + 145), 32, (44, 52, 88))
            d.text((x + 40, y + 28), wk, font=F("black", 46), fill=WHITE)
            d.text((x + 40, y + 88), "you: " + st, font=F("semi", 30), fill=MINT if me else CORAL)
            d.text((W - 150, y + 40), "Bills paid ✓", font=F("black", 44), fill=MINT, anchor="ra")
        captions(img, t, ["intens"]); return img
    if t < B["cta"]["start"] - 0.09:  # PRODUCT
        return product_scene(t)
    # CTA
    img = bg(CREAM); d = ImageDraw.Draw(img); lt = t - B["cta"]["start"]
    if cover is not None:
        e = max(0.2, pop(lt / 0.45)); cw = int(560 * e); ch = int(cw * 1056 / 816)
        c = cover.resize((max(1, cw), max(1, ch)), Image.LANCZOS).rotate(-4, expand=True, resample=Image.BICUBIC)
        sh = Image.new("RGBA", c.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rectangle((20, 20, c.size[0] - 1, c.size[1] - 1), fill=(0, 0, 0, 70))
        sh = sh.filter(ImageFilter.GaussianBlur(18))
        ox, oy = W // 2 - c.size[0] // 2, 250
        img.paste(sh, (ox + 18, oy + 24), sh); img.paste(c, (ox, oy), c)
    rrect(d, (120, 1150, W - 120, 1290), 70, INK)
    text_c(d, (W / 2, 1220), "Save this for payday", F("black", 62), WHITE)
    if lt > 1.6:
        text_c(d, (W / 2, 1385), "Full setup: link in bio", F("hand", 70), CORAL)
    return img

if __name__ == "__main__":
    out = f"{D}/video.mp4"
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-i", f"{D}/vo.wav", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
                          "-c:a", "aac", "-b:a", "160k", "-af", "apad", "-t", f"{TOTAL:.2f}", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    snaps = {int(x * FPS) for x in [0.1, 6.5, 11.8, 27.5, 30.5, 32.0, 33.5, 37.0]}
    for n in range(NF):
        im = frame(n)
        if n in snaps: im.save(f"{D}/assets/snap_{n:04d}.png")
        p.stdin.write(im.tobytes())
    p.stdin.close(); p.wait(); print("done", out, NF / FPS)
