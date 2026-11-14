# "One More Week" soundtrack: original synthesized comedy score + SFX, timed to the voice words and the picture
# beats (src/videos/dave/story.ts frames / 30). Uses the bridge short's DSP kit (dsp.py) and instruments.py.
# Output: ../../../public/dave/mix.wav (48 kHz stereo, exact picture length) + stems.
import json, os
import numpy as np
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, reson, colored, fades, place, pan, st, widen, make_ir, convolve_st, \
    integrated, true_peak, dbg, read_wav, write_wav, smooth_noise, phase, modal
from instruments import m2f, vibes, musicbox, pluck, pad, timpani, cymbal, brush, glock, brass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TOTAL = 1712
DUR = TOTAL / 30
N = ns(DUR)
R = rng(23)
fr = lambda f: f / 30.0

# ---------------------------------------------------------------- beats (seconds; mirror story.ts B)
ELEVEN1 = 2.568
ESCAPE = 4.127
FLASH = fr(154)
RAISES, ANNOUNCED = 5.448, 6.214
CAKE, CHAIR = 7.557, 8.73
FOUR, ALMOST, THIRD = 11.399, 12.29, 13.068
PLATE, GRABBED = fr(409), 14.019
SPEED0, HIT = fr(449), fr(485)
WINDOW, POSTER, POSTER_LAND = 17.522, 18.768, fr(570)
MONDAY = 23.633
PRESS = fr(706)
VENT = 25.247
EATING = 26.782
COUGHS = [fr(838), fr(851)]
RING, PICKUP = 28.5, 29.252
FEEL = 30.978
OUT = 32.108
SCREENS = fr(1018)
DAVE4 = 36.151
TURN0 = fr(1127)
WHISPER = 39.578
OMW = 40.05
LUCKY = 40.742
RUN0, FIRE_PUSH = fr(1226), 42.005
UNLUCKY = 42.563
OPENED, REVIEW = 43.409, 45.434
EXPLAIN = 46.016
WEEK, SEVENTY = 49.585, 51.55
LATER = 52.423
GRATE2 = fr(1600)
EATING2 = 54.45
DIE = fr(TOTAL - 10)


def buf():
    return np.zeros((2, N))


# ================================================================ MUSIC
music = buf()
phone = buf()   # hold music heard through the phone (band-limited later)
BPM = 118
beat = 60 / BPM
# C major office muzak: I - vi - IV - V (vibes comping, pizzicato bass, brushes, glock melody)
PROG = [(48, [64, 67, 72, 76]), (45, [64, 69, 72, 76]), (53, [65, 69, 72, 77]), (55, [62, 67, 71, 74])]
MEL = [79, 77, 76, 74, 76, None, 72, 74, 77, 76, 74, 72, 74, None, 79, None]


def muzak(t0, t1, vel=1.0, glock_on=True, warp=None, out=None):
    out = music if out is None else out
    bar = 4 * beat
    k = 0
    t = t0
    while t < t1 - 0.05:
        root, chord = PROG[k % 4]
        for b in range(4):
            tb = t + b * beat
            if tb >= t1:
                break
            ws = warp(tb) if warp else 1.0
            sw = 0.06 * beat if b % 2 else 0
            if b in (0, 2):
                place(out, pan(pluck(m2f(root - 12 + (7 if b == 2 else 0)) * ws, 0.75 * vel, R, 0.7, 0.35), -0.15), tb)
            if b in (1, 3):
                for i, m in enumerate(chord):
                    place(out, pan(vibes(m2f(m) * ws, 0.2 * vel, R, 1.0, damp=0.32 * beat), -0.3 + 0.2 * i), tb + sw + 0.004 * i)
            place(out, pan(brush(0.3 * vel * (1.0 if b % 2 else 0.6), R, 0.25), 0.3), tb)
            place(out, pan(brush(0.16 * vel, R, 0.25, swish=True), 0.35), tb + beat / 2 + sw)
            if glock_on:
                m = MEL[(k * 4 + b) % 16]
                if m is not None:
                    place(out, pan(glock(m2f(m + 12) * ws, 0.2 * vel, R, 1.2), 0.25), tb + sw)
        t += bar
        k += 1


