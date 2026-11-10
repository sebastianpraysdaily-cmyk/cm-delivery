"""Hand-built flat 2D illustrations for Tunnel Vision reveals (SVG, 1080x1920).

Every figure is drawn in one reference frame (head centre near x=540, y=905; table/foreground
line near y=1250), then placed with a transform. The top ~700px stays dark and calm for the
reveal text. Usage: python3 art.py <video_no> <out.svg>
"""
import sys

W, H = 1080, 1920


# ------------------------------------------------------------------ helpers
def svg(defs, body, top=True):
    shade = ('<linearGradient id="topshade" x1="0" y1="0" x2="0" y2="1">'
             '<stop offset="0" stop-color="#0d0a0a" stop-opacity=".88"/>'
             '<stop offset=".30" stop-color="#0d0a0a" stop-opacity=".55"/>'
             '<stop offset=".46" stop-color="#0d0a0a" stop-opacity="0"/></linearGradient>'
             '<radialGradient id="vig" cx="540" cy="1020" r="1150" gradientUnits="userSpaceOnUse">'
             '<stop offset=".45" stop-color="#000" stop-opacity="0"/>'
             '<stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient>')
    over = '<rect width="1080" height="1920" fill="url(#vig)"/>'
    if top:
        over += '<rect width="1080" height="1920" fill="url(#topshade)"/>'
    return (f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg"><defs>{shade}{defs}</defs>'
            f'{body}{over}</svg>')


def lin(id_, stops, x2=0, y2=1):
    s = "".join(f'<stop offset="{o}" stop-color="{c}"{"" if a is None else f" stop-opacity=\"{a}\""}/>'
                for o, c, a in stops)
    return f'<linearGradient id="{id_}" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>'


def rad(id_, cx, cy, r, stops):
    s = "".join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in stops)
    return f'<radialGradient id="{id_}" cx="{cx}" cy="{cy}" r="{r}" gradientUnits="userSpaceOnUse">{s}</radialGradient>'


def glow(id_, cx, cy, r, col, a=0.45):
    return rad(id_, cx, cy, r, [(0, col, a), (.45, col, a * .35), (1, col, 0)])


def g(content, tx=0, ty=0, s=1, rot=0, rcx=540, rcy=905):
    t = f"translate({tx} {ty}) "
    if s != 1:
        t += f"translate({540*(1-s):.1f} {905*(1-s):.1f}) scale({s}) "
    if rot:
        t += f"rotate({rot} {rcx} {rcy})"
    return f'<g transform="{t.strip()}">{content}</g>'


# ------------------------------------------------------------------ figure parts (reference frame)
def shade(c, k=0.78):
    c = c.lstrip("#")
    r, gg, b = (int(c[i:i + 2], 16) for i in (0, 2, 4))
    return "#%02x%02x%02x" % (int(r * k), int(gg * k), int(b * k))


def torso(col, slump=1.0, collar="v", inner="#cdb9a2", wide=1.0):
    """Shoulders slope more as slump -> 1 (Mum). slump 0 = upright, square shoulders."""
    sy = 1040 + 28 * slump      # shoulder point height
    sx = 395 - 20 * (1 - slump) - 30 * (wide - 1)
    ex = 1080 - sx
    d = (f"M506 1002 C468 1008 {sx+33} {sy-38} {sx+9} {sy} C{sx-11} {sy+32} {sx-23} 1150 {sx-29} 1250 "
         f"L{ex+29} 1250 C{ex+23} 1150 {ex+11} {sy+32} {ex-9} {sy} C{ex-33} {sy-38} 612 1008 574 1002 Z")
    out = f'<path d="{d}" fill="{col}"/>'
    sh = shade(col)
    out += (f'<path d="M{sx+9} {sy} C{sx-15} {sy+36} {sx-27} 1170 {sx-27} 1250 L{sx+37} 1250 '
            f'C{sx+35} 1186 {sx+41} 1128 {sx+57} {sy+24} Z" fill="{sh}" opacity=".85"/>')
    out += (f'<path d="M{ex-9} {sy} C{ex+15} {sy+36} {ex+27} 1170 {ex+27} 1250 L{ex-37} 1250 '
            f'C{ex-35} 1186 {ex-41} 1128 {ex-57} {sy+24} Z" fill="{sh}" opacity=".85"/>')
    if collar == "v":
        out += (f'<path d="M514 1004 L540 1090 L566 1004 Z" fill="{inner}"/>'
                f'<path d="M514 1004 L540 1090 L566 1004" fill="none" stroke="{shade(col,.65)}" stroke-width="5"/>')
    elif collar == "crew":
        out += f'<path d="M506 1004 Q540 1036 574 1004" fill="none" stroke="{shade(col,.65)}" stroke-width="7"/>'
    elif collar == "shirt":
        out += (f'<path d="M508 1000 L540 1060 L572 1000 Z" fill="{inner}"/>'
                f'<path d="M506 1000 L528 1052 L500 1046 Z M574 1000 L552 1052 L580 1046 Z" fill="#f2efe8"/>')
    elif collar == "hood":
        out += (f'<path d="M470 1010 Q540 1060 610 1010" fill="none" stroke="{shade(col,.6)}" stroke-width="16"/>'
                f'<path d="M528 1040 l-6 70 M552 1040 l6 70" stroke="#e8e2d6" stroke-width="5"/>')
    return out


def neck(skin):
    return f'<path d="M516 980 L564 980 L566 1010 Q540 1022 514 1010 Z" fill="{shade(skin,.86)}"/>'


def head_shape(skin):
    ear = shade(skin, .93)
    return (f'<ellipse cx="444" cy="932" rx="13" ry="22" fill="{ear}"/>'
            f'<ellipse cx="636" cy="932" rx="13" ry="22" fill="{ear}"/>'
            f'<ellipse cx="540" cy="910" rx="97" ry="112" fill="{skin}"/>')


def hair_back(style, col):
    if style == "bun" or style == "greybun":
        return f'<circle cx="540" cy="786" r="44" fill="{col}"/>'
    if style == "long":
        return (f'<path d="M436 900 C420 1000 410 1100 420 1180 L500 1150 L500 960 Z" fill="{col}"/>'
                f'<path d="M644 900 C660 1000 670 1100 660 1180 L580 1150 L580 960 Z" fill="{col}"/>')
    if style == "curly":
        return "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{col}"/>' for x, y, r in
                       [(450, 900, 46), (630, 900, 46), (445, 960, 38), (635, 960, 38), (460, 1010, 30), (620, 1010, 30)])
    if style == "hood":
        return f'<path d="M418 960 C410 830 470 760 540 758 C610 760 670 830 662 960 L670 1050 L410 1050 Z" fill="{col}"/>'
    return ""


