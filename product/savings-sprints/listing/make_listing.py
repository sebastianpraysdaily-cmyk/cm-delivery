"""Listing images for the Savings Challenges Mega Bundle (2000x1500, Etsy's 4:3).
Uses real rendered bundle pages + CC0 Openverse desk photos (see assets/openverse/CREDITS.json)."""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

H = os.path.dirname(os.path.abspath(__file__)); ROOT = H + "/.."
W, HH = 2000, 1500
INK = (31, 27, 46); WHITE = (255, 255, 255); SUN = (255, 210, 63); PINK = (255, 95, 162); MINT = (61, 220, 151); SKY = (76, 201, 240); GRAPE = (123, 97, 255); CREAM = (255, 249, 242)
F = lambda w, s: ImageFont.truetype(f"{ROOT}/fonts/fredoka-{w}.ttf", s)
I = lambda s: ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Bold.otf", s)
pg = lambda n: Image.open(f"{H}/pages/pg{n:02d}.png").convert("RGBA")
OUT = H + "/out"; os.makedirs(OUT, exist_ok=True)

def backdrop(photo, blur=3, dark=0.92):
    im = Image.open(f"{ROOT}/assets/openverse/{photo}").convert("RGB")
    s = max(W / im.width, HH / im.height); im = im.resize((int(im.width * s) + 1, int(im.height * s) + 1), Image.LANCZOS)
    im = im.crop(((im.width - W) // 2, (im.height - HH) // 2, (im.width - W) // 2 + W, (im.height - HH) // 2 + HH))
    im = im.filter(ImageFilter.GaussianBlur(blur)); return ImageEnhance.Brightness(im).enhance(dark)

def paper(img, page, x, y, w, rot=0, shadow=40):
    p = page.resize((w, int(w * page.height / page.width)), Image.LANCZOS)
    p = p.rotate(rot, expand=True, resample=Image.BICUBIC)
    sh = Image.new("RGBA", p.size, (0, 0, 0, 0)); sh.paste((10, 8, 20, 120), (0, 0), p.split()[3]); sh = sh.filter(ImageFilter.GaussianBlur(shadow / 2))
    img.paste(sh, (int(x + shadow * 0.4), int(y + shadow * 0.6)), sh); img.paste(p, (int(x), int(y)), p)

def pill(d, xy, text, fill, font, fg=INK, pad=(34, 16), outline=True):
    x, y = xy; tw = d.textlength(text, font=font); h = font.size + pad[1] * 2
    d.rounded_rectangle((x, y, x + tw + pad[0] * 2, y + h), h // 2, fill=fill, outline=INK if outline else None, width=5 if outline else 0)
    d.text((x + pad[0], y + h / 2), text, font=font, fill=fg, anchor="lm"); return x + tw + pad[0] * 2

def img1():
    img = backdrop("photo_1.jpg", blur=2, dark=0.95).convert("RGBA")
    for k, (n, x, y, r) in enumerate([(30, 80, 360, 9), (23, 250, 300, 4), (35, 430, 260, -2), (66, 610, 300, -7), (3, 760, 380, -12)]):
        paper(img, pg(n), x, y, 560, r)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((1250, 150, 1920, 1350), 50, fill=INK)
    d.text((1585, 360), "63", font=F(700, 300), fill=SUN, anchor="mm")
    d.text((1585, 570), "Savings", font=F(700, 120), fill=WHITE, anchor="mm"); d.text((1585, 690), "Challenges", font=F(700, 112), fill=WHITE, anchor="mm")
    y = 820
    for t, c in [("70 printable pages", MINT), ("Letter + A6 cash binder", SKY), ("+ Savings game app", PINK)]:
        f = F(700, 52); tw = d.textlength(t, font=f); pill(d, (1585 - tw / 2 - 34, y), t, c, f); y += 130
    d.text((1585, 1260), "$100 to $10,000 · every goal", font=F(600, 44), fill=(220, 214, 240), anchor="mm")
    return img

def img2():
    img = Image.new("RGBA", (W, HH), CREAM); d = ImageDraw.Draw(img)
    d.text((W / 2, 110), "Every goal. Every amount. Every timeframe.", font=F(700, 84), fill=INK, anchor="mm")
    items = [(4, "7-day sprints"), (20, "$10,000 challenge"), (23, "26 paychecks"), (27, "52-week"), (30, "100 envelope"), (35, "Emergency fund"),
             (39, "Christmas fund"), (40, "Vacation fund"), (42, "House deposit"), (44, "Wedding fund"), (52, "12 monthly $500"), (64, "No-spend month")]
    cw, ch = 300, 388; gx = (W - 6 * cw - 5 * 22) / 2
    for i, (n, label) in enumerate(items):
        x = gx + (i % 6) * (cw + 22); y = 230 + (i // 6) * (ch + 150)
        paper(img, pg(n), x, y, cw, 0, shadow=24)
        d.text((x + cw / 2, y + ch + 50), label, font=F(700, 40), fill=INK, anchor="mm")
    return img

def img3():
    img = backdrop("photo_5.jpg", blur=3, dark=0.9).convert("RGBA")
    paper(img, pg(23), 120, 120, 900, -4)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((1110, 300, 1900, 1200), 50, fill=CREAM, outline=INK, width=6)
    d.text((1505, 420), "Save $4,000", font=F(700, 104), fill=INK, anchor="mm"); d.text((1505, 540), "in 26 paychecks", font=F(700, 80), fill=PINK, anchor="mm")
    for k, t in enumerate(["Paid every 2 weeks?", "One box per paycheck.", "Done in one year."]):
        d.text((1505, 700 + k * 90), t, font=F(600, 54), fill=INK, anchor="mm")
    d.text((1505, 1090), "Also: $1k · $2k · $6k versions", font=F(600, 44), fill=(91, 86, 112), anchor="mm")
    return img

def img4():
    img = Image.new("RGBA", (W, HH), (232, 246, 252)); d = ImageDraw.Draw(img)
    sheet = Image.new("RGBA", (1100, 1424), WHITE); sd = ImageDraw.Draw(sheet)
    for k, n in enumerate([31, 39, 48, 62]):
        p = pg(n).resize((520, 673), Image.LANCZOS); sheet.paste(p, (20 + (k % 2) * 540, 30 + (k // 2) * 700), p)
    sd.line((550, 10, 550, 1414), fill=(170, 170, 190), width=4); sd.line((10, 712, 1090, 712), fill=(170, 170, 190), width=4)
    paper(img, sheet, 120, 60, 1000, -3)
    d.text((1560, 480), "A6 cash binder", font=F(700, 96), fill=INK, anchor="mm"); d.text((1560, 590), "ready", font=F(700, 96), fill=SKY, anchor="mm")
    for k, t in enumerate(["Print 4 per sheet, cut,", "punch, done.", "Or print Letter size,", "or use GoodNotes."]):
        d.text((1560, 760 + k * 80), t, font=F(600, 54), fill=INK, anchor="mm")
    return img

def img5():
    img = backdrop("photo_1.jpg", blur=4, dark=0.85).convert("RGBA"); d = ImageDraw.Draw(img)
    scr = Image.open(f"{ROOT}/../../content/v003/assets/app_home.png").convert("RGBA")
    pw = 560; ph = int(pw * scr.height / scr.width)
    phone = Image.new("RGBA", (pw + 50, ph + 50), (0, 0, 0, 0)); pd = ImageDraw.Draw(phone)
    pd.rounded_rectangle((0, 0, pw + 49, ph + 49), 80, fill=INK)
    m = Image.new("L", (pw, ph), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, pw - 1, ph - 1), 60, fill=255)
    phone.paste(scr.resize((pw, ph), Image.LANCZOS), (25, 25), m)
    phone = phone.resize((int(phone.width * 1250 / phone.height), 1250), Image.LANCZOS)
    paper(img, phone, 200, 110, phone.width, -5, shadow=50)
    d.rounded_rectangle((1000, 330, 1890, 1170), 50, fill=INK)
    d.text((1445, 440), "BONUS", font=F(700, 64), fill=SUN, anchor="mm")
    d.text((1445, 560), "Savings game app", font=F(700, 86), fill=WHITE, anchor="mm")
    for k, t in enumerate(["Tap to color in what you saved", "Combos, loot, levels, badges", "Confetti when you finish", "iPhone + Android, no app store"]):
        d.text((1445, 700 + k * 92), "✓ " + t if False else t, font=F(600, 50), fill=(230, 226, 245), anchor="mm")
    return img

def img6():
    img = Image.new("RGBA", (W, HH), CREAM); d = ImageDraw.Draw(img)
    p = pg(14); crop = p.crop((80, 520, p.width - 80, 1300)); crop = crop.resize((1100, int(1100 * crop.height / crop.width)), Image.LANCZOS)
    paper(img, crop, 90, 330, crop.width, 0, shadow=30)
    d.text((W / 2, 150), "Every page adds up exactly", font=F(700, 92), fill=INK, anchor="mm")
    d.rounded_rectangle((1290, 420, 1910, 1160), 46, fill=WHITE, outline=INK, width=6)
    for k, (a, b) in enumerate([("63", "challenges"), ("70", "pages"), ("2", "sizes"), ("1", "game app")]):
        d.text((1420, 520 + k * 170), a, font=F(700, 96), fill=[PINK, MINT, SKY, GRAPE][k], anchor="mm")
        d.text((1500, 520 + k * 170), b, font=F(600, 60), fill=INK, anchor="lm")
    d.text((W / 2, 1400), "Instant download · personal use · not financial advice", font=F(600, 40), fill=(91, 86, 112), anchor="mm")
    return img

if __name__ == "__main__":
    for i, fn in enumerate([img1, img2, img3, img4, img5, img6], 1):
        fn().convert("RGB").save(f"{OUT}/listing_{i}.jpg", quality=90)
    print("ok")
