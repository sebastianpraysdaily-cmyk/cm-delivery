"""Savings Sprints video renderer (v002): 1080x1920, 30fps. PIL frames -> ffmpeg.
Usage: python3 render_v002.py content/v002
Scenes follow content/v002/script.json beats. Brand: Savings Sprints candy palette + Fredoka."""
import json, math, os, subprocess, sys, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

D = sys.argv[1]
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/.."
PROD = ROOT + "/product/savings-sprints"
W, H, FPS = 1080, 1920, 30
INK = (31, 27, 46); CREAM = (255, 248, 240); WHITE = (255, 255, 255)
PINK = (255, 95, 162); SUN = (255, 210, 63); MINT = (61, 220, 151); SKY = (76, 201, 240); GRAPE = (123, 97, 255); TANG = (255, 140, 66)
GREY = (190, 186, 200)
FR = {w: PROD + f"/fonts/fredoka-{w}.ttf" for w in (600, 700)}
IF = "/usr/share/fonts/opentype/inter/"
_fc = {}
def F(kind, size):
    k = (kind, size)
    if k not in _fc:
        p = {"fr": FR[700], "fr6": FR[600], "black": IF + "Inter-Black.otf", "bold": IF + "Inter-Bold.otf", "semi": IF + "Inter-SemiBold.otf"}[kind]
        _fc[k] = ImageFont.truetype(p, size)
    return _fc[k]

S = json.load(open(f"{D}/timing.json")); B = {b["id"]: b for b in S["beats"]}
TOTAL = S["beats"][-1]["start"] + S["beats"][-1]["dur"] + 0.8
NF = int(TOTAL * FPS)
words = []
for b in S["beats"]:
    ws = b["text"].split(); wt = [len(w) + 2 for w in ws]; tot = sum(wt); t = b["start"]
    for w, x in zip(ws, wt):
        d = b["dur"] * x / tot; words.append((b["id"], w, t, t + d)); t += d

def ease(x): x = max(0, min(1, x)); return 1 - (1 - x) ** 3
def pop(x):
    x = max(0, min(1, x)); c = 1.7; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2
def tc(d, xy, s, font, fill, anchor="mm", stroke=0, sf=None):
    d.text(xy, s, font=font, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=sf)
def bg(c): return Image.new("RGB", (W, H), c)
def load(p, w=None):
    im = Image.open(p).convert("RGBA")
    if w: im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    return im
def shadow_paste(img, im, x, y, rot=0, blur=18, alpha=70):
    if rot: im = im.rotate(rot, expand=True, resample=Image.BICUBIC)
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rectangle((10, 10, im.size[0] - 1, im.size[1] - 1), fill=(20, 10, 40, alpha))
    sh = sh.filter(ImageFilter.GaussianBlur(blur)); img.paste(sh, (int(x + 16), int(y + 24)), sh); img.paste(im, (int(x), int(y)), im)

