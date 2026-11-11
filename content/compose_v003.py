"""Compose v003: PIL intro (rigged hook) + real app recording + PIL CTA, VO, burned-in ASS captions.
Usage: python3 compose_v003.py content/v003"""
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

D = sys.argv[1]
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/.."
FONTS = ROOT + "/product/savings-sprints/fonts"
W, H, FPS = 1080, 1920, 30
INK = (31, 27, 46); CREAM = (255, 248, 240); WHITE = (255, 255, 255)
PINK = (255, 95, 162); SUN = (255, 210, 63); MINT = (61, 220, 151); SKY = (76, 201, 240); GRAPE = (123, 97, 255); TANG = (255, 140, 66); RED = (238, 52, 72)
_fc = {}
def F(w, size):
    k = (w, size)
    if k not in _fc: _fc[k] = ImageFont.truetype(f"{FONTS}/fredoka-{w}.ttf", size)
    return _fc[k]
T = json.load(open(f"{D}/timing.json")); B = {b["id"]: b for b in T["beats"]}
END = B["cta"]["start"] + B["cta"]["dur"] + 0.9
def ease(x): x = max(0, min(1, x)); return 1 - (1 - x) ** 3
def pop(x): x = max(0, min(1, x)); c = 1.7; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2
def tc(d, xy, s, f, fill, **k): d.text(xy, s, font=f, fill=fill, anchor="mm", **k)
def word_time(beat, word):
    b = B[beat]; ws = b["text"].split(); wt = [len(w) + 2 for w in ws]; tot = sum(wt); t = b["start"]
    for w, x in zip(ws, wt):
        if word.lower() in w.lower(): return t
        t += b["dur"] * x / tot
    return b["start"]

def stamp(img, text, cx, cy, size, color, rot, k):
    lay = Image.new("RGBA", (W, 600), (0, 0, 0, 0)); d = ImageDraw.Draw(lay); f = F(700, int(size * k))
    tw = d.textlength(text, font=f); pad = 40 * k
    d.rounded_rectangle((W / 2 - tw / 2 - pad, 300 - size * k * 0.62, W / 2 + tw / 2 + pad, 300 + size * k * 0.62), 30, outline=color, width=int(16 * k))
    d.text((W / 2, 300), text, font=f, fill=color, anchor="mm")
    lay = lay.rotate(rot, resample=Image.BICUBIC)
    img.paste(lay, (int(cx - W / 2), int(cy - 300)), lay)

def intro(t):
    if t < B["relate"]["start"]:  # HOOK: unpopular opinion + RIGGED stamp
        img = Image.new("RGB", (W, H), INK); d = ImageDraw.Draw(img)
        d.rounded_rectangle((250, 330, 830, 430), 50, fill=SUN); tc(d, (W / 2, 380), "UNPOPULAR OPINION", F(700, 52), INK)
        tc(d, (W / 2, 620), "Savings", F(700, 150), WHITE); tc(d, (W / 2, 780), "challenges are", F(700, 110), WHITE)
        tr = word_time("hook", "rigged") - 0.05
        if t >= tr:
            k = max(0.0, 2.2 - 1.2 * ease((t - tr) / 0.18)); jit = (math.sin(t * 90) * 10 if t - tr < 0.25 else 0)
            stamp(img, "RIGGED", W / 2 + jit, 1030 + jit / 2, 190, RED, 8, k)
        tc(d, (W / 2, 1290), "against ADHD brains", F(700, 92), MINT)
        return img
    if t < B["turn"]["start"]:  # RELATE: 52-week grid, reward only at the end, QUIT at week 3
        lt = t - B["relate"]["start"]; img = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(img)
        tc(d, (W / 2, 300), "52 weeks.", F(700, 130), INK); tc(d, (W / 2, 430), "Reward at week 52.", F(600, 70), PINK)
        cs = 66; gx = (W - 13 * cs) / 2; gy = 600
        week = min(3, int(lt * 1.6) + 1)
        for i in range(52):
            x = gx + (i % 13) * cs; y = gy + (i // 13) * cs
            last = i == 51
            fill = (SUN if last else (PINK if i < week else WHITE))
            d.ellipse((x + 6, y + 6, x + cs - 6, y + cs - 6), fill=fill, outline=INK, width=4)
            if last: tc(d, (x + cs / 2, y + cs / 2 + 2), "★", F(700, 34), INK)
        tq = word_time("relate", "quit") - 0.1
        if t >= tq:
            k = max(0.0, 2.0 - 1.0 * ease((t - tq) / 0.18))
            tc(d, (W / 2, 1020), "WEEK 3", F(700, 90), INK); stamp(img, "QUIT", W / 2, 1250, 170, RED, -7, k)
        return img
    # TURN: so we turned saving into a game
    lt = t - B["turn"]["start"]; img = Image.new("RGB", (W, H), SUN); d = ImageDraw.Draw(img)
    tc(d, (W / 2, 620), "So we turned", F(700, 120), INK); tc(d, (W / 2, 770), "saving into", F(700, 120), INK)
    k = pop(lt / 0.35)
    if k > 0.05:
        d.rounded_rectangle((W / 2 - 330 * k, 870, W / 2 + 330 * k, 1080), 60, fill=INK)
        if k > 0.6: tc(d, (W / 2, 975), "a game.", F(700, int(130 * min(1, k))), SUN)
    if int(lt * 3) % 2 == 0: tc(d, (W / 2, 1220), "PRESS START", F(700, 54), INK)
    return img

HOME = Image.open(f"{D}/assets/app_home.png").convert("RGBA")
def cta(t):
    lt = t - B["cta"]["start"]; img = Image.new("RGB", (W, H), PINK); d = ImageDraw.Draw(img)
    tc(d, (W / 2, 190), "Savings Sprints", F(700, 110), INK)
    tc(d, (W / 2, 300), "12 sprints · the app · printables", F(600, 50), INK)
    k = max(0.25, pop(lt / 0.5)); pw = int(560 * k); ph = int(pw * HOME.height / HOME.width)
    frame = Image.new("RGBA", (pw + 40, ph + 40), (0, 0, 0, 0)); fd = ImageDraw.Draw(frame)
    fd.rounded_rectangle((0, 0, pw + 39, ph + 39), int(70 * k), fill=INK)
    scr = HOME.resize((pw, ph), Image.LANCZOS)
    m = Image.new("L", (pw, ph), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, pw - 1, ph - 1), int(52 * k), fill=255)
    frame.paste(scr, (20, 20), m)
    fr = frame.rotate(-4, expand=True, resample=Image.BICUBIC)
    sh = Image.new("RGBA", fr.size, (0, 0, 0, 0)); sh.paste((20, 10, 40, 110), (0, 0), fr.split()[3]); sh = sh.filter(ImageFilter.GaussianBlur(24))
    x = W / 2 - fr.width / 2; y = 380
    img.paste(sh, (int(x + 22), int(y + 30)), sh); img.paste(fr, (int(x), int(y)), fr)
    if lt > 2.0:
        d.rounded_rectangle((200, 1650, W - 200, 1790), 70, fill=SUN, outline=INK, width=8)
        tc(d, (W / 2, 1720), "link in bio", F(700, 70), INK)
    return img