def hair_front(style, col, bow=True, hi=None):
    hb = 872 if bow else 846
    hi = hi or shade(col, 1.25)
    if style in ("bun", "greybun", "long", "bob"):
        d = (f"M440 930 C430 840 472 792 540 790 C608 792 650 840 640 930 C632 {hb+30} 620 {hb+12} 600 {hb+4} "
             f"C574 {hb-4} 506 {hb-4} 480 {hb+4} C460 {hb+12} 448 {hb+30} 440 930 Z")
        out = f'<path d="{d}" fill="{col}"/>'
        if style == "bob":
            out += (f'<path d="M440 930 C436 980 440 1010 452 1020 L470 1018 C462 990 458 950 462 905 Z" fill="{col}"/>'
                    f'<path d="M640 930 C644 980 640 1010 628 1020 L610 1018 C618 990 622 950 618 905 Z" fill="{col}"/>')
        if style == "long":
            out += (f'<path d="M440 930 C434 990 438 1030 446 1060 L476 1056 C466 1010 460 960 464 905 Z" fill="{col}"/>'
                    f'<path d="M640 930 C646 990 642 1030 634 1060 L604 1056 C614 1010 620 960 616 905 Z" fill="{col}"/>')
        out += (f'<g stroke="{hi}" stroke-width="3" fill="none" opacity=".5"><path d="M500 806 C478 826 466 852 462 884"/>'
                f'<path d="M580 806 C602 826 614 852 618 884"/><path d="M540 794 C536 820 534 846 532 {hb}"/></g>')
        return out
    if style == "short":
        d = (f"M444 920 C436 836 476 796 540 794 C604 796 644 836 636 920 C630 {hb+12} 616 {hb-4} 596 {hb-10} "
             f"C566 {hb-18} 514 {hb-18} 484 {hb-10} C464 {hb-4} 450 {hb+12} 444 920 Z")
        return (f'<path d="{d}" fill="{col}"/>'
                f'<path d="M470 830 C500 810 580 810 610 830" stroke="{hi}" stroke-width="3" fill="none" opacity=".4"/>')
    if style == "curly":
        return "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{col}"/>' for x, y, r in
                       [(470, 836, 40), (520, 812, 42), (570, 812, 42), (615, 840, 38), (452, 876, 30), (630, 878, 30),
                        (495, 848, 30), (585, 848, 30), (540, 836, 32)])
    if style == "hood":
        return (f'<path d="M418 960 C410 830 470 760 540 758 C610 760 670 830 662 960 C650 900 620 850 540 846 '
                f'C460 850 430 900 418 960 Z" fill="{col}"/>'
                f'<path d="M480 870 C500 852 580 852 600 870 L596 884 C570 872 510 872 484 884 Z" fill="#3a2a22"/>')
    return ""


def face(expr, bow=True, skin="#d8a78b", tears=False, blush=.18, glasses=False, beard=None):
    o = 0 if bow else -26
    by, ey, ny, my = 908 + o, 940 + o, 946 + o, 994 + o
    line = "#3f2d28"
    brow = "#5d4a42"
    lip = "#8a5244"
    ss = shade(skin, .82)
    out = '<g fill="none" stroke-linecap="round" stroke-linejoin="round">'
    brows = {
        "sad": (f"M474 {by+8} Q494 {by+4} 516 {by-6}", f"M606 {by+8} Q586 {by+4} 564 {by-6}"),
        "worried": (f"M474 {by+12} Q496 {by+6} 518 {by-12}", f"M606 {by+12} Q584 {by+6} 562 {by-12}"),
        "neutral": (f"M474 {by+2} Q495 {by-6} 516 {by}", f"M606 {by+2} Q585 {by-6} 564 {by}"),
        "raised": (f"M474 {by-2} Q495 {by-16} 516 {by-6}", f"M606 {by-2} Q585 {by-16} 564 {by-6}"),
    }
    eb, mo, ex = {
        "sad": ("sad", "frown", "down"), "proud": ("raised", "bigsmile", "happy"),
        "cry": ("worried", "wobble", "squeeze"), "wistful": ("raised", "soft", "half"),
        "kind": ("neutral", "smile", "openhappy"), "embarrassed": ("sad", "flat", "aside"),
        "talk": ("raised", "talk", "happy"), "tired": ("sad", "flat", "half"),
        "hurt": ("worried", "pressed", "open"), "smile": ("neutral", "smile", "happy"),
    }[expr]
    for p in brows[eb]:
        out += f'<path d="{p}" stroke="{brow}" stroke-width="7"/>'
    L, R = 497, 583
    if ex == "down":
        for c in (L, R):
            out += f'<path d="M{c-17} {ey} Q{c} {ey+11} {c+17} {ey}" stroke="{line}" stroke-width="5.5"/>'
    elif ex in ("happy", "openhappy"):
        for c in (L, R):
            out += f'<path d="M{c-17} {ey+4} Q{c} {ey-10} {c+17} {ey+4}" stroke="{line}" stroke-width="5.5"/>'
            out += f'<path d="M{c+14} {ey+12} q6 4 10 0" stroke="{ss}" stroke-width="3" opacity=".7"/>'
    elif ex == "squeeze":
        for c, sg in ((L, 1), (R, -1)):
            out += f'<path d="M{c-16} {ey-6} Q{c} {ey+10} {c+16} {ey-6}" stroke="{line}" stroke-width="6"/>'
            out += f'<path d="M{c-14*sg} {ey+8} q{8*sg} 6 {18*sg} 2" stroke="{line}" stroke-width="3" opacity=".6"/>'
    elif ex in ("open", "aside", "half"):
        dx = -7 if ex == "aside" else 0
        dy = 4 if ex in ("aside", "open") else 3
        for c in (L, R):
            out += f'<ellipse cx="{c}" cy="{ey}" rx="15" ry="11" fill="#f4ece4" stroke="none"/>'
            out += f'<ellipse cx="{c+dx}" cy="{ey+dy}" rx="8" ry="9" fill="#2e211d" stroke="none"/>'
            out += f'<circle cx="{c+dx+3}" cy="{ey+dy-3}" r="2.6" fill="#fff" stroke="none"/>'
            if ex == "half":
                out += f'<path d="M{c-17} {ey+2} Q{c} {ey-16} {c+17} {ey+2} L{c+17} {ey-14} L{c-17} {ey-14} Z" fill="{skin}" stroke="none"/>'
                out += f'<path d="M{c-17} {ey+1} Q{c} {ey-7} {c+17} {ey+1}" stroke="{line}" stroke-width="5"/>'
            else:
                out += f'<path d="M{c-17} {ey-2} Q{c} {ey-14} {c+17} {ey-2}" stroke="{line}" stroke-width="5"/>'
        if ex == "open":
            for c in (L, R):
                out += f'<path d="M{c-14} {ey+10} Q{c} {ey+16} {c+14} {ey+10}" stroke="#bfe0ff" stroke-width="3" opacity=".8"/>'
    if expr in ("tired", "kind", "sad"):
        for c in (L, R):
            out += f'<path d="M{c-11} {ey+16} Q{c} {ey+21} {c+12} {ey+16}" stroke="{ss}" stroke-width="3.5" opacity=".6"/>'
    out += f'<path d="M541 {ny} Q549 {ny+20} 537 {ny+25}" stroke="{ss}" stroke-width="4.5"/>'
    mouths = {
        "frown": f'<path d="M522 {my+4} Q540 {my-7} 558 {my+4}" stroke="{lip}" stroke-width="5.5"/>',
        "flat": f'<path d="M524 {my} Q540 {my+1} 556 {my-1}" stroke="{lip}" stroke-width="5.5"/>',
        "pressed": f'<path d="M520 {my+3} Q540 {my-3} 560 {my+3}" stroke="{lip}" stroke-width="6"/>',
        "soft": f'<path d="M522 {my-2} Q540 {my+8} 558 {my-3}" stroke="{lip}" stroke-width="5"/>',
        "smile": f'<path d="M516 {my-6} Q540 {my+14} 564 {my-6}" stroke="{lip}" stroke-width="5.5"/>',
        "bigsmile": (f'<path d="M508 {my-12} Q540 {my-8} 572 {my-12} Q566 {my+26} 540 {my+28} Q514 {my+26} 508 {my-12} Z" '
                     f'fill="#7a2f2a" stroke="{lip}" stroke-width="4"/>'
                     f'<path d="M514 {my-10} Q540 {my-6} 566 {my-10} L563 {my} Q540 {my+3} 517 {my} Z" fill="#fff" stroke="none"/>'),
        "wobble": (f'<path d="M520 {my+8} Q526 {my-6} 534 {my-2} Q540 {my-8} 546 {my-2} Q554 {my-6} 560 {my+8} '
                   f'Q540 {my+18} 520 {my+8} Z" fill="#6e2a26" stroke="{lip}" stroke-width="4"/>'),
        "talk": (f'<path d="M522 {my-6} Q540 {my-2} 558 {my-6} Q554 {my+16} 540 {my+17} Q526 {my+16} 522 {my-6} Z" '
                 f'fill="#7a2f2a" stroke="{lip}" stroke-width="4"/>'),
    }
    out += mouths[mo]
    out += '</g>'
    out += (f'<ellipse cx="490" cy="{ey+36}" rx="20" ry="11" fill="#d07f6a" opacity="{blush}"/>'
            f'<ellipse cx="590" cy="{ey+36}" rx="20" ry="11" fill="#d07f6a" opacity="{blush}"/>')
    if tears:
        out += (f'<path d="M488 {ey+12} C484 {ey+36} 486 {ey+56} 482 {ey+80}" stroke="#cfe6ff" stroke-width="6" fill="none" opacity=".85" stroke-linecap="round"/>'
                f'<path d="M594 {ey+12} C598 {ey+40} 596 {ey+60} 600 {ey+78}" stroke="#cfe6ff" stroke-width="6" fill="none" opacity=".85" stroke-linecap="round"/>'
                f'<ellipse cx="481" cy="{ey+88}" rx="6" ry="8" fill="#cfe6ff" opacity=".85"/>')
    if glasses:
        out += (f'<g fill="none" stroke="#5a4038" stroke-width="5"><circle cx="{L}" cy="{ey+2}" r="27"/><circle cx="{R}" cy="{ey+2}" r="27"/>'
                f'<path d="M{L+27} {ey} Q540 {ey-8} {R-27} {ey}"/><path d="M{L-27} {ey-2} L446 {ey-10}"/><path d="M{R+27} {ey-2} L634 {ey-10}"/></g>')
    if beard:
        out += (f'<path d="M452 960 C456 1010 500 1030 540 1030 C580 1030 624 1010 628 960 C616 1000 586 1012 540 1012 '
                f'C494 1012 464 1000 452 960 Z" fill="{beard}" opacity=".55"/>')
    return out