def captions(img, t, ids, y=1600):
    cur = [w for w in words if w[0] in ids]
    act = [i for i, w in enumerate(cur) if w[2] <= t < w[3] + 0.25]
    if not act: return
    i = act[-1]; st = (i // 3) * 3; chunk = cur[st:st + 3]
    d = ImageDraw.Draw(img); size = 84; f = F("fr", size)
    parts = [w[1] for w in chunk]; wd = [d.textlength(p + " ", font=f) for p in parts]
    while sum(wd) > W - 90: size -= 4; f = F("fr", size); wd = [d.textlength(p + " ", font=f) for p in parts]
    x = (W - sum(wd)) / 2
    for k, (p, w_) in enumerate(zip(parts, wd)):
        on = chunk[k][2] <= t
        col = SUN if st + k == i else (WHITE if on else (215, 210, 228))
        d.text((x, y), p, font=f, fill=col, anchor="lm", stroke_width=8, stroke_fill=INK)
        x += w_

# ---------- tracker geometry (from product build) ----------
SPR = {s["id"]: s for s in json.load(open(PROD + "/src/sprints.json"))}
sys.path.insert(0, PROD + "/src")
_cwd = os.getcwd(); os.chdir(PROD)
import importlib.util
spec = importlib.util.spec_from_file_location("ssbuild", PROD + "/src/build.py"); ssb = importlib.util.module_from_spec(spec)
_argv = sys.argv; sys.argv = ["x"]; spec.loader.exec_module(ssb); sys.argv = _argv; os.chdir(_cwd)

def tracker_layer(sid, size, filled, color, fillc, pop_i=None, pop_k=1.0):
    """render a tracker silhouette with `filled` bubbles colored, as RGBA size x size"""
    s = SPR[sid]; sc = size / 1000
    mask = ssb.draw_mask(s["shape"]).resize((size, size), Image.LANCZOS)
    out = mask.filter(ImageFilter.MaxFilter(15))
    lay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    lay.paste(Image.new("RGBA", (size, size), INK + (255,)), (0, 0), out)
    lay.paste(Image.new("RGBA", (size, size), color + (255,)), (0, 0), mask)
    d = ImageDraw.Draw(lay); r = s["geom"]["step"] * 0.43 * sc
    f = F("fr6", max(14, int(r * 0.95)))
    for i, ((x, y), a) in enumerate(zip(s["geom"]["pts"], s["amounts"])):
        x *= sc; y *= sc; rr = r * (pop_k if i == pop_i else 1)
        fc = fillc if i < filled else WHITE
        d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=fc, outline=INK, width=max(3, int(rr * 0.12)))
        d.text((x, y), str(a), font=f, fill=INK, anchor="mm")
    return lay

PAGES = {k: load(f"{D}/assets/{k}.png") for k in ["p01", "p04", "p05", "p07", "p08", "p09", "p11", "p13", "p15"]}
SHEET = load(f"{D}/assets/sheet.png")

def scene_strike(t):
    img = bg(INK); d = ImageDraw.Draw(img)
    tc(d, (W / 2, 470), "If you have ADHD,", F("fr6", 66), (220, 214, 240))
    tc(d, (W / 2, 610), "stop doing", F("fr", 120), WHITE)
    # 52-week with animated strike, then 7-day pops in
    fy = 790; f = F("fr", 170)
    col = WHITE if t < 1.6 else GREY
    tc(d, (W / 2, fy), "52-week", f, col)
    if t > 1.5:
        e = ease((t - 1.5) / 0.35); wtxt = d.textlength("52-week", font=f)
        x0 = W / 2 - wtxt / 2 - 20; d.line((x0, fy + 5, x0 + (wtxt + 40) * e, fy - 5), fill=PINK, width=26)
    if t > 1.9:
        k = pop((t - 1.9) / 0.35)
        d.rounded_rectangle((W / 2 - 300 * k, 900, W / 2 + 300 * k, 1060), 50, fill=MINT)
        if k > 0.6: tc(d, (W / 2, 980), "7-day", F("fr", int(150 * min(1, k))), INK)
    tc(d, (W / 2, 1190), "savings challenges", F("fr", 92), WHITE)
    return img

