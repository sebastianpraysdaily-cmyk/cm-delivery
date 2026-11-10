"""Tunnel Vision Keepsakes: turn one paid order into finished, verified files with no human in the loop.

  python3 fulfill.py order.json [out_dir]

Order JSON (what the checkout form collects):
{
  "order_id": "TV-1001",
  "tier": "print" | "film" | "collection",
  "items": [                                  # 1 item for print/film, up to 3 for collection
    {"relationship": "mum" | "dad" | "grandma",
     "name": "Mum",                           # how they appear in your phone, max 20 chars
     "theme": "light" | "dark",               # optional
     "messages": [{"from": "them" | "you", "text": "did you eat today?"}, ...],   # 1-4, max 90 chars each
     "reveal": ["I know why you always ask.", "Yes, I ate.", "I love you too."]}   # 1-3 lines, max 70 chars each
  ]
}

Deliverables per tier (all automatic):
  print       8x10 keepsake print (PNG, 300 dpi) + 4:5 phone/social version
  film        everything in print + 15 s animated film (9:16) + square 1:1 film
  collection  film deliverables for up to 3 people + a keepsake book (PDF)
Every film is ffprobe-verified; the order folder gets a manifest with sha256 for each file.
"""
import datetime
import hashlib
import html
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.join(os.path.dirname(HERE), "engine")
sys.path.insert(0, ENGINE)
import art  # noqa: E402
import audio  # noqa: E402
from build import card_times  # noqa: E402

PRESETS = {
    "mum": {"scene": 1, "theme": "light", "avatar": ["#a6abb6", "#868b96"],
            "audio": {"chimes": ["marimba2", "glass"], "send": [380, 1080], "piano": 220.0,
                      "music": {"root": 261.63, "bpm": 100, "inst": "ks", "prog": [[0, 4, 7, 12], [9, 12, 16, 21], [5, 9, 12, 17], [7, 11, 14, 19]]}}},
    "dad": {"scene": 3, "theme": "dark", "avatar": ["#8fa7c9", "#5f7aa3"],
            "audio": {"chimes": ["bell"], "send": [360, 980], "piano": 261.63,
                      "music": {"root": 196.0, "bpm": 108, "inst": "ks", "prog": [[0, 4, 7, 12], [5, 9, 12, 17], [9, 12, 16, 21], [7, 11, 14, 19]]}}},
    "grandma": {"scene": 8, "theme": "light", "avatar": ["#d9b38c", "#b88b5f"],
                "audio": {"chimes": ["soft2"], "send": [400, 1000], "piano": 293.66,
                          "music": {"root": 293.66, "bpm": 100, "inst": "marimba", "prog": [[0, 4, 7, 12], [5, 9, 12, 17], [0, 4, 7, 12], [7, 11, 14, 19]]}}},
}
TIERS = {"print": 1, "film": 1, "collection": 3}
CUT, END = 5.5, 15.0


class OrderError(ValueError):
    pass


def validate(order):
    tier = order.get("tier")
    if tier not in TIERS:
        raise OrderError(f"unknown tier {tier!r}")
    items = order.get("items") or []
    if not 1 <= len(items) <= TIERS[tier]:
        raise OrderError(f"{tier} takes 1-{TIERS[tier]} people, got {len(items)}")
    for it in items:
        if it.get("relationship") not in PRESETS:
            raise OrderError(f"relationship must be one of {sorted(PRESETS)}")
        if not 1 <= len(it.get("name", "")) <= 20:
            raise OrderError("name must be 1-20 characters")
        msgs = it.get("messages") or []
        if not 1 <= len(msgs) <= 4 or any(m.get("from") not in ("them", "you") or not 1 <= len(m.get("text", "")) <= 90 for m in msgs):
            raise OrderError("1-4 messages, each from 'them' or 'you', 1-90 characters")
        rev = it.get("reveal") or []
        if not 1 <= len(rev) <= 3 or any(not 1 <= len(r) <= 70 for r in rev):
            raise OrderError("1-3 message lines, each 1-70 characters")
    if not str(order.get("order_id", "")).replace("-", "").isalnum():
        raise OrderError("order_id must be letters, digits and dashes")


