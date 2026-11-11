"""Savings Sprints generator: 12 color-in savings challenges for ADHD brains.
Each tracker = an illustrated silhouette filled with bubbles whose amounts sum exactly to the goal.
Outputs src/sprints.html (Letter) and src/sprints_a6.html (A6 cash-binder size); PDF via Chromium."""
import json, math, random
from PIL import Image, ImageDraw

INK="#1f1b2e"; CREAM="#fff8f0"
PAL={"pink":"#ff5fa2","sun":"#ffd23f","mint":"#3ddc97","sky":"#4cc9f0","grape":"#7b61ff","tang":"#ff8c42"}

# ---------- silhouettes: one primitive list -> PIL mask (bubble placement) + SVG (drawn shape) ----------
SH={
 "battery":[("rrect",(230,190,770,940),80),("rrect",(400,90,600,210),30)],
 "boba":[("poly",[(250,360),(750,360),(680,950),(320,950)]),("ellipse",(230,230,770,470)),("rrect",(540,40,600,300),20)],
 "heart":[("ellipse",(110,170,530,590)),("ellipse",(470,170,890,590)),("poly",[(132,450),(868,450),(500,930)])],
 "plant":[("poly",[(290,620),(710,620),(650,960),(350,960)]),("rrect",(260,580,740,660),20),("ellipse",(150,220,500,580)),("ellipse",(500,160,850,520)),("ellipse",(330,40,670,420))],
 "controller":[("rrect",(110,320,890,700),180),("ellipse",(80,470,410,880)),("ellipse",(590,470,920,880))],
 "star":[("poly",[(500+(470 if i%2==0 else 210)*math.cos(-math.pi/2+i*math.pi/5),540+(470 if i%2==0 else 210)*math.sin(-math.pi/2+i*math.pi/5)) for i in range(10)])],
 "bag":[("poly",[(170,330),(830,330),(890,950),(110,950)]),("ellipse",(330,90,670,430)),("hole",(400,160,600,360))],
 "cassette":[("rrect",(70,200,930,820),60),("hole",(215,330,385,500)),("hole",(615,330,785,500))],
 "gift":[("rect",(150,430,850,950)),("rrect",(100,300,900,450),20),("ellipse",(250,120,500,350)),("ellipse",(500,120,750,350))],
 "house":[("poly",[(500,70),(940,470),(60,470)]),("rect",(160,440,840,950))],
 "jar":[("rrect",(210,260,790,960),100),("rrect",(270,110,730,270),34)],
}
def draw_mask(name):
    im=Image.new("L",(1000,1000),0); d=ImageDraw.Draw(im)
    for pr in SH[name]:
        k=pr[0]
        if k=="poly": d.polygon(pr[1],fill=255)
        elif k=="ellipse": d.ellipse(pr[1],fill=255)
        elif k=="rect": d.rectangle(pr[1],fill=255)
        elif k=="rrect": d.rounded_rectangle(pr[1],pr[2],fill=255)
    for pr in SH[name]:
        if pr[0]=="hole": x0,y0,x1,y1=pr[1]; d.ellipse((x0-40,y0-40,x1+40,y1+40),fill=0)
    return im
def shape_svg(name, fill, stroke, sw):
    def el(pr, extra):
        k=pr[0]
        if k=="poly": return f'<polygon points="{" ".join(f"{x:.0f},{y:.0f}" for x,y in pr[1])}" {extra}/>'
        x0,y0,x1,y1=pr[1]
        if k=="ellipse": return f'<ellipse cx="{(x0+x1)/2}" cy="{(y0+y1)/2}" rx="{(x1-x0)/2}" ry="{(y1-y0)/2}" {extra}/>'
        r=pr[2] if k=="rrect" else 0
        return f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" rx="{r}" {extra}/>'
    # union outline trick: all shapes stroked wide first, then all filled on top
    solid=[pr for pr in SH[name] if pr[0]!="hole"]; holes=[("ellipse",pr[1]) for pr in SH[name] if pr[0]=="hole"]
    return ("".join(el(pr,f'fill="{stroke}" stroke="{stroke}" stroke-width="{sw*2}" stroke-linejoin="round"') for pr in solid)
            + "".join(el(pr,f'fill="{fill}"') for pr in solid)
            + "".join(el(pr,f'fill="#fff8f0" stroke="{stroke}" stroke-width="{sw}"') for pr in holes))

