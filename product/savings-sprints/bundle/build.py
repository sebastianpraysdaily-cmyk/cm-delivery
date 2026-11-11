"""Savings Sprints Mega Bundle generator.
Built from demand data (ops/step2d-what-people-buy.md): buyers want coverage (every amount, timeframe and goal),
clean printable pages, Letter + A6. Every page's cells sum exactly to its goal (asserted).
Output: bundle/out/bundle.html (Letter) + bundle_a6.html -> PDFs via Chromium."""
import json, os, random, math, base64, io, re
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = HERE + "/.."
ACC = ["#ff5fa2", "#ffd23f", "#3ddc97", "#4cc9f0", "#7b61ff", "#ff8c42"]
SOFT = {"#ff5fa2": "#ffe3ee", "#ffd23f": "#fff4cc", "#3ddc97": "#dcf8ec", "#4cc9f0": "#dcf3fc", "#7b61ff": "#e8e3ff", "#ff8c42": "#ffe8d6"}

def icon_uri(name):
    p = f"{HERE}/icons/{name}.jpg"
    if not os.path.exists(p): return ""
    im = Image.open(p).convert("L")
    # crop to the drawing, make background transparent via alpha from darkness
    bbox = Image.eval(im, lambda v: 255 if v < 200 else 0).getbbox()
    if bbox: im = im.crop((max(0, bbox[0] - 10), max(0, bbox[1] - 10), bbox[2] + 10, bbox[3] + 10))
    im.thumbnail((260, 260))
    rgba = Image.new("RGBA", im.size, (31, 27, 46, 0)); rgba.putalpha(Image.eval(im, lambda v: 255 - v))
    b = io.BytesIO(); rgba.save(b, "PNG"); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