def esc(s):
    return html.escape(s, quote=False)


def schedule(messages):
    """Lay the thread out inside the 5.5 s phone part: dots before their texts, typing before yours."""
    ev, t = [], 0.25
    first = messages[0]
    if first["from"] == "them":
        ev += [{"t": "dots", "from": -1, "to": 0.25}, {"t": "msg", "side": "in", "text": esc(first["text"]), "at": 0.25}]
    else:
        ev += [{"t": "msg", "side": "out", "text": esc(first["text"]), "at": 0.25}]
    t = 0.75
    last_out = 0.25 if first["from"] == "you" else None
    for m in messages[1:]:
        if m["from"] == "you":
            dur = min(1.3, max(0.45, 0.055 * len(m["text"])))
            ev.append({"t": "type", "text": esc(m["text"]), "from": t, "to": t + dur})
            ev.append({"t": "msg", "side": "out", "text": esc(m["text"]), "at": t + dur + 0.15})
            last_out = t + dur + 0.15
            t = last_out + 0.45
        else:
            ev.append({"t": "dots", "from": t, "to": t + 0.8})
            ev.append({"t": "msg", "side": "in", "text": esc(m["text"]), "at": t + 0.8})
            t += 1.2
    limit = CUT - 0.3
    if t > limit:  # compress everything after the first message to fit
        k = (limit - 0.75) / (t - 0.75)
        for e in ev:
            for key in ("from", "to", "at"):
                if key in e and e[key] > 0.75:
                    e[key] = round(0.75 + (e[key] - 0.75) * k, 3)
        last_out = None if last_out is None else 0.75 + (last_out - 0.75) * k if last_out > 0.75 else last_out
    if last_out is not None:
        idx = max(i for i, e in enumerate(ev) if e["t"] == "msg" and e["side"] == "out")
        ev.insert(idx + 1, {"t": "receipt", "text": "<b>Read</b> 9:42 PM", "at": round(min(last_out + 0.45, CUT - 0.2), 3)})
    return [{"t": "stamp", "text": "<b>Today</b> 9:41 PM", "at": -1}] + ev


def film_config(it, n):
    p = PRESETS[it["relationship"]]
    return {"no": 100 + n, "slug": "keepsake", "contact": esc(it["name"]), "initial": esc(it["name"][0].upper()),
            "avatar": p["avatar"], "theme": it.get("theme", p["theme"]), "clock": "9:41", "battery": 0.8,
            "events": schedule(it["messages"]), "cut": CUT, "end": END,
            "cards": card_times([esc(r) for r in it["reveal"]], CUT + 0.5, END), "audio": p["audio"]}


def run(*a):
    subprocess.run(a, check=True)


def probe_ok(mp4):
    q = lambda *x: subprocess.run(["ffprobe", "-v", "error", *x, "-of", "csv=p=0", mp4], check=True, capture_output=True, text=True).stdout.strip()
    assert q("-select_streams", "v:0", "-show_entries", "stream=width,height") in ("1080,1920", "1080,1080")
    assert q("-select_streams", "a:0", "-show_entries", "stream=codec_type") == "audio"
    assert abs(float(q("-show_entries", "format=duration")) - END) <= 0.1
    run("ffmpeg", "-v", "error", "-i", mp4, "-f", "null", "-")


def make_film(it, n, work, out, base):
    cfg = film_config(it, n)
    page = open(os.path.join(ENGINE, "template.html")).read()
    page = page.replace("__SVG__", art.SCENES[PRESETS[it["relationship"]]["scene"]]()).replace("__CFG__", json.dumps(cfg))
    pg = os.path.join(work, f"film{n}.html")
    open(pg, "w").write(page)
    wav = os.path.join(work, f"film{n}.wav")
    audio.build(cfg, wav)
    v = os.path.join(out, base + "-film-vertical.mp4")
    run("node", os.path.join(ENGINE, "render.js"), pg, wav, v, "30", str(END))
    sq = os.path.join(out, base + "-film-square.mp4")
    run("ffmpeg", "-v", "error", "-y", "-i", v, "-filter_complex",
        "[0:v]scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,boxblur=30:2,eq=brightness=-0.15[bg];"
        "[0:v]scale=-2:1080[fg];[bg][fg]overlay=(W-w)/2:0", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "copy", "-movflags", "+faststart", sq)
    for f in (v, sq):
        probe_ok(f)
    return [v, sq]