def bubbles(name, n_target, rmin=0.4):
    """pick a hex grid spacing so ~n_target cell centers fall inside the mask (inset so bubbles clear the outline)"""
    from PIL import ImageFilter
    im=draw_mask(name).filter(ImageFilter.MinFilter(41)); px=im.load()
    best=None
    for step in range(30,160,2):
        pts=[]; row=0; y=step/2
        while y<1000:
            x=step/2+(step/2 if row%2 else 0)
            while x<1000:
                r=step*0.42
                ok=all(0<=x+dx<1000 and 0<=y+dy<1000 and px[int(x+dx),int(y+dy)]>0 for dx,dy in [(0,0),(r,0),(-r,0),(0,r),(0,-r)])
                if ok: pts.append((x,y))
                x+=step
            y+=step*0.866; row+=1
        if best is None or abs(len(pts)-n_target)<abs(len(best[1])-n_target): best=(step,pts)
        if len(pts)<n_target: break
    return best

def split_amount(total, n, seed, unit=5):
    """n friendly amounts (multiples of unit) summing exactly to total"""
    rnd=random.Random(seed); units=total//unit
    cuts=sorted(rnd.sample(range(1,units),n-1)); parts=[b-a for a,b in zip([0]+cuts,cuts+[units])]
    # smooth extremes so no bubble is huge
    parts.sort(); 
    while parts[-1]>3*units/n and parts[0]<units/n:
        parts[-1]-=1; parts[0]+=1; parts.sort()
    rnd.shuffle(parts); return [p*unit for p in parts]

SPRINTS=[
 dict(id="s01",name="Weekend Warm-Up",goal=50,days="7-day sprint",shape="battery",color="mint",n=10,unit=5,tag="Start here",note="Recharge your savings battery. 10 tiny deposits."),
 dict(id="s02",name="Boba Fund",goal=100,days="7-day sprint",shape="boba",color="pink",n=20,unit=5,tag="Treat yourself, later",note="Every bubble is a drink you didn't buy today."),
 dict(id="s03",name="No-Spend Week",goal=0,days="7-day sprint",shape=None,color="sun",n=7,unit=0,tag="No money needed",note="Color a day each time you buy nothing extra."),
 dict(id="s04",name="Payday to Payday",goal=250,days="14-day sprint",shape="heart",color="pink",n=25,unit=5,tag="Fits a 2-week paycheck",note="Save between two paydays. Done before the next one lands."),
 dict(id="s05",name="Level Up",goal=300,days="14-day sprint",shape="controller",color="grape",n=30,unit=5,tag="Gamer favourite",note="30 bubbles. Every one is XP."),
 dict(id="s06",name="Holiday Gift Fund",goal=300,days="30-day sprint",shape="gift",color="tang",n=30,unit=5,tag="Seasonal",note="Pay for gifts with cash you already saved, not a credit card."),
 dict(id="s07",name="Mystery Sprint",goal=200,days="14-day sprint",shape="star",color="sun",n=20,unit=5,tag="Roll a die to pick",note="Can't choose? Roll a die, count that many bubbles, save that one."),
 dict(id="s08",name="Grow It",goal=500,days="30-day sprint",shape="plant",color="mint",n=40,unit=5,tag="Watch it grow",note="Your plant fills up as your savings do."),
 dict(id="s09",name="Guilt-Free Haul",goal=150,days="14-day sprint",shape="bag",color="sky",n=24,unit=5,tag="Name the goal",note="Save first, then buy the thing with zero guilt. Write what it's for on the line."),
 dict(id="s10",name="Mixtape",goal=400,days="30-day sprint",shape="cassette",color="grape",n=40,unit=5,tag="Side A / Side B",note="Fill Side A in two weeks, Side B in two more."),
 dict(id="s11",name="Moving Out",goal=1000,days="30-day sprint",shape="house",color="sky",n=50,unit=10,tag="Big goal",note="Deposit, first month, moving van. 50 bubbles."),
 dict(id="s12",name="Emergency Starter",goal=1000,days="30-day sprint",shape="jar",color="tang",n=50,unit=10,tag="Peace of mind",note="Your first $1,000 cushion, so one surprise doesn't wreck everything."),
]