def sneak(t0, t1, vel=0.6, root=48, fast=False):
    """tiptoe pizzicato: staccato chromatic walk + a vibes tick every 4"""
    seq = [0, 2, 3, 4, 7, 4, 3, 2]
    t, i = t0, 0
    while t < t1 - 0.02:
        m = root + seq[i % 8] + (12 if i % 2 else 0)
        place(music, pan(pluck(m2f(m), vel, R, 0.22, 0.75), -0.25 + 0.5 * (i % 2)), t)
        if i % 4 == 0:
            place(music, pan(vibes(m2f(m + 24), 0.1, R, 0.4, damp=0.12), 0.3), t)
        t += beat / (4 if fast else 2)
        i += 1


def stab(tm, notes, vel=0.6, cym=0.0, timp=True):
    for i, m in enumerate(notes):
        place(music, pan(pluck(m2f(m), vel, R, 1.6, 0.9), -0.4 + 0.25 * i), tm + 0.003 * i)
    place(music, pad([m2f(m) for m in notes], 1.4, 0.35 * vel, R, att=0.01, rel=1.2, warm=2500, detune=20), tm)
    if cym:
        place(music, cymbal(cym, R, 2.6, 0.8), tm)
    if timp:
        place(music, timpani(m2f(31), 0.9 * vel, R, 2.0), tm)


def drone(t0, t1, freqs, vel, warm=500):
    place(music, pad([m2f(m) for m in freqs], t1 - t0, vel, R, att=0.6, rel=1.0, warm=warm, detune=14), t0)


def sad_trombone(t0, vel=0.7):
    """wah, wah, wah, waaaah: four muted-brass notes falling a semitone each, the last one with a wide vibrato"""
    notes = [(55, 0.32), (54, 0.32), (53, 0.32), (52, 1.25)]
    t = t0
    for i, (m, d) in enumerate(notes):
        x = brass(m2f(m), d, vel, R, kind="horn", scoop=-40, rel=0.12, fall=(-0.6 if i == 3 else 0))
        n = len(x)
        tq = np.arange(n) / SR
        # plunger "wah": brightness opens then closes over each note
        bright = lp(x, 600) * (1 - np.sin(np.pi * np.clip(tq / (d + 0.1), 0, 1))) + x * np.sin(np.pi * np.clip(tq / (d + 0.1), 0, 1))
        if i == 3:
            vib = 1 + 0.25 * np.sin(TAU * 5.5 * tq) * np.clip(tq / 0.3, 0, 1)
            bright = bright * vib
        place(music, pan(bright, -0.1), t)
        t += d + 0.06


def slide_whistle(t0, f0, f1, dur, vel=0.4):
    t = tt(dur)
    f = f0 * (f1 / f0) ** (t / dur) * (1 + 0.012 * np.sin(TAU * 6 * t))
    y = np.sin(phase(f)) + 0.15 * np.sin(2 * phase(f))
    y += bp(R.standard_normal(len(t)), 1500, 6000) * 0.05
    return place(music, pan(fades(y * vel, 0.02, 0.08), 0.15), t0)


def record_scratch(t0, vel=0.5):
    d = 0.32
    t = tt(d)
    f = 900 * np.exp(-((t - 0.12) / 0.08) ** 2) + 250
    y = np.sin(phase(f * (1 + 0.6 * np.sin(TAU * 18 * t)))) * 0.3 + bp(R.standard_normal(len(t)), 600, 4000) * 0.6
    y *= np.sin(np.pi * t / d) ** 0.7
    place(music, st(y * vel), t0)