def make_print(it, n, work, out, base):
    o = {"name": it["name"], "messages": it["messages"], "reveal": it["reveal"], "stamp": "Today 9:41 PM",
         "receipt": "9:42 PM" if any(m["from"] == "you" for m in it["messages"]) else "",
         "date": datetime.date.today().strftime("%B %Y")}
    page = open(os.path.join(HERE, "print_template.html")).read()
    page = page.replace("__SVG__", art.SCENES[PRESETS[it["relationship"]]["scene"]]()).replace("__ORDER__", json.dumps(o))
    pg = os.path.join(work, f"print{n}.html")
    open(pg, "w").write(page)
    big = os.path.join(out, base + "-print-8x10.png")
    run("node", os.path.join(HERE, "shoot.js"), pg, big, "2400", "3000")
    soc = os.path.join(out, base + "-print-4x5-phone.jpg")
    run("ffmpeg", "-v", "error", "-y", "-i", big, "-vf", "scale=1080:1350", "-q:v", "2", soc)
    return [big, soc]


def make_book(order, prints, out):
    from reportlab.lib.units import inch
    from reportlab.pdfgen import canvas
    path = os.path.join(out, f"{order['order_id']}-keepsake-book.pdf")
    c = canvas.Canvas(path, pagesize=(8 * inch, 10 * inch))
    c.setFillColorRGB(.957, .929, .89)
    c.rect(0, 0, 8 * inch, 10 * inch, fill=1, stroke=0)
    c.setFillColorRGB(.17, .14, .125)
    c.setFont("Times-Italic", 26)
    c.drawCentredString(4 * inch, 6.2 * inch, "The texts we kept")
    c.setFont("Times-Roman", 15)
    names = ", ".join(i["name"] for i in order["items"])
    c.drawCentredString(4 * inch, 5.7 * inch, f"for {names}")
    c.setFont("Helvetica", 9)
    c.drawCentredString(4 * inch, 0.6 * inch, "TUNNEL VISION")
    c.showPage()
    for p in prints:
        c.drawImage(p, 0, 0, 8 * inch, 10 * inch)
        c.showPage()
    c.setFont("Times-Italic", 18)
    c.drawCentredString(4 * inch, 6 * inch, "Send one more text today.")
    c.setFont("Times-Roman", 12)
    c.drawCentredString(4 * inch, 5.6 * inch, "The short ones mean more than they look.")
    c.showPage()
    c.save()
    return path


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def fulfill(order, out_root):
    validate(order)
    out = os.path.join(out_root, order["order_id"])
    if os.path.exists(out):
        raise OrderError(f"{out} exists; finished orders are never overwritten")
    work = os.path.join(out_root, "_work", order["order_id"])
    os.makedirs(work, exist_ok=True)
    os.makedirs(out)
    files = []
    prints = []
    for n, it in enumerate(order["items"], 1):
        base = f"{order['order_id']}-{n}-{it['relationship']}"
        pr = make_print(it, n, work, out, base)
        prints.append(pr[0])
        files += pr
        if order["tier"] in ("film", "collection"):
            files += make_film(it, n, work, out, base)
    if order["tier"] == "collection":
        files.append(make_book(order, prints, out))
    shutil.copy(os.path.join(HERE, "customer_guide.txt"), os.path.join(out, "READ-ME-FIRST.txt"))
    man = {"order_id": order["order_id"], "tier": order["tier"],
           "created_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
           "files": [{"name": os.path.basename(f), "bytes": os.path.getsize(f), "sha256": sha(f)} for f in files]}
    json.dump(man, open(os.path.join(out, "manifest.json"), "w"), indent=1)
    shutil.rmtree(work)
    return out, man


if __name__ == "__main__":
    o = json.load(open(sys.argv[1]))
    root = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.dirname(HERE)), "orders")
    d, m = fulfill(o, root)
    print("OK", d, len(m["files"]), "files")