def figure(skin, hair, hcol, top, expr, bow=True, slump=0.4, collar="v", inner="#cdb9a2",
           tears=False, glasses=False, beard=None, blush=.18, wide=1.0, show_torso=True):
    out = hair_back(hair, hcol)
    if show_torso:
        out += torso(top, slump, collar, inner, wide)
    out += neck(skin) + head_shape(skin) + hair_front(hair, hcol, bow)
    out += face(expr, bow, skin, tears, blush, glasses, beard)
    return out


def phone_back(x, y, w=66, h=112, rot=-6, col="#1d1c21"):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="11" fill="{col}" transform="rotate({rot} {x+w/2} {y+h/2})"/>'
            f'<rect x="{x+7}" y="{y+10}" width="20" height="20" rx="6" fill="#2d2c33" transform="rotate({rot} {x+w/2} {y+h/2})"/>')


def hands_phone(skin, sleeve, phone=True):
    """Forearms resting forward, both hands cupping a phone (as in Mum)."""
    out = (f'<path d="M366 1258 C404 1272 470 1266 516 1238 L522 1206 C472 1224 412 1232 368 1226 Z" fill="{sleeve}"/>'
           f'<path d="M714 1258 C676 1272 610 1266 564 1238 L558 1206 C608 1224 668 1232 712 1226 Z" fill="{sleeve}"/>')
    if phone:
        out += phone_back(507, 1140)
    out += (f'<ellipse cx="514" cy="1222" rx="30" ry="25" fill="{skin}"/>'
            f'<ellipse cx="566" cy="1222" rx="30" ry="25" fill="{shade(skin,.97)}"/>')
    return out


def table(y=1238, top=("#7c5f4b", "#9a785e"), edge="#4f3b2f", under="#2c211e", id_="tt"):
    return (lin(id_, [(0, top[0], None), (1, top[1], None)]),
            f'<path d="M40 {y} L1040 {y} L1080 {y+112} L0 {y+112} Z" fill="url(#{id_})"/>'
            f'<rect x="0" y="{y+112}" width="1080" height="52" fill="{edge}"/>'
            f'<rect x="0" y="{y+164}" width="1080" height="{1920-y-164}" fill="{under}"/>')


def window(x, y, w, h, sky_id, frame="#3b2f2c", extra=""):
    return (f'<rect x="{x-20}" y="{y-20}" width="{w+40}" height="{h+40}" rx="6" fill="{frame}"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#{sky_id})"/>{extra}'
            f'<rect x="{x+w/2-4}" y="{y}" width="8" height="{h}" fill="{frame}"/>'
            f'<rect x="{x}" y="{y+h/2-4}" width="{w}" height="8" fill="{frame}"/>')