# ---- hook: cheery muzak; record scratch on "eleven"; Kevin bolts on a fast pizzicato run ----
muzak(0.0, ELEVEN1 - 0.02, 1.0)
record_scratch(ELEVEN1 - 0.06, 0.55)
place(music, pan(vibes(m2f(83), 0.3, R, 1.2), 0.2), ELEVEN1 + 0.25)
sneak(ESCAPE + 0.05, FLASH - 0.05, 0.6, root=60, fast=True)
# ---- the party: muzak again; a music-box twinkle on the chair cake; pops on the Daves ----
muzak(FLASH + 0.05, PLATE - 0.1, 1.0)
for i, m in enumerate([84, 88, 91, 96]):
    place(music, pan(musicbox(m2f(m), 0.35, R, 1.6), 0.25 - 0.1 * i), CHAIR - 0.05 + 0.07 * i)
stab(FOUR, [60, 64, 67], 0.25, timp=False)
for tm, m in ((ALMOST, 72), (THIRD, 76)):
    place(music, pan(glock(m2f(m + 12), 0.35, R, 1.0), 0.0), tm)
# ---- the escape: sneaky speed-walk theme, then SILENCE on the smack ----
sneak(PLATE, HIT - 0.04, 0.55, root=48)
sneak(SPEED0, HIT - 0.04, 0.35, root=60, fast=True)
# ---- the tries: sneaky theme continues under each attempt; comic stings on each fail ----
sneak(HIT + 0.55, POSTER - 0.05, 0.42, root=50)
slide_whistle(POSTER - 0.02, 1800, 420, 0.75, 0.32)
sneak(POSTER_LAND + 0.4, MONDAY - 0.1, 0.42, root=52)
place(music, pad([m2f(m) for m in [60, 64, 67, 71]], 1.0, 0.22, R, att=0.01, rel=0.6, warm=3000), MONDAY - 0.05)  # elevator "Monday" chord
sneak(MONDAY + 0.7, VENT - 0.05, 0.42, root=53)
# Dave in the vent: a single flat music-box note + low cluster
place(music, pan(musicbox(m2f(80.6), 0.4, R, 2.4), 0.1), VENT + 0.45)
drone(VENT + 0.3, COUGHS[0] - 0.4, [41, 47, 48], 0.16)
# ---- calling in sick: hold music through the phone, then the boss picks up ----
muzak(fr(822) + 0.1, OUT - 0.05, 0.9, glock_on=True, out=phone)
place(music, pan(glock(m2f(91), 0.3, R, 1.2), 0.3), FEEL + 0.05)
place(music, pan(glock(m2f(96), 0.3, R, 1.2), 0.3), FEEL + 0.22)
# ---- lights out: dead silence, then the screens: horror bed ----
drone(SCREENS, LUCKY - 0.05, [38, 45, 50, 51], 0.3)
drone(DAVE4 - 0.2, LUCKY - 0.05, [62, 63], 0.1, warm=1800)
stab(SCREENS + 0.02, [37, 43, 48, 50], 0.8, 0.4)
stab(DAVE4, [38, 44, 49, 50, 55], 0.75, 0.3)
for k in range(10):                                # heartbeat under the team turning
    tb = TURN0 - 0.9 + k * (0.62 - 0.02 * k)
    if tb > LUCKY - 0.2:
        break
    place(music, timpani(m2f(38), 0.4, R, 1.0), tb)
    place(music, timpani(m2f(38), 0.25, R, 0.8), tb + 0.2)
sw = cymbal(0.6, R, 1.1, 1.2)[::-1]
place(music, st(sw), OMW - 1.05)
stab(OMW + 0.02, [37, 43, 48, 50, 56], 0.85, 0.4)
# ---- luckily: hopeful run + bright major swell as the fire door opens ----
sneak(LUCKY + 0.1, FIRE_PUSH - 0.05, 0.55, root=60, fast=True)
place(music, pad([m2f(m) for m in [60, 64, 67, 72, 76]], UNLUCKY - FIRE_PUSH + 0.25, 0.3, R, att=0.05, rel=0.25, warm=4000), FIRE_PUSH)
for i, m in enumerate([72, 76, 79, 84]):
    place(music, pan(glock(m2f(m + 12), 0.28, R, 1.2), 0.2), FIRE_PUSH + 0.05 + 0.06 * i)