def split(total, n, unit, seed):
    """n friendly amounts, multiples of unit, summing exactly to total, no huge outliers"""
    rnd = random.Random(seed); units = total // unit; assert units >= n and total % unit == 0, (total, n, unit)
    base = [units // n] * n
    for i in range(units - sum(base)): base[i] += 1
    for _ in range(n * 3):  # wiggle while keeping the sum and keeping every cell >= 1 unit
        i, j = rnd.randrange(n), rnd.randrange(n); d = rnd.randint(1, max(1, units // n // 2))
        if base[i] - d >= max(1, units // n // 3): base[i] -= d; base[j] += d
    rnd.shuffle(base); out = [b * unit for b in base]
    assert sum(out) == total
    return out

PAGES = []
def page(kind, title, goal, cells, sub, icon, shape="circle", labels=None, cols=None, section=""):
    assert kind == "calendar" or sum(cells) == goal, (title, sum(cells), goal)
    PAGES.append(dict(kind=kind, title=title, goal=goal, cells=cells, sub=sub, icon=icon, shape=shape, labels=labels, cols=cols, section=section))

def build_pages():
    S = "Quick sprints"
    for days, g, n, u, ic in [(7, 50, 8, 5, "coins"), (7, 100, 14, 5, "coins"), (14, 200, 20, 5, "target"), (14, 300, 24, 5, "target"), (30, 500, 30, 5, "calendar"), (30, 1000, 40, 10, "calendar")]:
        page("grid", f"{days}-Day ${g:,} Sprint", g, split(g, n, u, f"sp{g}{days}"), f"Save ${g:,} in {days} days. Color a circle each time you save that amount.", ic, "circle", section=S)
    S = "Savings challenges by amount"
    for g, n, u, sh in [(100, 15, 5, "heart"), (250, 25, 5, "circle"), (500, 40, 5, "heart"), (750, 50, 5, "star"), (1000, 50, 10, "circle"), (1500, 60, 10, "heart"), (2000, 60, 10, "star"), (2500, 70, 10, "circle"), (3000, 80, 10, "heart"), (5000, 100, 25, "circle"), (10000, 100, 50, "heart")]:
        page("grid", f"${g:,} Savings Challenge", g, split(g, n, u, f"amt{g}"), f"{n} spaces. Every amount adds up to exactly ${g:,}.", "piggy", sh, section=S)
    S = "Paycheck challenges"
    for g in (1000, 2000, 4000, 6000):
        cells = split(g, 26, 5 if g < 6000 else 10, f"pay{g}")
        page("grid", f"${g:,} in 26 Paychecks", g, cells, "Paid every 2 weeks? Save one box per paycheck. Done in a year.", "coins", "box", labels=[f"PAY {i+1}" for i in range(26)], cols=4, section=S)
    for g in (1200, 3000):
        cells = split(g, 12, 25 if g == 1200 else 50, f"mo{g}")
        page("grid", f"${g:,} in 12 Months", g, cells, "Paid monthly? One box per payday.", "calendar", "box", labels=["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"], cols=4, section=S)
    S = "Classic challenges"
    page("grid", "52-Week Challenge", 1378, list(range(1, 53)), "Week 1 save $1, week 2 save $2 ... week 52 save $52. Color any week in any order.", "calendar", "circle", section=S)
    page("grid", "Reverse 52-Week Challenge", 1378, list(range(52, 0, -1)), "Start big while you're motivated, finish small in December.", "calendar", "heart", section=S)
    page("grid", "26-Week $1,000 Challenge", 1000, split(1000, 26, 5, "w26"), "Half a year, one thousand dollars.", "target", "box", labels=[f"WK {i+1}" for i in range(26)], cols=5, section=S)
    page("grid", "100 Envelope Challenge", 5050, list(range(1, 101)), "Pick an envelope, save that number, color it. All 100 = $5,050.", "envelope", "envelope", section=S)
    page("grid", "50 Envelope Challenge", 1275, list(range(1, 51)), "The half-size version. All 50 = $1,275.", "envelope", "envelope", section=S)
    page("grid", "25 Envelope Challenge", 325, list(range(1, 26)), "A quick win. All 25 = $325.", "envelope", "envelope", section=S)
    page("grid", "30-Day $1 to $30 Challenge", 465, list(range(1, 31)), "Day 1 save $1 ... day 30 save $30.", "coins", "circle", labels=[f"DAY {i+1}" for i in range(30)], cols=6, section=S)
    S = "Goal funds"
    goals = [("Emergency Fund", 500, "umbrella"), ("Emergency Fund", 1000, "umbrella"), ("Emergency Fund", 2000, "umbrella"), ("Christmas Fund", 300, "tree"), ("Christmas Fund", 500, "tree"), ("Christmas Fund", 1000, "gift"),
             ("Vacation Fund", 1000, "plane"), ("Vacation Fund", 2500, "plane"), ("House Deposit", 5000, "house"), ("Car Fund", 3000, "car"), ("Wedding Fund", 5000, "ring"), ("Baby Fund", 1500, "baby"),
             ("Birthday Fund", 200, "cake"), ("Back to School", 300, "backpack"), ("Pet Fund", 500, "paw"), ("Moving Fund", 1500, "box"), ("Debt Payoff", 1000, "target"), ("Gift Fund", 400, "gift")]
    shapes = ["heart", "circle", "star"]
    for k, (name, g, ic) in enumerate(goals):
        n = 25 if g <= 300 else 40 if g <= 1000 else 50 if g <= 2500 else 60
        u = 5 if g <= 1000 else 10 if g <= 3000 else 25
        while g // u < n: n -= 5
        page("grid", f"${g:,} {name}", g, split(g, n, u, f"goal{name}{g}"), f"Name it, then save it. {n} spaces to ${g:,}.", ic, shapes[k % 3], section=S)
    S = "Monthly $500 series"
    months = [("January", "snow"), ("February", "envelope"), ("March", "flower"), ("April", "umbrella"), ("May", "flower"), ("June", "sun"), ("July", "sun"), ("August", "plane"), ("September", "backpack"), ("October", "cake"), ("November", "gift"), ("December", "tree")]
    for k, (m, ic) in enumerate(months):
        page("grid", f"{m} $500 Challenge", 500, split(500, 30, 5, f"m{m}"), f"One month, five hundred dollars. Start any day in {m}.", ic, ["circle", "heart", "star"][k % 3], section=S)
    S = "No-spend challenges"
    page("calendar", "No-Spend Month", 0, list(range(1, 32)), "Color every day you buy nothing extra. Bills and groceries don't count.", "calendar", "circle", section=S)
    page("calendar", "No-Spend Week", 0, list(range(1, 8)), "Seven days. Color a day each time you skip something you didn't need.", "target", "heart", labels=["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], cols=7, section=S)
    page("calendar", "30-Day No-Buy Challenge", 0, list(range(1, 31)), "No new clothes, gadgets or 'treats' for 30 days. Color each day you make it.", "coins", "star", section=S)

def cell_svg(shape, label, amount, color, idx):
    t = f"${amount:,}" if amount else ""
    if shape == "heart":
        body = '<path d="M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C40 8 46 14 50 22 C54 14 60 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88 Z" />'
    elif shape == "star":
        pts = " ".join(f"{50 + (49 if i % 2 == 0 else 27) * math.cos(-math.pi / 2 + i * math.pi / 5):.1f},{55 + (49 if i % 2 == 0 else 27) * math.sin(-math.pi / 2 + i * math.pi / 5):.1f}" for i in range(10))
        body = f'<polygon points="{pts}" />'
    elif shape == "box":
        body = '<rect x="6" y="10" width="88" height="80" rx="14" />'
    elif shape == "envelope":
        body = '<rect x="6" y="18" width="88" height="68" rx="8" /><polyline points="8,22 50,44 92,22" fill="none" />'
    else:
        body = '<circle cx="50" cy="50" r="42" />'
    lab = f'<text x="50" y="{34 if shape=="box" else 30}" class="lab">{label}</text>' if label else ""
    ty = 62 if shape == "box" and label else 74 if shape == "envelope" else 52 if shape == "heart" else 63 if shape == "star" else 58
    fs = 26 if len(t) <= 3 else 22 if len(t) <= 4 else 18 if len(t) <= 5 else 15
    if shape == "star": fs = int(fs * 0.72)
    if shape == "heart": fs = int(fs * 0.9)
    return f'<svg viewBox="0 0 100 100" class="cell"><g class="sh">{body}</g>{lab}<text x="50" y="{ty}" class="amt" style="font-size:{fs}px">{t}</text></svg>'

def render_page(p, n, total_pages):
    color = ACC[n % len(ACC)]; soft = SOFT[color]
    cells = p["cells"]; k = len(cells)
    cols = p["cols"] or (5 if k <= 25 else 6 if k <= 36 else 7 if k <= 49 else 8 if k <= 64 else 10)
    ic = icon_uri(p["icon"])
    icon_html = f'<img class="icon" src="{ic}" alt="">' if ic else ""
    goal = f'${p["goal"]:,}' if p["goal"] else "No money needed"
    if p["kind"] == "calendar":   # no-spend: each cell shows the day (number or weekday), nothing to pay
        def cal(i, d):
            svg = cell_svg(p["shape"], "", 0, color, i)
            txt = p["labels"][i] if p["labels"] else str(d)
            fs = (22 if len(txt) > 2 else 28) * (0.75 if p["shape"] == "star" else 1)
            return re.sub(r'<text x="50" y="(\d+)" class="amt" style="font-size:\d+px"></text>', lambda m: f'<text x="50" y="{m.group(1)}" class="amt" style="font-size:{fs:.0f}px">{txt}</text>', svg)
        grid = "".join(cal(i, d) for i, d in enumerate(cells))
    else:
        grid = "".join(cell_svg(p["shape"], (p["labels"][i] if p["labels"] else ""), a, color, i) for i, a in enumerate(cells))
    return f'''<section class="page" style="--c:{color};--soft:{soft}">
  <div class="sec">{p["section"]}</div>
  <header>{icon_html}<div><h2>{p["title"]}</h2><p class="sub">{p["sub"]}</p></div></header>
  <div class="goalrow"><span class="goal">Goal: {goal}</span><span>Saved: $ ________</span><span>For: ______________</span></div>
  <div class="grid" style="grid-template-columns:repeat({cols},1fr)">{grid}</div>
  <div class="foot"><span>Started ________</span><span>Finished ________</span><span class="pg">Savings Sprints · {n}/{total_pages}</span></div>
</section>'''

CSS = open(HERE + "/style.css").read()
def build(size):
    total = len(PAGES)
    by = {}
    for p in PAGES: by.setdefault(p["section"], []).append(p["title"])
    toc = "".join(f"<p><b>{s}</b> ({len(t)})<br>" + ", ".join(t) + "</p>" for s, t in by.items())
    front = open(HERE + "/front.html").read().replace("__N__", str(total)).replace("__TOC__", toc)
    body = front + "".join(render_page(p, i + 1, total) for i, p in enumerate(PAGES)) + open(HERE + "/back.html").read()
    pagesize = "Letter" if size == "letter" else "105mm 148mm"
    html = f'<!doctype html><html><head><meta charset="utf-8"><title>Savings Sprints Mega Bundle</title><style>{CSS}</style><style>@page{{size:{pagesize};margin:0}}</style></head><body class="{size}">{body}</body></html>'
    os.makedirs(HERE + "/out", exist_ok=True)
    open(HERE + f"/out/bundle{'' if size == 'letter' else '_a6'}.html", "w").write(html)

if __name__ == "__main__":
    build_pages()
    by = {}
    for p in PAGES: by.setdefault(p["section"], []).append(p["title"])
    json.dump([{k: v for k, v in p.items()} for p in PAGES], open(HERE + "/out/pages.json", "w"), indent=1)
    build("letter"); build("a6")
    print(len(PAGES), "challenge pages"); [print(f"  {s}: {len(t)}") for s, t in by.items()]