# ------------------------------------------------------------------ scenes
def scene2():  # Sister, "nvm": on her bed at dusk, hugging her knees, phone face down
    skin, top, hcol = "#c98f6f", "#7f8fb0", "#3a2721"
    defs = (lin("wall", [(0, "#2b2230", None), (.5, "#4a3b4c", None), (1, "#3a2d3b", None)])
            + lin("sky", [(0, "#3d3a5e", None), (.55, "#b9708a", None), (1, "#f0a777", None)])
            + lin("duvet", [(0, "#8d7d9e", None), (1, "#5d4f6c", None)])
            + rad("dusk", 200, 840, 620, [(0, "#f2a77a", .30), (1, "#f2a77a", 0)]))
    lights = "".join(f'<circle cx="{x}" cy="{620+28*((x//60)%2)}" r="7" fill="#ffd89a" opacity=".85"/>'
                     f'<circle cx="{x}" cy="{620+28*((x//60)%2)}" r="20" fill="#ffd89a" opacity=".15"/>'
                     for x in range(560, 1080, 60))
    b = '<rect width="1080" height="1920" fill="url(#wall)"/>'
    b += window(70, 660, 300, 400, "sky", "#2f2533",
                '<path d="M70 980 L130 980 L130 940 L190 940 L190 990 L250 990 L250 950 L300 950 L300 1000 L370 1000 L370 1060 L70 1060Z" fill="#2a2440" opacity=".8"/>')
    b += '<path d="M540 600 Q800 660 1080 610" stroke="#2a2129" stroke-width="3" fill="none"/>' + lights
    b += '<rect x="760" y="700" width="200" height="260" rx="6" fill="#6f5d74"/><rect x="778" y="718" width="164" height="224" fill="#8c7b92"/><circle cx="860" cy="800" r="44" fill="#c99ab0" opacity=".7"/><rect x="800" y="870" width="120" height="16" rx="8" fill="#b28ca2" opacity=".7"/>'
    b += '<rect width="1080" height="1920" fill="url(#dusk)"/>'
    # headboard + bed
    b += '<rect x="250" y="1040" width="580" height="260" rx="40" fill="#4c3c4f"/>'
    b += '<path d="M0 1290 Q540 1250 1080 1290 L1080 1920 L0 1920 Z" fill="url(#duvet)"/>'
    b += '<path d="M60 1420 Q300 1380 520 1430 M600 1500 Q820 1450 1040 1490" stroke="#4b3f58" stroke-width="5" fill="none" opacity=".6"/>'
    # figure: knees up, arms wrapped, chin low
    fig = figure(skin, "bob", hcol, top, "sad", bow=True, slump=.9, collar="crew")
    knees = (f'<path d="M420 1310 C404 1190 424 1086 494 1062 C548 1046 566 1110 566 1170 L566 1316 Z" fill="#5f5a80"/>'
             f'<path d="M514 1316 C512 1180 532 1084 600 1068 C664 1056 684 1126 672 1310 Z" fill="#6e6890"/>'
             f'<path d="M470 1080 C500 1068 530 1074 546 1100" stroke="#7d779e" stroke-width="6" fill="none" opacity=".7"/>'
             f'<path d="M392 1150 C450 1180 600 1186 690 1150 L692 1196 C600 1230 450 1226 390 1196 Z" fill="{top}"/>'
             f'<ellipse cx="672" cy="1170" rx="30" ry="25" fill="{skin}"/><ellipse cx="408" cy="1172" rx="28" ry="24" fill="{shade(skin,.95)}"/>')
    b += g(fig + knees, ty=20)
    # phone face down on duvet, a sliver of light leaking at the edge
    b += '<g transform="rotate(14 250 1460)"><rect x="200" y="1420" width="110" height="64" rx="12" fill="#1f1d24"/><rect x="200" y="1484" width="110" height="5" rx="2" fill="#cfe0ff" opacity=".6"/></g>'
    return svg(defs, b)


def scene3():  # Dad, "Ok.": break room, beaming, showing your text to two coworkers
    skin, hcol = "#c58c6d", "#6d655f"
    defs = (lin("wall", [(0, "#2c2a24", None), (.45, "#5b5643", None), (1, "#4a4535", None)])
            + lin("sky", [(0, "#a9c1c9", None), (1, "#e6dcc0", None)])
            + rad("sun", 860, 820, 600, [(0, "#ffe2a3", .28), (1, "#ffe2a3", 0)])
            + glow("pg", 600, 1110, 220, "#d8e8ff", .35))
    b = '<rect width="1080" height="1920" fill="url(#wall)"/>'
    b += window(730, 640, 300, 360, "sky", "#3e3a2f")
    b += '<rect width="1080" height="1920" fill="url(#sun)"/>'
    for i in range(4):  # lockers
        b += f'<rect x="{30+i*82}" y="700" width="76" height="560" fill="#6f7867"/><rect x="{40+i*82}" y="730" width="56" height="8" fill="#56604f"/><rect x="{40+i*82}" y="750" width="56" height="8" fill="#56604f"/><rect x="{88+i*82}" y="960" width="6" height="40" rx="3" fill="#3f463a"/>'
    b += '<rect x="420" y="700" width="200" height="140" rx="6" fill="#8a6f4f"/><rect x="436" y="716" width="60" height="44" fill="#e8dcc0"/><rect x="510" y="722" width="50" height="60" fill="#d9c8a0"/><rect x="450" y="772" width="70" height="50" fill="#efe6d3"/>'
    # coworkers (back, leaning in, smiling)
    cw1 = figure("#e2b294", "bob", "#2e2420", "#7a8aa0", "smile", bow=False, slump=0, collar="crew")
    cw2 = figure("#8f5e45", "short", "#1f1714", "#9a5a3c", "smile", bow=False, slump=0, collar="crew", beard="#1f1714")
    b += g(cw1, tx=-300, ty=40, s=.82) + g(cw2, tx=310, ty=30, s=.84)
    # Dad
    vest = "#d7c84a"
    dad = figure(skin, "short", hcol, "#7d7f86", "proud", bow=False, slump=0, collar="crew", beard="#6d655f", wide=1.1, blush=.28)
    dad += (f'<path d="M420 1070 C400 1120 392 1190 390 1260 L486 1260 L486 1040 Z M660 1070 C680 1120 688 1190 690 1260 L594 1260 L594 1040 Z" fill="{vest}"/>'
            f'<rect x="398" y="1150" width="86" height="14" fill="#e8e6dc" opacity=".8"/><rect x="596" y="1150" width="86" height="14" fill="#e8e6dc" opacity=".8"/>')
    # arm raised holding phone out, screen towards us showing "got the job!!"
    dad += (f'<path d="M640 1090 C700 1130 700 1180 640 1200 L600 1160 C630 1150 640 1130 620 1110 Z" fill="#6c6e75"/>'
            f'<rect x="560" y="1040" width="96" height="164" rx="14" fill="#16151a"/>'
            f'<rect x="567" y="1052" width="82" height="140" rx="9" fill="#f4f6fb"/>'
            f'<rect x="590" y="1100" width="52" height="16" rx="8" fill="#0a84ff"/><rect x="574" y="1124" width="30" height="14" rx="7" fill="#d9dbe0"/>'
            f'<ellipse cx="600" cy="1196" rx="32" ry="26" fill="{skin}"/>')
    b += g(dad, ty=30)
    b += '<rect width="1080" height="1920" fill="url(#pg)" style="mix-blend-mode:screen"/>'
    tdefs, tb = table(1300, ("#8a7d64", "#a39478"), "#5a5040", "#2f2b23")
    b += tb + '<rect x="200" y="1250" width="56" height="70" rx="6" fill="#c9533c"/><rect x="190" y="1246" width="76" height="10" rx="4" fill="#e8e2d4"/><path d="M740 1290 L860 1290 L850 1320 L750 1320 Z" fill="#d9cdb0"/>'
    return svg(defs + tdefs, b)