def tracker_svg(s, w=640, h=640):
    col=PAL[s["color"]]
    if s["shape"] is None:  # No-Spend Week: 7 big day circles in a ring
        out=[f'<svg viewBox="0 0 1000 1000" width="{w}" height="{h}" xmlns="http://www.w3.org/2000/svg">']
        out.append(f'<circle cx="500" cy="500" r="430" fill="{col}" opacity=".18"/>')
        for i,dname in enumerate(["MON","TUE","WED","THU","FRI","SAT","SUN"]):
            a=-math.pi/2+i*2*math.pi/7; x=500+300*math.cos(a); y=500+300*math.sin(a)
            out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="105" fill="#fff" stroke="{INK}" stroke-width="7"/><text x="{x:.0f}" y="{y+16:.0f}" text-anchor="middle" font-family="Fredoka,Inter,sans-serif" font-weight="700" font-size="52" fill="{INK}">{dname}</text>')
        out.append(f'<text x="500" y="520" text-anchor="middle" font-family="Fredoka,Inter,sans-serif" font-weight="700" font-size="64" fill="{INK}">$0</text></svg>')
        return "".join(out)
    step,pts=bubbles(s["shape"],s["n"])
    amts=split_amount(s["goal"],len(pts),seed=s["id"],unit=s["unit"])
    assert sum(amts)==s["goal"], (s["id"],sum(amts))
    s["geom"]={"step":step,"pts":[[round(x,1),round(y,1)] for x,y in pts]}
    r=step*0.43; fs=max(18,int(r*0.66))
    out=[f'<svg viewBox="0 0 1000 1000" width="{w}" height="{h}" xmlns="http://www.w3.org/2000/svg">']
    out.append(shape_svg(s["shape"], col, INK, 14))
    for (x,y),a in zip(pts,amts):
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="#fff" stroke="{INK}" stroke-width="{max(3.5,r*0.1):.1f}"/>')
        out.append(f'<text x="{x:.1f}" y="{y+fs*0.36:.1f}" text-anchor="middle" font-family="Fredoka,Inter,sans-serif" font-weight="600" font-size="{fs}" fill="{INK}">{a}</text>')
    out.append("</svg>"); s["amounts"]=amts; s["cells"]=len(pts)
    return "".join(out)

def page_tracker(s, n):
    col=PAL[s["color"]]; art=tracker_svg(s)
    total = "No money needed" if s["goal"]==0 else f"${s['goal']:,}"
    return f'''<section class="page tracker" style="--c:{col}">
  <header><span class="num">Sprint {n:02d}</span><span class="tag">{s["tag"]}</span></header>
  <h2>{s["name"]}</h2>
  <div class="meta"><b>{total}</b><span>{s["days"]}</span><span>{s.get("cells", 7)} bubbles</span></div>
  <div class="art">{art}</div>
  <p class="note">{s["note"]}</p>
  <div class="rows"><div>Started <i></i></div><div>Finished <i></i></div><div>Reward when I finish <i></i></div></div>
  <div class="ladder"><span>25% · tiny treat</span><span>50% · tell a friend</span><span>75% · free fun</span><span>100% · your reward</span></div>
  <footer>Savings Sprints · color a bubble every time you save that amount</footer>
</section>'''

CSS=open("src/style.css").read()
def build(size):
    trackers="".join(page_tracker(s,i+1) for i,s in enumerate(SPRINTS))
    intro=open("src/intro.html").read()
    html=f'<!doctype html><html><head><meta charset="utf-8"><title>Savings Sprints</title><style>{CSS}</style><style>@page{{size:{"Letter" if size=="letter" else "105mm 148mm"};margin:0}}</style></head><body class="{size}">{intro}{trackers}{open("src/outro.html").read()}</body></html>'
    open(f"src/sprints{'' if size=='letter' else '_a6'}.html","w").write(html)
build("letter"); build("a6")
json.dump([dict(s) for s in SPRINTS],open("src/sprints.json","w"),indent=1)
print("ok", [(s["id"],s.get("cells"),sum(s.get("amounts",[0]))) for s in SPRINTS])