# ---- unluckily: sad trombone, then a stiff little "meeting" vamp ----
sad_trombone(UNLUCKY + 0.12, 0.65)
stab(REVIEW, [41, 47, 52], 0.45, timp=True)
# ---- explanation + time-lapse: music box lullaby that speeds up with the weeks ----
LULL = [72, 77, 76, 74, 72, 69, 70, 72, 74, 72, 69, 65, 67, 69, 70, 69, 65, 64, 65, None]
t, i = EXPLAIN + 0.15, 0
while t < LATER - 0.15:
    m = LULL[i % len(LULL)]
    if m is not None:
        place(music, pan(musicbox(m2f(m + 12) * (1 + 0.003 * np.sin(i)), 0.42, R, 1.6), -0.1 + 0.2 * np.sin(i)), t)
    if i % 4 == 0:
        place(music, pan(musicbox(m2f([53, 50, 46, 48][(i // 4) % 4] + 12), 0.28, R, 2.0), -0.3), t)
    t += (0.42 if t < WEEK else max(0.12, 0.42 - 0.11 * (t - WEEK)))
    i += 1
# ---- ten years later: the muzak, slowly warping flat; final stab as the lights die ----
warp = lambda tb: 1.0 if tb < EATING2 else 2 ** (-(tb - EATING2) * 0.8 / 12)
muzak(LATER, DIE - 0.25, 0.85, warp=warp)
place(music, pad([m2f(m) for m in [41, 47, 52]], DIE - GRATE2, 0.14, R, att=1.2, rel=0.3, warm=500, detune=18), GRATE2)
stab(DIE, [29, 35, 40, 41], 0.8, 0.4)

# ================================================================ SFX
sfx = buf()


def step(r, vel=0.5, carpet=True):
    n = ns(0.18)
    t = np.arange(n) / SR
    x = lp(r.standard_normal(n), 900 if carpet else 2400, 2) * np.exp(-t / (0.035 if carpet else 0.02))
    thump = np.sin(TAU * 70 * t) * np.exp(-t / 0.04) * 0.6
    return (x + thump) * vel


def clink(r, f=2600, vel=0.4, dur=0.6):
    return modal(dur, [(f, 1.0, 0.25), (f * 2.32, 0.5, 0.12), (f * 3.9, 0.25, 0.06)], r) * vel


def whoosh(r, dur=0.6, f0=300, f1=3000, vel=0.6):
    n = ns(dur)
    t = np.arange(n) / SR
    x = r.standard_normal(n)
    fc = f0 * (f1 / f0) ** np.clip(t / dur, 0, 1)
    y = np.zeros(n)
    hop = 512
    for a in range(0, n, hop):
        y[a:a + hop] = bp(x[a:a + hop + 2048], max(60, fc[a] * 0.6), min(18000, fc[a] * 1.6), 1)[:min(hop, n - a)]
    return y * np.sin(np.pi * t / dur) ** 2 * vel


def thud(r, vel=0.8, f=60):
    t = tt(0.4)
    return (np.sin(TAU * f * t * (1 + 0.6 * np.exp(-t / 0.03))) * np.exp(-t / 0.09) + lp(r.standard_normal(len(t)), 500) * np.exp(-t / 0.03)) * vel


def boing(r, vel=0.5, dur=0.7):
    t = tt(dur)
    f = 160 * (1 + 0.5 * np.exp(-t / 0.05)) * (1 + 0.14 * np.sin(TAU * 22 * t) * np.exp(-t / 0.35))
    return np.sin(phase(f)) * np.exp(-t / 0.25) * vel


def glass_wobble(r, vel=0.4):
    return modal(0.9, [(310, 1, 0.3), (742, 0.6, 0.18), (1730, 0.35, 0.1), (2650, 0.2, 0.06)], r) * vel


def paper(r, dur=0.25, vel=0.3):
    n = ns(dur)
    t = np.arange(n) / SR
    crackle = bp(r.standard_normal(n), 1500, 8000) * (smooth_noise(n, r, 40) > 0.3)
    return crackle * np.sin(np.pi * t / dur) * vel


def click(r, vel=0.4, f=2500):
    return modal(0.06, [(f, 1, 0.008), (f * 1.9, 0.5, 0.005)], r) * vel


def ding(r, vel=0.5):
    return modal(1.6, [(1568, 1, 0.8), (1568 * 2.0, 0.2, 0.35), (1568 * 2.76, 0.12, 0.2)], r) * vel


def clank(r, vel=0.6):
    m = modal(0.8, [(420, 1, 0.25), (1130, 0.7, 0.15), (2210, 0.5, 0.1), (3480, 0.3, 0.06)], r)
    th = thud(r, 0.4, 90)
    m[:len(th)] += th[:len(m)]
    return m * vel


def crunch(r, vel=0.35, dur=0.18):
    n = ns(dur)
    t = np.arange(n) / SR
    return bp(r.standard_normal(n), 700, 5000) * (smooth_noise(n, r, 60) > 0.1) * np.exp(-t / 0.06) * vel


def cough(r, vel=0.5):
    d = 0.32
    t = tt(d)
    burst = bp(r.standard_normal(len(t)), 350, 2600) * (np.exp(-t / 0.05) + 0.4 * np.exp(-((t - 0.17) / 0.04) ** 2))
    return (reson(burst, 650, 3) * 0.5 + burst) * vel


def ring(r, dur=0.7, vel=0.25):
    t = tt(dur)
    tone = (np.sin(TAU * 440 * t) + np.sin(TAU * 480 * t)) * (np.sin(TAU * 20 * t) > 0)
    return fades(tone * vel, 0.01, 0.05)


def buzz(dur, vel, r):
    n = ns(dur)
    t = np.arange(n) / SR
    y = np.sign(np.sin(TAU * 120 * t)) * 0.3 + np.sin(TAU * 240 * t) * 0.3 + hp(r.standard_normal(n), 3000) * 0.05
    return lp(y, 2500) * vel


def tick(r, f=3200, vel=0.4):
    return modal(0.05, [(f, 1, 0.006), (f * 1.7, 0.5, 0.004)], r) * vel


# room tone (HVAC) except in the blackout, which is dead quiet but for the screens' whine
room = lp(colored(N, R, 1.6), 900) * 0.006
room[ns(OUT):ns(LUCKY)] *= 0.25
place(sfx, widen(room, R, 9, 0.7), 0)
# hook / bolt
for k in range(7):
    place(sfx, pan(step(R, 0.5, False), 0.2 + 0.08 * k), ESCAPE + 0.15 + k * 0.2)
place(sfx, whoosh(R, 0.45, 400, 4000, 0.5), FLASH - 0.3)
place(sfx, pan(clink(R, 2200, 0.25), -0.3), RAISES + 0.05)
for tm in (ALMOST, THIRD):
    n = ns(0.12)
    t = np.arange(n) / SR
    place(sfx, np.sin(phase(np.linspace(380, 900, n))) * np.exp(-t / 0.04) * 0.45, tm - 0.03)
place(sfx, pan(clink(R, 3100, 0.35), 0.3), PLATE)
place(sfx, pan(whoosh(R, 0.35, 600, 2500, 0.35), 0.2), GRABBED)
# speed-walk (carpet), then the SMACK into the glass door
for k in range(int((HIT - SPEED0) / 0.21)):
    place(sfx, pan(step(R, 0.42), 0.12 * (-1) ** k), SPEED0 + 0.05 + k * 0.21)
place(sfx, thud(R, 0.9), HIT)
place(sfx, glass_wobble(R, 0.45), HIT)
place(sfx, pan(boing(R, 0.38), 0.0), HIT + 0.04)
# the poster: rustle when grabbed, flap as it falls, slap on the floor
place(sfx, pan(paper(R, 0.3, 0.25), 0.3), WINDOW + 0.2)
place(sfx, pan(whoosh(R, 0.4, 500, 2500, 0.3), 0.3), POSTER - 0.15)
place(sfx, pan(thud(R, 0.25, 140) + np.pad(paper(R, 0.15, 0.3), (0, ns(0.4) - ns(0.15))), 0.3), POSTER_LAND)
# elevator: click, ding
place(sfx, pan(click(R, 0.45), 0.2), PRESS)
place(sfx, pan(ding(R, 0.32), -0.2), MONDAY + 0.12)
# the vent: grate yanked off and clattering down; crunch, chew
place(sfx, pan(clank(R, 0.55), 0.1), VENT - 0.05)
place(sfx, pan(clank(R, 0.35), 0.2), VENT + 0.2)
place(sfx, pan(crunch(R, 0.4), 0.0), EATING + 0.05)
for k in range(5):
    place(sfx, pan(crunch(R, 0.16, 0.1), 0.0), EATING + 0.2 + k * 0.14)
# calling in sick: two fake coughs, the boss's phone rings over the divider, click
for c in COUGHS:
    place(sfx, pan(cough(R, 0.45), -0.1), c + 0.03)
place(sfx, pan(ring(R, 0.55, 0.12), -0.45), RING)
place(sfx, pan(click(R, 0.35, 1800), -0.4), PICKUP)
# lights out: stutter, clunk, hum dies
for k in range(5):
    place(sfx, pan(click(R, 0.3, 900), R.uniform(-0.4, 0.4)), OUT - 0.27 + k * 0.066)
place(sfx, thud(R, 0.7, 45), OUT)
hum = buzz(0.6, 0.03, R) * np.linspace(1, 0, ns(0.6))
place(sfx, hum, OUT)
# screens on: CRT thoom + a thin whine under the dark stretch
t = tt(0.5)
place(sfx, st(np.sin(TAU * 55 * t) * np.exp(-t / 0.15) * 0.6 + hp(R.standard_normal(len(t)), 2000) * np.exp(-t / 0.05) * 0.2), SCREENS)
wh = np.sin(TAU * 7800 * tt(LUCKY - SCREENS)) * 0.004
place(sfx, st(fades(wh, 0.2, 0.3)), SCREENS)
# the team turning: shoes and creaks one by one
for k in range(7):
    place(sfx, pan(step(R, 0.18) + np.pad(click(R, 0.05, 600), (0, ns(0.18) - ns(0.06))), -0.5 + k * 0.16), TURN0 + k * 0.1)
# the whisper bed under "whispering, one more week"
n = ns(OMW + 0.45 - WHISPER + 0.3)
wbed = bp(R.standard_normal(n), 2500, 9000) * (0.5 + 0.5 * smooth_noise(n, R, 7)) * 0.05
place(sfx, widen(fades(wbed, 0.2, 0.25), R, 13, 0.9), WHISPER - 0.3)
# the run to the fire exit, the push bar, the door, the light
for k in range(int((FIRE_PUSH - RUN0) / 0.17)):
    place(sfx, pan(step(R, 0.45), 0.1 * (-1) ** k), RUN0 + k * 0.17)
place(sfx, pan(clank(R, 0.35), 0.25), FIRE_PUSH - 0.03)
place(sfx, pan(whoosh(R, 0.5, 300, 2000, 0.35), 0.25), FIRE_PUSH + 0.05)
# review: folder slap
place(sfx, pan(thud(R, 0.2, 200) + np.pad(paper(R, 0.1, 0.2), (0, ns(0.4) - ns(0.1))), -0.1), REVIEW - 0.05)
# time-lapse clock, faster and faster
t = WEEK - 1.6
while t < SEVENTY + 0.9:
    place(sfx, pan(tick(R, 3000, 0.25), -0.2), t)
    t += 0.5 if t < WEEK else max(0.06, 0.5 - 0.2 * (t - WEEK))
# ten years later: the grate again, crunch, chew
place(sfx, pan(clank(R, 0.5), -0.1), GRATE2)
place(sfx, pan(clank(R, 0.3), -0.2), GRATE2 + 0.25)
place(sfx, pan(crunch(R, 0.4), 0.0), EATING2 + 0.05)
for k in range(6):
    place(sfx, pan(crunch(R, 0.15, 0.1), 0.0), EATING2 + 0.2 + k * 0.15)
place(sfx, buzz(0.7, 0.03, R), DIE - 0.6)
n = ns(0.3)
place(sfx, bp(R.standard_normal(n), 500, 6000) * np.exp(-np.arange(n) / SR / 0.05) * 0.5, DIE)

# ================================================================ MIX
ir_room = make_ir(0.7, 3, hf=1.6)
ir_hall = make_ir(2.2, 5, hf=1.1)
# phone line: band-limit the hold music and tuck it in at the left (Kevin's ear)
phone_bl = np.stack([bp(phone[0] + phone[1], 350, 3200, 3) * 0.5] * 2)
phone_bl[1] *= 0.6
music_all = music + phone_bl * 0.7
music_w = music_all + 0.18 * convolve_st(music_all, ir_room)
hz0, hz1 = ns(OUT), ns(LUCKY + 0.5)
music_w[:, hz0:hz1] += 0.35 * convolve_st(music_all[:, hz0:hz1], ir_hall)[:, :hz1 - hz0]
sfx_w = sfx + 0.12 * convolve_st(sfx, ir_room)

vx, vsr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
assert vsr == SR
v = vx.mean(0) if vx.shape[0] > 1 else vx[0]
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]
voice = st(voice)
words = json.load(open(os.path.join(ROOT, "voice", "words.json")))["words"]


def duck(depth_db=-9.0, pre=0.08, post=0.15, att=0.06, rel=0.4):
    ctrl = 1000
    nc = int(DUR * ctrl) + 2
    va = np.zeros(nc)
    for _, s, e in words:
        va[max(0, int((s - pre) * ctrl)): int((e + post) * ctrl)] = 1
    ka, kr = 1 - np.exp(-1 / (att * ctrl)), 1 - np.exp(-1 / (rel * ctrl))
    env = np.zeros(nc); e = 0.0
    for i in range(nc):
        e += (va[i] - e) * (ka if va[i] > e else kr); env[i] = e
    return dbg(np.interp(np.arange(N) / SR, np.arange(nc) / ctrl, depth_db * env))


Lv = integrated(voice)
voice *= dbg(-17.0 - Lv)
music_w *= dbg(-21.0 + 3.0 + 1.0 - integrated(music_w))   # bed ~9 dB under speech once ducked, +3 dB (standard mix)
sfx_w *= dbg(-24.0 - 6.0 + 8.0 - integrated(sfx_w))       # SFX -6 dB (standard mix) from their event level
music_d = music_w * duck()[None, :]
mix = voice + music_d + sfx_w
mix *= dbg(-14.0 - integrated(mix))
if true_peak(mix) > -1.0:
    lim = dbg(-1.2)
    mix = np.tanh(mix / lim) * lim
mix = fades(mix, 0.005, 0.05)
write_wav(os.path.join(HERE, "stem_music.wav"), music_d)
write_wav(os.path.join(HERE, "stem_sfx.wav"), sfx_w)
write_wav(os.path.join(HERE, "mix.wav"), mix)
pub = os.path.join(ROOT, "..", "..", "public", "dave")
os.makedirs(pub, exist_ok=True)
write_wav(os.path.join(pub, "mix.wav"), mix)
print("dur", mix.shape[1] / SR, "LUFS", round(integrated(mix), 2), "TP", round(true_peak(mix), 2),
      "voice", round(integrated(voice), 1), "music", round(integrated(music_d), 1), "sfx", round(integrated(sfx_w), 1))