def scene4():  # Best friend: bills on the table, low balance, hand on her forehead
    skin, top, hcol = "#e0b08f", "#4f7a7a", "#5a3a2a"
    defs = (lin("wall", [(0, "#1b2324", None), (.5, "#2f4040", None), (1, "#253232", None)])
            + rad("lamp", 860, 900, 520, [(0, "#f6c886", .32), (1, "#f6c886", 0)])
            + glow("pg", 540, 1290, 240, "#d6e4ff", .30))
    b = '<rect width="1080" height="1920" fill="url(#wall)"/>'
    b += '<rect width="1080" height="1920" fill="url(#lamp)"/>'
    b += '<path d="M830 720 L900 720 L930 800 L800 800 Z" fill="#c9a36d"/><rect x="860" y="800" width="10" height="440" fill="#3a3330"/>'
    # outfit hanging on the wardrobe, tag still on: she meant to go
    b += '<rect x="60" y="640" width="300" height="640" rx="8" fill="#3a2f2e"/><path d="M210 700 l-40 40 h80 z" stroke="#a49a90" stroke-width="5" fill="none"/>'
    b += '<path d="M150 740 L270 740 L300 980 L120 980 Z" fill="#b5566a"/><path d="M200 740 L240 740 L230 790 L210 790 Z" fill="#8d3e50"/><rect x="262" y="770" width="34" height="44" rx="4" fill="#efe6d6"/><path d="M262 770 l-20 -14" stroke="#efe6d6" stroke-width="3"/>'
    fig = figure(skin, "long", hcol, top, "embarrassed", bow=True, slump=.85, collar="crew", blush=.32)
    # one hand on forehead (left arm up), right forearm on table
    fig += (f'<path d="M402 1080 C360 1060 380 940 440 900 L470 930 C430 970 420 1030 446 1070 Z" fill="{top}"/>'
            f'<ellipse cx="458" cy="900" rx="34" ry="26" fill="{skin}" transform="rotate(-30 458 900)"/>'
            f'<path d="M714 1258 C676 1272 610 1266 564 1238 L558 1206 C608 1224 668 1232 712 1226 Z" fill="{shade(top,.9)}"/>'
            f'<ellipse cx="560" cy="1226" rx="30" ry="24" fill="{skin}"/>')
    b += g(fig)
    tdefs, tb = table(1238, ("#5e4b3e", "#76604e"), "#3c3028", "#1e1817")
    b += tb
    # phone face up on the table, balance in red
    b += ('<g transform="rotate(-8 540 1300)"><rect x="470" y="1262" width="140" height="78" rx="12" fill="#151418"/>'
          '<rect x="478" y="1268" width="124" height="66" rx="8" fill="#f3f4f7"/>'
          '<text x="540" y="1292" font-family="Inter" font-size="13" font-weight="600" fill="#6b6b72" text-anchor="middle">Balance</text>'
          '<text x="540" y="1320" font-family="Inter" font-size="24" font-weight="700" fill="#d33a2c" text-anchor="middle">£3.12</text></g>')
    b += ('<g transform="rotate(6 250 1290)"><rect x="170" y="1252" width="170" height="90" fill="#efe9dc"/>'
          '<rect x="186" y="1268" width="90" height="8" fill="#b9b1a2"/><rect x="186" y="1284" width="120" height="6" fill="#cfc8ba"/>'
          '<rect x="230" y="1300" width="96" height="30" fill="none" stroke="#c7372b" stroke-width="4"/>'
          '<text x="278" y="1321" font-family="Inter" font-size="15" font-weight="800" fill="#c7372b" text-anchor="middle">OVERDUE</text></g>')
    b += ''.join(f'<ellipse cx="{760+i*4}" cy="{1306-i*7}" rx="24" ry="8" fill="#c9a24e" stroke="#8c6f2f" stroke-width="2"/>' for i in range(3))
    b += '<ellipse cx="820" cy="1316" rx="20" ry="7" fill="#b9bcc0" stroke="#7f8287" stroke-width="2"/>'
    b += '<rect width="1080" height="1920" fill="url(#pg)" style="mix-blend-mode:screen"/>'
    return svg(defs + tdefs, b)