def render_clip(fn, t0, t1, path):
    n = int(round((t1 - t0) * FPS))
    p = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
    for i in range(n): p.stdin.write(fn(t0 + i / FPS).tobytes())
    p.stdin.close(); p.wait()
    return n / FPS

def ass_time(t): h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f"{h}:{m:02d}:{s:05.2f}"
def write_ass(path):
    words = []
    for b in T["beats"]:
        ws = b["text"].split(); wt = [len(w) + 2 for w in ws]; tot = sum(wt); t = b["start"]
        for w, x in zip(ws, wt):
            d = b["dur"] * x / tot; words.append((b["id"], w, t, t + d)); t += d
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Fredoka,86,&H00FFFFFF,&H00FFFFFF,&H002E1B1F,&H00000000,-1,0,0,0,100,100,0,0,1,9,0,2,60,60,250,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    by = {}
    for w in words: by.setdefault(w[0], []).append(w)
    for bid, ws in by.items():
        if bid == "cta": continue   # CTA scene carries its own text
        for ci in range(0, len(ws), 3):
            chunk = ws[ci:ci + 3]
            for k, (b_, w, s_, e_) in enumerate(chunk):
                end = chunk[k + 1][2] if k + 1 < len(chunk) else e_ + 0.15
                parts = []
                for j, c in enumerate(chunk):
                    txt = c[1].replace("{", "").replace("}", "")
                    if j == k: parts.append(r"{\c&H3FD2FF&\fscx108\fscy108}" + txt + r"{\c&HFFFFFF&\fscx100\fscy100}")
                    elif j < k: parts.append(txt)
                    else: parts.append(r"{\alpha&H70&}" + txt + r"{\alpha&H00&}")
                ev.append([s_, end, ' '.join(parts)])
    ev.sort(key=lambda e: e[0])
    for i in range(len(ev) - 1): ev[i][1] = min(ev[i][1], ev[i + 1][0])   # never two caption lines at once
    lines = [f"Dialogue: 0,{ass_time(s)},{ass_time(e)},Cap,,0,0,0,,{txt}" for s, e, txt in ev]
    open(path, "w").write(head + "\n".join(lines) + "\n")

if __name__ == "__main__":
    a = B["demo1"]["start"]; b = B["cta"]["start"]
    d1 = render_clip(intro, 0, a, f"{D}/part1.mp4")
    clip_len = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{D}/app_clip.mp4"]).decode())
    need = b - a
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{D}/app_clip.mp4", "-vf", f"tpad=stop_mode=clone:stop_duration=2,trim=duration={need:.3f},setpts=PTS-STARTPTS",
                    "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", "-r", "30", f"{D}/part2.mp4"], check=True)
    d3 = render_clip(cta, b, END, f"{D}/part3.mp4")
    open(f"{D}/concat.txt", "w").write("".join(f"file '{os.path.abspath(D)}/part{i}.mp4'\n" for i in (1, 2, 3)))
    write_ass(f"{D}/captions.ass")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{D}/concat.txt", "-i", f"{D}/vo.wav",
                    "-vf", f"subtitles={D}/captions.ass:fontsdir={FONTS}", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "160k", "-af", "apad", "-t", f"{END:.2f}", "-movflags", "+faststart", f"{D}/video.mp4"], check=True)
    print("done", f"{D}/video.mp4", round(END, 2), "app clip", round(clip_len, 2), "needed", round(need, 2))