def scene_fail(t):
    lt = t - B["relate"]["start"]; img = bg(CREAM); d = ImageDraw.Draw(img)
    stage2 = lt > 1.9
    tc(d, (W / 2, 300), "Week 3:" if stage2 else "Week 1:", F("fr", 110), INK)
    tc(d, (W / 2, 420), "lost in a drawer" if stage2 else "obsessed", F("fr", 92), PINK if stage2 else MINT)
    # 52-cell tracker (13 x 4)
    gx, gy, cs = 120, 600, 64; drop = ease((lt - 2.0) / 0.6) if stage2 else 0
    rot = -18 * drop; layer = Image.new("RGBA", (13 * cs + 40, 4 * cs + 120), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
    ld.rounded_rectangle((0, 0, layer.width - 1, layer.height - 1), 30, fill=WHITE, outline=INK, width=8)
    ld.text((30, 22), "52-WEEK SAVINGS CHALLENGE", font=F("fr6", 38), fill=INK)
    filled = min(3, int(lt * 3)) if not stage2 else 3
    for i in range(52):
        cx = 20 + (i % 13) * cs; cy = 90 + (i // 13) * cs
        fc = (PINK if i < filled else WHITE) if not stage2 else ((230, 200, 215) if i < 3 else (245, 242, 247))
        ld.ellipse((cx + 6, cy + 6, cx + cs - 6, cy + cs - 6), fill=fc, outline=INK if not stage2 else GREY, width=4)
    lay = layer.rotate(rot, expand=True, resample=Image.BICUBIC)
    y = gy + drop * 520
    img.paste(lay, (int(W / 2 - lay.width / 2), int(y)), lay)
    if stage2:  # drawer front
        d.rounded_rectangle((80, 1150, W - 80, 1450), 34, fill=(214, 160, 110), outline=INK, width=10)
        d.rounded_rectangle((W / 2 - 110, 1280, W / 2 + 110, 1320), 20, fill=INK)
    captions(img, t, ["relate"])
    return img

def scene_sprints(t):
    lt = t - B["turn"]["start"]; img = bg(INK); d = ImageDraw.Draw(img)
    tc(d, (W / 2, 380), "Do a sprint", F("fr", 130), WHITE); tc(d, (W / 2, 520), "instead.", F("fr", 130), SUN)
    cards = [("7", "DAYS", PINK, 0.95), ("14", "DAYS", SUN, 1.4), ("30", "DAYS", MINT, 1.85)]
    for i, (n, l, c, at) in enumerate(cards):
        k = pop((lt - at) / 0.32)
        if k <= 0.02: continue
        cx = W / 2 + (i - 1) * 320; cy = 900; w2 = 140 * k; h2 = 200 * k
        d.rounded_rectangle((cx - w2, cy - h2, cx + w2, cy + h2), 40, fill=c, outline=WHITE, width=8)
        if k > 0.7:
            tc(d, (cx, cy - 30), n, F("fr", 150), INK); tc(d, (cx, cy + 110), l, F("fr6", 50), INK)
    captions(img, t, ["turn"])
    return img

def scene_fill(t):
    lt = t - B["fill"]["start"]; img = bg(CREAM); d = ImageDraw.Draw(img)
    s = SPR["s02"]; n = len(s["amounts"]); dur = B["fill"]["dur"] + 0.15
    prog = min(1, max(0, (lt - 0.3) / (dur - 0.5))); filled = int(prog * n + 0.0001)
    saved = sum(s["amounts"][:filled])
    tc(d, (W / 2, 250), "Boba Fund", F("fr", 110), INK)
    d.rounded_rectangle((W / 2 - 250, 330, W / 2 + 250, 470), 70, fill=SUN, outline=INK, width=8)
    tc(d, (W / 2, 400), f"${saved} / $100", F("fr", 76), INK)
    pk = None; kk = 1
    if 0 < filled <= n:
        since = (lt - 0.3) - (filled / n) * (dur - 0.5)
        pk = filled - 1; kk = 1 + 0.35 * max(0, 1 - since / 0.18)
    lay = tracker_layer("s02", 1000, filled, PINK, SUN, pk, kk)
    # tint shape differently from bg so it reads: use white outline ring
    ring = Image.new("RGBA", (1040, 1040), (0, 0, 0, 0)); ring.paste(lay, (20, 20), lay)
    img.paste(ring, (int(W / 2 - 520), 500), ring)
    captions(img, t, ["fill"])
    return img

def scene_fan(t):
    lt = t - B["range"]["start"]; img = bg(SUN); d = ImageDraw.Draw(img)
    tc(d, (W / 2, 250), "12 sprints", F("fr", 130), INK)
    tc(d, (W / 2, 370), "from $50 to $1,000", F("fr", 80), INK)
    order = ["p04", "p05", "p07", "p08", "p09", "p11", "p13", "p15"]
    dur = B["range"]["dur"]; pw = 560
    for k, key in enumerate(order):
        appear = k * (dur * 0.8) / len(order)
        e = ease((lt - appear) / 0.35)
        if e <= 0: continue
        im = PAGES[key].resize((pw, int(pw * 1056 / 816)), Image.LANCZOS)
        rot = (k - 3.5) * 3; x = W / 2 - pw / 2 + (k - 3.5) * 16 + (1 - e) * 900; y = 520 + (k % 2) * 14
        shadow_paste(img, im, x, y, rot)
    captions(img, t, ["range"])
    return img

def scene_formats(t):
    lt = t - B["intens"]["start"]; img = bg(MINT); d = ImageDraw.Draw(img)
    tc(d, (W / 2, 230), "Adds up exactly.", F("fr", 104), INK)
    # three formats appear on their words: print, iPad, spreadsheet
    dur = B["intens"]["dur"]
    # paper
    if lt > dur * 0.40:
        e = ease((lt - dur * 0.40) / 0.3); im = PAGES["p07"].resize((380, int(380 * 1056 / 816)), Image.LANCZOS)
        shadow_paste(img, im, 70 - (1 - e) * 500, 400, -6)
        tc(d, (260, 960), "Print", F("fr", 60), INK)
    # ipad
    if lt > dur * 0.55:
        e = ease((lt - dur * 0.55) / 0.3); x0 = 560 + (1 - e) * 500; y0 = 380
        d.rounded_rectangle((x0, y0, x0 + 440, y0 + 580), 46, fill=INK)
        im = PAGES["p11"].resize((392, 507), Image.LANCZOS); img.paste(im, (int(x0 + 24), int(y0 + 36)), im)
        tc(d, (x0 + 220, 1020), "iPad", F("fr", 60), INK)
    # spreadsheet laptop
    if lt > dur * 0.70:
        e = ease((lt - dur * 0.70) / 0.35); y0 = 1120 + (1 - e) * 700
        d.rounded_rectangle((90, y0, W - 90, y0 + 520), 34, fill=INK)
        d.rounded_rectangle((112, y0 + 22, W - 112, y0 + 498), 16, fill=WHITE)
        sw = W - 260; sim = SHEET.resize((sw, int(SHEET.height * sw / SHEET.width)), Image.LANCZOS)
        img.paste(sim, (130, int(y0 + 40)), sim)
        d.polygon([(40, y0 + 520), (W - 40, y0 + 520), (W - 90, y0 + 570), (90, y0 + 570)], fill=(60, 55, 80))
    captions(img, t, ["intens"], y=1810)
    return img

def scene_cta(t):
    lt = t - B["cta"]["start"]; img = bg(CREAM); d = ImageDraw.Draw(img)
    k = max(0.2, pop(lt / 0.45)); cw = int(600 * k); im = PAGES["p01"].resize((cw, int(cw * 1056 / 816)), Image.LANCZOS)
    shadow_paste(img, im, W / 2 - cw / 2, 170, -4)
    d.rounded_rectangle((110, 1150, W - 110, 1300), 75, fill=INK)
    tc(d, (W / 2, 1225), "Save this", F("fr", 76), WHITE)
    if lt > 1.2: tc(d, (W / 2, 1390), "Start the $50 one this weekend", F("fr6", 58), PINK)
    if lt > 2.6:
        d.rounded_rectangle((170, 1480, W - 170, 1600), 60, fill=SUN, outline=INK, width=6)
        tc(d, (W / 2, 1540), "Savings Sprints · link in bio", F("fr", 54), INK)
    return img

def frame(n):
    t = n / FPS
    def before(i): return t < B[i]["start"] - 0.06
    if before("relate"): return scene_strike(t)
    if before("turn"): return scene_fail(t)
    if before("fill"): return scene_sprints(t)
    if before("range"): return scene_fill(t)
    if before("intens"): return scene_fan(t)
    if before("cta"): return scene_formats(t)
    return scene_cta(t)

if __name__ == "__main__":
    out = f"{D}/video.mp4"
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-i", f"{D}/vo.wav", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
                          "-c:a", "aac", "-b:a", "160k", "-af", "apad", "-t", f"{TOTAL:.2f}", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    snaps = {int(x * FPS) for x in [0.1, 2.6, 5.0, 7.5, 10.5, 13.5, 18.5, 22.0, 25.0, 29.5]}
    for n in range(NF):
        im = frame(n)
        if n in snaps: im.save(f"{D}/assets/snap_{n:04d}.png")
        p.stdin.write(im.tobytes())
    p.stdin.close(); p.wait(); print("done", out, round(NF / FPS, 2))