def scene5():  # Boss: alone in the office at 9pm, kind tired smile, PROJECT LEAD on the monitor
    skin, hcol = "#b97f60", "#2b211d"
    defs = (lin("wall", [(0, "#14181f", None), (.5, "#232b36", None), (1, "#1a2029", None)])
            + lin("night", [(0, "#0f1626", None), (1, "#24304a", None)])
            + glow("mon", 300, 1060, 420, "#cfe1ff", .42))
    b = '<rect width="1080" height="1920" fill="url(#wall)"/>'
    b += '<rect x="0" y="620" width="1080" height="480" fill="url(#night)"/>'
    for x, h in [(40, 300), (130, 380), (230, 260), (330, 420), (450, 320), (560, 400), (680, 280), (780, 360), (900, 300), (990, 420)]:
        b += f'<rect x="{x}" y="{1100-h}" width="80" height="{h}" fill="#1a2234"/>'
        b += "".join(f'<rect x="{x+12+(j%3)*22}" y="{1100-h+20+(j//3)*40}" width="10" height="14" fill="#f0c879" opacity="{.5 if (j*7+x)%5 else .15}"/>' for j in range(min(18, h // 40 * 3)))
    for x in range(0, 1080, 270):
        b += f'<rect x="{x}" y="620" width="10" height="480" fill="#0e121a"/>'
    b += '<rect x="0" y="1090" width="1080" height="20" fill="#0e121a"/>'
    # empty desks + chairs in the background
    b += '<rect x="700" y="1120" width="360" height="24" fill="#2a3240"/><path d="M820 1060 h70 v60 h-70z" fill="#1f2631"/><path d="M760 1144 v80 M1020 1144 v80" stroke="#2a3240" stroke-width="10"/>'
    boss = figure(skin, "short", hcol, "#e9e6df", "kind", bow=False, slump=.35, collar="shirt", inner="#e9e6df", blush=.12)
    boss += '<path d="M534 1004 L546 1004 L552 1100 L540 1116 L528 1100 Z" fill="#7c3a3a" transform="rotate(8 540 1004)"/>'
    boss += hands_phone(skin, "#d7d3cb", phone=True)
    b += g(boss, tx=110)
    # monitor angled so we can see it
    b += ('<g transform="translate(120 880) skewY(6)"><rect x="0" y="0" width="330" height="220" rx="10" fill="#0d0f14"/>'
          '<rect x="12" y="12" width="306" height="196" fill="#f4f6fb"/>'
          '<rect x="12" y="12" width="306" height="30" fill="#5b4bd6"/>'
          '<text x="165" y="88" font-family="Inter" font-size="26" font-weight="800" fill="#1d1d24" text-anchor="middle">NEW PROJECT</text>'
          '<text x="165" y="126" font-family="Inter" font-size="19" font-weight="600" fill="#5b4bd6" text-anchor="middle">Lead: you ★</text>'
          '<rect x="40" y="150" width="250" height="8" fill="#d7d9e0"/><rect x="40" y="168" width="200" height="8" fill="#d7d9e0"/>'
          '<rect x="150" y="220" width="30" height="70" fill="#22262e"/><rect x="100" y="286" width="130" height="14" rx="6" fill="#22262e"/></g>')
    b += '<rect width="1080" height="1920" fill="url(#mon)" style="mix-blend-mode:screen"/>'
    tdefs, tb = table(1250, ("#3a4250", "#4a5262"), "#272d37", "#121519")
    b += tb
    b += ''.join(f'<path d="M{760+i*70} 1236 L{806+i*70} 1236 L{800+i*70} 1300 L{766+i*70} 1300 Z" fill="#e9e1d1"/><rect x="{758+i*70}" y="1230" width="50" height="10" rx="3" fill="#5b4b3e"/>' for i in range(3))
    return svg(defs + tdefs, b)


def scene6():  # Partner, "I'm fine": lying awake in the dark, phone glow, a tear sliding sideways
    skin, hcol = "#d29a7c", "#3b2a22"
    defs = (lin("wall", [(0, "#120f1c", None), (.6, "#221d33", None), (1, "#191526", None)])
            + lin("sheet", [(0, "#4a4566", None), (1, "#2c2842", None)])
            + glow("pg", 420, 1080, 340, "#d2e2ff", .55))
    b = '<rect width="1080" height="1920" fill="url(#wall)"/>'
    b += '<rect x="720" y="640" width="260" height="340" fill="#1c2236"/><path d="M720 640 L980 980" stroke="#2b3350" stroke-width="3"/><rect x="720" y="640" width="260" height="340" fill="none" stroke="#2a2440" stroke-width="18"/>'
    b += '<path d="M0 1040 Q540 1000 1080 1040 L1080 1920 L0 1920 Z" fill="#2a2640"/>'
    b += '<ellipse cx="620" cy="1070" rx="400" ry="120" fill="#585274"/>'  # pillow
    # head lying on its side on the pillow (chin to the left), a tear running down toward the pillow
    head = hair_back("curly", hcol) + neck(skin) + head_shape(skin) + hair_front("curly", hcol, False) + face("hurt", False, skin, blush=.2)
    head += '<path d="M600 930 C622 934 650 940 690 944" stroke="#cfe6ff" stroke-width="6" fill="none" opacity=".9" stroke-linecap="round"/><ellipse cx="698" cy="945" rx="8" ry="6" fill="#cfe6ff" opacity=".9"/>'
    b += g(head, tx=60, ty=70, s=1.4, rot=78)
    b += '<path d="M0 1180 C200 1150 380 1160 560 1166 C760 1160 900 1150 1080 1170 L1080 1920 L0 1920 Z" fill="url(#sheet)"/>'
    b += '<path d="M60 1320 Q400 1270 760 1340 M300 1520 Q640 1470 1040 1540" stroke="#3a3556" stroke-width="6" fill="none"/>'
    b += phone_back(330, 1040, 70, 118, rot=-14)
    b += f'<ellipse cx="372" cy="1150" rx="34" ry="26" fill="{skin}"/><path d="M420 1170 C390 1200 350 1196 330 1168 L310 1200 C340 1230 410 1230 440 1196 Z" fill="#5a5578"/>'
    b += '<rect width="1080" height="1920" fill="url(#pg)" style="mix-blend-mode:screen"/>'
    return svg(defs, b)


def scene7():  # Ex, late-night "hey": headphones on by the window, a song playing, wistful
    skin, top, hcol = "#c48b6b", "#3f4a63", "#2a1d18"
    defs = (lin("wall", [(0, "#0e1220", None), (.55, "#1f2740", None), (1, "#171d31", None)])
            + lin("night", [(0, "#0b1222", None), (1, "#28365a", None)])
            + glow("pg", 540, 1130, 280, "#d8e6ff", .45)
            + rad("amber", 880, 1000, 400, [(0, "#f2b45c", .20), (1, "#f2b45c", 0)]))
    b = '<rect width="1080" height="1920" fill="url(#wall)"/>'
    city = "".join(f'<circle cx="{(i*137)%300+90}" cy="{880+(i*61)%160}" r="{6+(i%3)*4}" fill="{["#f2c46b","#e88a5a","#9fb8e8"][i%3]}" opacity=".55"/>' for i in range(14))
    b += window(80, 640, 300, 420, "night", "#1a1f30", city)
    b += '<rect width="1080" height="1920" fill="url(#amber)"/>'
    b += '<rect x="820" y="1000" width="160" height="240" rx="10" fill="#2d2a33"/><circle cx="900" cy="1080" r="46" fill="#1d1b22" stroke="#4a4552" stroke-width="6"/><circle cx="900" cy="1080" r="12" fill="#4a4552"/><circle cx="900" cy="1186" r="24" fill="#1d1b22"/>'
    notes = ('<g fill="#f2c46b" opacity=".75"><path d="M720 760 v60 a14 11 0 1 1 -8 -10 v-62 l40 -10 v60 a14 11 0 1 1 -8 -10 v-44 z"/>'
             '<path d="M330 640 v46 a12 9 0 1 1 -7 -8 v-48 l10 0 z" opacity=".7"/><path d="M800 900 v40 a11 8 0 1 1 -6 -7 v-40 l8 0z" opacity=".6"/></g>')
    b += notes
    fig = figure(skin, "short", hcol, top, "wistful", bow=True, slump=.6, collar="hood")
    # headphones
    fig += ('<path d="M430 930 C420 800 660 800 650 930" stroke="#22242c" stroke-width="16" fill="none"/>'
            '<rect x="410" y="900" width="40" height="76" rx="18" fill="#2b2e38"/><rect x="630" y="900" width="40" height="76" rx="18" fill="#2b2e38"/>')
    fig += hands_phone(skin, shade(top, .9))
    b += g(fig)
    b += '<rect width="1080" height="1920" fill="url(#pg)" style="mix-blend-mode:screen"/>'
    b += '<path d="M0 1270 L1080 1270 L1080 1920 L0 1920 Z" fill="#1a1d2a"/><rect x="0" y="1262" width="1080" height="16" fill="#2c3042"/>'
    return svg(defs, b)


def scene8():  # Grandma: sunny window seat, recording a voice note, smiling, tea going cold
    skin, top, hcol = "#e3b496", "#5e8c84", "#d9d4cf"
    defs = (lin("wall", [(0, "#2f261c", None), (.5, "#6d5a42", None), (1, "#5a4a37", None)])
            + lin("sky", [(0, "#cfe1e3", None), (1, "#f6e4b8", None)])
            + rad("sun", 300, 860, 700, [(0, "#ffe3a0", .38), (1, "#ffe3a0", 0)]))
    b = '<rect width="1080" height="1920" fill="url(#wall)"/>'
    b += window(70, 640, 340, 460, "sky", "#5a4632", '<circle cx="330" cy="720" r="40" fill="#fff4d6" opacity=".8"/><path d="M70 1000 Q170 960 260 990 T410 980 L410 1100 L70 1100Z" fill="#9bb38a" opacity=".7"/>')
    b += '<rect width="1080" height="1920" fill="url(#sun)"/>'
    b += '<path d="M120 1120 L130 1060 L190 1060 L200 1120 Z" fill="#b5653f"/><path d="M160 1060 C120 1000 110 960 140 930 M160 1060 C170 990 200 960 230 950 M160 1060 C150 1010 170 980 160 940" stroke="#5f8a4a" stroke-width="12" fill="none" stroke-linecap="round"/>'
    # armchair back
    b += '<path d="M330 1360 L330 900 C330 840 380 800 440 800 L640 800 C700 800 750 840 750 900 L750 1360 Z" fill="#8a5a4a"/>'
    gma = figure(skin, "greybun", hcol, top, "talk", bow=False, slump=.3, collar="v", inner="#efe6d6", glasses=True, blush=.3)
    # right hand holds phone near her mouth (recording); red mic dot + sound waves
    gma += (f'<path d="M650 1080 C700 1120 690 1030 650 990 L620 1010 C640 1040 640 1070 616 1080 Z" fill="{shade(top,.88)}"/>'
            f'<rect x="604" y="960" width="58" height="96" rx="10" fill="#1d1c21" transform="rotate(18 633 1008)"/>'
            f'<circle cx="652" cy="1040" r="9" fill="#e5483a"/>'
            f'<ellipse cx="640" cy="1010" rx="26" ry="22" fill="{skin}"/>'
            f'<g stroke="#f6e7c4" stroke-width="5" fill="none" opacity=".75" stroke-linecap="round"><path d="M688 960 q16 24 0 48"/><path d="M708 946 q26 38 0 76"/></g>')
    # left hand holding a mug on her lap
    gma += (f'<path d="M400 1080 C380 1150 420 1210 480 1220 L496 1180 C460 1170 440 1140 444 1100 Z" fill="{shade(top,.88)}"/>'
            f'<path d="M480 1170 L540 1170 L534 1240 L486 1240 Z" fill="#e9dcc6"/><path d="M540 1185 q20 4 16 24 q-4 10 -18 10" fill="none" stroke="#e9dcc6" stroke-width="7"/>'
            f'<ellipse cx="490" cy="1206" rx="26" ry="20" fill="{skin}"/>')
    b += g(gma, ty=10)
    b += '<rect x="280" y="1250" width="520" height="140" rx="40" fill="#7a4d3f"/><path d="M0 1380 L1080 1380 L1080 1920 L0 1920 Z" fill="#3d3024"/>'
    # side table: framed photo of the family
    b += '<rect x="820" y="1200" width="200" height="16" fill="#5a4030"/><rect x="900" y="1216" width="14" height="200" fill="#5a4030"/>'
    b += '<rect x="850" y="1100" width="96" height="100" fill="#c9a86e"/><rect x="860" y="1110" width="76" height="80" fill="#b7cbd0"/><circle cx="884" cy="1140" r="9" fill="#e0b090"/><circle cx="912" cy="1144" r="8" fill="#a8745a"/><rect x="874" y="1150" width="20" height="30" fill="#6a7fa8"/><rect x="903" y="1152" width="18" height="28" fill="#b56a6a"/>'
    return svg(defs, b)


def scene9():  # Coworker, "thanks": in the car park after the hospital called, crying
    skin, top, hcol = "#9a6447", "#6a6f7c", "#1b1311"
    defs = (lin("sky", [(0, "#596270", None), (.5, "#8f97a1", None), (1, "#a9aeb3", None)])
            + lin("glass", [(0, "#ffffff", .10), (1, "#ffffff", 0)])
            + rad("dim", 540, 1000, 700, [(0, "#000", 0), (1, "#000", .25)]))
    b = '<rect width="1080" height="1920" fill="url(#sky)"/>'
    # hospital in the distance
    b += '<rect x="560" y="660" width="460" height="420" fill="#c3c6c9"/>' + "".join(
        f'<rect x="{590+(i%6)*72}" y="{700+(i//6)*70}" width="44" height="40" fill="#8e9aa6"/>' for i in range(30))
    b += '<rect x="640" y="600" width="120" height="120" rx="12" fill="#2f6fb6"/><path d="M682 630 h16 v30 h30 v16 h-30 v30 h-16 v-30 h-30 v-16 h30z" fill="#fff"/>'
    b += '<rect x="0" y="1060" width="1080" height="60" fill="#6c7178"/>'
    for x in (30, 330):  # parked cars
        b += f'<path d="M{x} 1080 q20 -60 80 -64 h120 q60 4 80 64 v30 h-280z" fill="{["#5d6a7a","#8a5d55"][x>100]}"/>'
    # car interior frame: windscreen pillars, dash, steering wheel
    b += '<path d="M0 560 L180 560 L80 1500 L0 1500 Z" fill="#26282d"/><path d="M1080 560 L900 560 L1000 1500 L1080 1500 Z" fill="#26282d"/>'
    b += '<rect x="0" y="540" width="1080" height="40" fill="#1e2024"/>'
    fig = figure(skin, "long", hcol, top, "cry", bow=True, slump=.9, collar="crew", tears=True, blush=.3)
    # one hand pressed to her chest, phone in it: call ended
    fig += (f'<path d="M640 1090 C620 1150 560 1170 520 1150 L530 1110 C560 1120 600 1110 610 1080 Z" fill="{shade(top,.9)}"/>'
            f'<rect x="470" y="1080" width="72" height="120" rx="11" fill="#141317" transform="rotate(-14 506 1140)"/>'
            f'<rect x="477" y="1090" width="58" height="100" rx="8" fill="#e9ecf2" transform="rotate(-14 506 1140)"/>'
            f'<circle cx="506" cy="1170" r="10" fill="#e5483a" transform="rotate(-14 506 1140)"/>'
            f'<ellipse cx="520" cy="1146" rx="30" ry="24" fill="{skin}"/>')
    b += g(fig, tx=10, ty=40)
    b += '<rect width="1080" height="1920" fill="url(#glass)"/>'
    b += '<path d="M0 1300 Q540 1240 1080 1300 L1080 1920 L0 1920 Z" fill="#2b2d32"/>'
    b += '<path d="M290 1420 A250 250 0 0 1 790 1420" stroke="#1a1b1f" stroke-width="44" fill="none"/><rect x="510" y="1420" width="60" height="200" fill="#1a1b1f"/>'
    b += '<rect width="1080" height="1920" fill="url(#dim)"/>'
    return svg(defs, b)


def scene10():  # Delivery driver, "outside": soaked at your door in the rain, app frozen
    skin, top = "#a8714f", "#3f5a6e"
    defs = (lin("wall", [(0, "#151a20", None), (.5, "#2b3540", None), (1, "#202830", None)])
            + rad("porch", 860, 700, 620, [(0, "#f5c27a", .38), (1, "#f5c27a", 0)])
            + glow("pg", 700, 1150, 200, "#d6e6ff", .35))
    b = '<rect width="1080" height="1920" fill="url(#wall)"/>'
    b += '<rect x="700" y="560" width="400" height="1360" fill="#3a3028"/><rect x="740" y="600" width="340" height="1320" fill="#5a4636"/><circle cx="790" cy="1180" r="12" fill="#c9a24e"/>'
    b += '<rect x="900" y="640" width="60" height="80" rx="10" fill="#f6d39a"/><rect width="1080" height="1920" fill="url(#porch)"/>'
    drv = figure(skin, "hood", top, top, "tired", bow=False, slump=.7, collar="hood", blush=.08, beard="#2a1d18")
    drv += '<g fill="#cfe6ff" opacity=".8"><ellipse cx="470" cy="880" rx="4" ry="7"/><ellipse cx="610" cy="900" rx="4" ry="7"/><ellipse cx="520" cy="1010" rx="4" ry="6"/><ellipse cx="440" cy="1100" rx="5" ry="8"/><ellipse cx="650" cy="1060" rx="5" ry="8"/></g>'
    # thermal bag held by the strap (left), phone with frozen spinner (right)
    drv += ('<path d="M420 1080 C400 1100 380 1140 360 1170 L400 1190 C420 1160 440 1130 450 1110 Z" fill="#33495a"/>'
            '<rect x="150" y="1150" width="290" height="230" rx="18" fill="#2f8a7a"/><rect x="150" y="1150" width="290" height="40" rx="18" fill="#256e62"/><rect x="180" y="1230" width="230" height="10" rx="5" fill="#256e62"/>'
            f'<ellipse cx="380" cy="1180" rx="30" ry="24" fill="{skin}"/>')
    drv += (f'<path d="M660 1080 C700 1120 700 1180 670 1200 L630 1170 C650 1150 650 1120 630 1100 Z" fill="#33495a"/>'
            '<rect x="620" y="1080" width="100" height="168" rx="14" fill="#141317"/><rect x="628" y="1092" width="84" height="144" rx="9" fill="#e9ecf2"/>'
            '<circle cx="670" cy="1156" r="22" fill="none" stroke="#b9bdc6" stroke-width="6"/><path d="M670 1134 a22 22 0 0 1 22 22" stroke="#f08a3c" stroke-width="6" fill="none"/>'
            f'<ellipse cx="660" cy="1236" rx="32" ry="26" fill="{skin}"/>')
    b += g(drv, tx=-40, ty=30)
    b += '<rect width="1080" height="1920" fill="url(#pg)" style="mix-blend-mode:screen"/>'
    b += '<rect x="0" y="1420" width="1080" height="500" fill="#2a3038"/><rect x="0" y="1410" width="1080" height="20" fill="#3c444e"/>'
    b += '<rect x="300" y="1500" width="420" height="140" rx="8" fill="#4a3f36"/><text x="510" y="1586" font-family="Inter" font-size="44" font-weight="800" fill="#6e6155" text-anchor="middle">WELCOME</text>'
    rain = "".join(f'<path d="M{(i*97)%1100} {(i*173)%1900} l-18 54" stroke="#bcd4ea" stroke-width="3" opacity="{.25+.25*(i%3)/2}"/>' for i in range(170))
    b += rain
    return svg(defs, b)


def scene1():  # Mum: the original video-1 illustration, reused as-is
    import os
    src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'v01_mum', 'scene.html')).read()
    i = src.index('<svg viewBox="0 0 1080 1920"')
    return src[i:src.index('</svg>', i) + 6]


def scene11():  # STR host: kitchen counter at night, laptop says registration required, worried
    skin, top, hcol = "#c8916f", "#5a6b7d", "#3a2a22"
    defs = (lin("wall", [(0, "#1a1d24", None), (.5, "#343a46", None), (1, "#262b35", None)])
            + glow("lap", 540, 1150, 360, "#d6e6ff", .45)
            + rad("pend", 820, 640, 520, [(0, "#f4c27c", .25), (1, "#f4c27c", 0)]))
    b = '<rect width="1080" height="1920" fill="url(#wall)"/>'
    b += '<rect width="1080" height="1920" fill="url(#pend)"/>'
    b += '<rect x="60" y="660" width="330" height="200" rx="8" fill="#2b3140"/><rect x="80" y="680" width="290" height="160" fill="#3d4658"/>'
    b += '<path d="M120 840 L120 760 L200 710 L280 760 L280 840 Z" fill="#c9a36d" opacity=".8"/><rect x="185" y="790" width="30" height="50" fill="#8a6a45"/>'
    b += '<text x="225" y="705" font-family="Inter" font-size="22" font-weight="700" fill="#f2e6d2" text-anchor="middle" opacity=".85">WELCOME GUESTS</text>'
    b += '<path d="M800 600 L840 600 L870 660 L770 660 Z" fill="#c9a36d"/><rect x="818" y="520" width="4" height="80" fill="#222"/>'
    fig = figure(skin, "short", hcol, top, "sad", bow=True, slump=.75, collar="crew", blush=.12)
    fig += hands_phone(skin, shade(top, .9), phone=False)
    b += g(fig, ty=-10)
    tdefs, tb = table(1238, ("#6d5a4b", "#86705d"), "#463a30", "#1d1916", id_="tt11")
    b += tb
    b += ('<g transform="translate(400 1060)"><path d="M0 200 L280 200 L300 230 L-20 230 Z" fill="#9aa3ad"/>'
          '<rect x="10" y="0" width="260" height="190" rx="10" fill="#1c1f26"/><rect x="22" y="12" width="236" height="166" rx="4" fill="#f4f6fb"/>'
          '<rect x="22" y="12" width="236" height="30" fill="#c0392b"/>'
          '<text x="140" y="33" font-family="Inter" font-size="16" font-weight="700" fill="#fff" text-anchor="middle">ACTION REQUIRED</text>'
          '<text x="140" y="90" font-family="Inter" font-size="22" font-weight="800" fill="#1d1d24" text-anchor="middle">Short-term rental</text>'
          '<text x="140" y="118" font-family="Inter" font-size="22" font-weight="800" fill="#1d1d24" text-anchor="middle">registration</text>'
          '<rect x="60" y="138" width="160" height="26" rx="13" fill="#0a84ff"/><text x="140" y="156" font-family="Inter" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">Register now</text></g>')
    b += '<g transform="translate(780 1270)"><circle r="16" fill="none" stroke="#c9a24e" stroke-width="6"/><rect x="12" y="-4" width="50" height="8" rx="3" fill="#c9a24e"/><rect x="50" y="4" width="6" height="10" fill="#c9a24e"/></g>'
    b += '<rect x="180" y="1180" width="70" height="90" rx="8" fill="#e9dcc6"/><rect x="190" y="1196" width="50" height="6" fill="#b5a68f"/><rect x="190" y="1210" width="40" height="6" fill="#b5a68f"/>'
    b += '<rect width="1080" height="1920" fill="url(#lap)" style="mix-blend-mode:screen"/>'
    return svg(defs + tdefs, b)


SCENES = {1: scene1, 2: scene2, 3: scene3, 4: scene4, 5: scene5, 6: scene6, 7: scene7, 8: scene8, 9: scene9, 10: scene10, 11: scene11}

if __name__ == "__main__":
    n = int(sys.argv[1])
    open(sys.argv[2], "w").write(SCENES[n]())
