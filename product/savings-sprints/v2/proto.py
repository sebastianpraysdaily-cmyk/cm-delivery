"""Prototype of the redesigned tracker: AI line-art 'units' you color in (bestseller pattern), tiled with amounts.
Usage: python3 proto.py <lineart.png> <out_dir>"""
import sys, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

SRC, OUT = sys.argv[1], sys.argv[2]
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/.."
FR = lambda w, s: ImageFont.truetype(f"{ROOT}/fonts/fredoka-{w}.ttf", s)
INK = (31, 27, 46)

def clean_unit(path):
    g = np.array(Image.open(path).convert("L"))
    ink = g < 140
    ys, xs = np.where(ink); pad = 8
    ink = ink[max(0, ys.min() - pad):ys.max() + pad, max(0, xs.min() - pad):xs.max() + pad]
    return ink  # True = black line

def colorize(ink, palette):
    """fill each enclosed white region (not the outside background) with a palette color, largest first"""
    white = ~ink
    lab, n = ndimage.label(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    regions = [(int((lab == i).sum()), i) for i in range(1, n + 1) if i not in border]
    regions.sort(reverse=True)
    rgb = np.full(ink.shape + (3,), 255, np.uint8)
    total = ink.size
    for k, (area, i) in enumerate(regions):
        if area < total * 0.0008: col = palette[-1]          # tiny bits (highlights, seeds) keep a light tone
        else: col = palette[k % (len(palette) - 1)]
        rgb[lab == i] = col
    rgb[ink] = INK
    return Image.fromarray(rgb)

def unit_mask(ink):
    """opaque where the object is (lines + enclosed areas), transparent outside, so no box shows behind units"""
    lab, n = ndimage.label(~ink)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    outside = np.isin(lab, list(border))
    return Image.fromarray(((~outside) * 255).astype(np.uint8))

def lineart(ink):
    rgb = np.full(ink.shape + (3,), 255, np.uint8); rgb[ink] = INK
    return Image.fromarray(rgb)

def page(ink, title, goal, amounts, palette, accent, filled=0, dpi=150):
    W, H = int(8.5 * dpi), int(11 * dpi)
    img = Image.new("RGB", (W, H), (255, 252, 247)); d = ImageDraw.Draw(img)
    # header band with scalloped edge
    d.rectangle((0, 0, W, int(1.55 * dpi)), fill=accent)
    for x in range(0, W + 60, 60): d.ellipse((x - 30, int(1.55 * dpi) - 30, x + 30, int(1.55 * dpi) + 30), fill=accent)
    d.text((W / 2, int(0.62 * dpi)), title, font=FR(700, int(0.62 * dpi)), fill=INK, anchor="mm")
    d.text((W / 2, int(1.18 * dpi)), f"Save ${goal:,} · color a carton every time you save", font=FR(600, int(0.22 * dpi)), fill=INK, anchor="mm")
    # grid of units
    cols, rows = 5, (len(amounts) + 4) // 5
    top, left, right, bottom = int(2.05 * dpi), int(0.45 * dpi), W - int(0.45 * dpi), H - int(2.15 * dpi)
    cw = (right - left) / cols; chh = (bottom - top) / rows
    unit_h = int(chh * 0.72); colored = colorize(ink, palette); plain = lineart(ink); mask = unit_mask(ink)
    for i, a in enumerate(amounts):
        cx = left + (i % cols) * cw + cw / 2; cy = top + (i // cols) * chh
        src = colored if i < filled else plain
        size = (int(unit_h * src.width / src.height), unit_h)
        u = src.resize(size, Image.LANCZOS); m = mask.resize(size, Image.LANCZOS)
        img.paste(u, (int(cx - u.width / 2), int(cy)), m)
        pw, ph = int(0.62 * dpi), int(0.3 * dpi); py = cy + unit_h + int(0.05 * dpi)
        d.rounded_rectangle((cx - pw / 2, py, cx + pw / 2, py + ph), ph // 2, fill=accent if i < filled else (255, 255, 255), outline=INK, width=3)
        d.text((cx, py + ph / 2), f"${a}", font=FR(700, int(0.19 * dpi)), fill=INK, anchor="mm")
    # reward checkpoints + rows
    y = H - int(1.85 * dpi)
    labels = ["25% · tiny treat", "50% · tell a friend", "75% · free fun", "100% · your reward"]
    bw = (W - int(0.9 * dpi) - 3 * 14) / 4
    for k, l in enumerate(labels):
        x0 = int(0.45 * dpi) + k * (bw + 14)
        d.rounded_rectangle((x0, y, x0 + bw, y + int(0.42 * dpi)), 18, outline=INK, width=3, fill=(255, 255, 255))
        d.text((x0 + bw / 2, y + int(0.21 * dpi)), l, font=FR(600, int(0.15 * dpi)), fill=INK, anchor="mm")
    y2 = y + int(0.7 * dpi); f = FR(600, int(0.17 * dpi))
    d.text((int(0.45 * dpi), y2), "Started", font=f, fill=INK); d.line((int(1.3 * dpi), y2 + 26, int(3.9 * dpi), y2 + 26), fill=INK, width=3)
    d.text((int(4.3 * dpi), y2), "Finished", font=f, fill=INK); d.line((int(5.25 * dpi), y2 + 26, W - int(0.45 * dpi), y2 + 26), fill=INK, width=3)
    d.text((W / 2, H - int(0.35 * dpi)), "Savings Sprints", font=FR(600, int(0.14 * dpi)), fill=(120, 112, 140), anchor="mm")
    return img

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    ink = clean_unit(SRC)
    amts = [5, 10, 15, 5, 10, 20, 5, 10, 15, 10, 5, 10, 10, 5, 15, 10, 5, 10, 15, 0]
    amts[-1] = 200 - sum(amts[:-1])
    assert sum(amts) == 200 and min(amts) > 0, (sum(amts), amts)
    pal = [(255, 179, 199), (255, 241, 214), (255, 107, 129), (255, 143, 171), (255, 228, 236)]
    page(ink, "Strawberry Milk Fund", 200, amts, pal, (255, 205, 218), filled=0).save(f"{OUT}/strawberry_print.png")
    page(ink, "Strawberry Milk Fund", 200, amts, pal, (255, 205, 218), filled=8).save(f"{OUT}/strawberry_inprogress.png")
    print("ok", amts)
