# "Friday Night Inventory" soundtrack: original synthesized horror-spoof score + SFX, timed to the voice words and the picture
# beats (src/videos/linda/story.ts frames / 30). Uses the bridge short's DSP kit (dsp.py) and instruments.py.
# Output: ../../../public/linda/mix.wav (48 kHz stereo, exact picture length) + stems.
import json, os
import numpy as np
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, reson, colored, fades, place, pan, st, widen, make_ir, convolve_st, \
    integrated, true_peak, dbg, read_wav, write_wav, smooth_noise, phase, modal
from instruments import m2f, vibes, musicbox, pluck, pad, timpani, cymbal, brush, glock, brass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TOTAL = 1470
DUR = TOTAL / 30
N = ns(DUR)
R = rng(23)
fr = lambda f: f / 30.0

# ---------------------------------------------------------------- beats (seconds; mirror story.ts B)
DIE, FLICKER, LEAVE = fr(126), fr(160), fr(236)
TIP0, CLOSET, INSIDE = fr(249), fr(307), fr(327)
LINDA1, DAVE1, BREATH, INVENTORY = fr(375), fr(399), fr(443), fr(513)
RUN0, OPENED, AGAIN, STILL = fr(539), fr(594), fr(614), fr(682)
VENT, LINDA3, ITGUY = fr(743), fr(752), fr(814)
THIRD, TEAM = fr(851), fr(978)
OUT, HAND, TURN, LINDA4, WINK = fr(1011), fr(1047), fr(1084), fr(1143), fr(1164)
OH, YOU, HO = fr(1190), fr(1228), fr(1238)
MONDAY, BYLINDA, CLOSET2 = fr(1266), fr(1369), fr(1402)
DIE_END = fr(TOTAL - 10)


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



def funk(t0, dur=1.6, vel=0.6):
    """the sleazy funk sting for every Linda reveal: wah bass + muted guitar chanks + a hi-hat, 96 bpm"""
    bt = 60 / 96
    bass = [(0, 40, 0.5), (0.75, 43, 0.25), (1.0, 45, 0.25), (1.5, 43, 0.25), (2.0, 40, 0.5)]
    for b0, m, d in bass:
        if b0 * bt > dur:
            break
        x = brass(m2f(m), d * bt, vel, R, kind="soft", scoop=-60, rel=0.05)
        n = len(x); tq = np.arange(n) / SR
        wah = lp(x, 300) * (1 - np.sin(np.pi * np.clip(tq / (d * bt + 0.05), 0, 1))) + x * np.sin(np.pi * np.clip(tq / (d * bt + 0.05), 0, 1))
        place(music, pan(wah * 1.4, -0.1), t0 + b0 * bt)
    for k in range(int(dur / (bt / 2))):
        tb = t0 + k * bt / 2
        if k % 2:
            for i, m in enumerate([64, 67, 71]):
                place(music, pan(pluck(m2f(m), 0.35 * vel, R, 0.08, 0.9), 0.35), tb + 0.003 * i)
        place(music, pan(brush(0.22 * vel, R, 0.08), 0.4), tb)


def sting(tm, vel=0.8):
    """horror stinger: dissonant string-like stab + timpani"""
    stab(tm, [37, 43, 48, 50, 56], vel, 0.35)


# ---- night office: a suspense drone with a slow ticking pulse; horror zoom on "die" ----
drone(0.0, CLOSET + 0.5, [38, 45, 50], 0.2)
drone(FLICKER, CLOSET + 0.5, [62, 63], 0.07, warm=1800)
for k in range(40):
    tb = 0.3 + k * 0.6
    if tb > INSIDE - 0.2:
        break
    place(music, pan(pluck(m2f(38), 0.25, R, 0.4, 0.3), -0.2), tb)
sting(DIE, 0.85)
# the tiptoe: classic sneaky pizzicato
sneak(TIP0, CLOSET + 0.3, 0.45, root=50)
sw = cymbal(0.5, R, 0.9, 1.2)[::-1]
place(music, st(sw), INSIDE - 0.9)
sting(INSIDE, 0.7)
# ---- Linda reveals: funk sting each time ----
funk(LINDA1 - 0.05, 1.5, 0.55)
funk(INVENTORY - 0.05, 1.2, 0.5)
sting(OPENED + 0.05, 0.6)
funk(AGAIN - 0.05, 1.8, 0.55)
funk(STILL - 0.05, 1.0, 0.5)
sting(VENT, 0.55)
funk(LINDA3 + 0.1, 1.6, 0.55)
# the board: true-crime piano-ish (vibes) motif, then the funk again for "the whole team"
for i, m in enumerate([62, 65, 69, 68, 65, 62, 61, 62]):
    place(music, pan(vibes(m2f(m), 0.32, R, 1.4), -0.2 + 0.05 * i), THIRD - 0.3 + i * 0.36)
funk(TEAM - 0.1, 1.0, 0.6)
# ---- lights out: dead silence, a heartbeat, the hand: big sting; the slow turn: rising cluster ----
for k in range(9):
    tb = OUT + 0.4 + k * 0.62
    if tb > HAND - 0.15:
        break
    place(music, timpani(m2f(36), 0.4, R, 1.0), tb)
    place(music, timpani(m2f(36), 0.25, R, 0.8), tb + 0.2)
sting(HAND, 0.95)
drone(HAND + 0.3, LINDA4 - 0.05, [37, 38, 44, 49, 50], 0.25, warm=900)
sting(LINDA4, 0.8)
# the wink: a sparkle + the funk, loud and proud
for i, m in enumerate([96, 100, 103, 108]):
    place(music, pan(glock(m2f(m), 0.3, R, 1.0), 0.3), WINK + 0.04 * i)
funk(WINK + 0.15, 0.75, 0.65)
# "Oh, fuck": music cuts. "You a ho": record scratch, then a meme bass drop
record_scratch(YOU - 0.12, 0.5)
t = tt(1.4)
boom = np.sin(phase(55 * (1 + 1.5 * np.exp(-t / 0.08)))) * np.exp(-t / 0.5) * 0.9
place(music, st(boom), HO + 0.05)
place(music, cymbal(0.4, R, 2.0, 0.8), HO + 0.05)
# ---- Monday: the bright office muzak, smug; the funk sting on "By Linda"; final sting at the closet ----
muzak(MONDAY + 0.1, BYLINDA - 0.1, 0.85)
funk(BYLINDA, 1.0, 0.55)
muzak(BYLINDA + 1.0, DIE_END - 0.2, 0.75, glock_on=False)
funk(CLOSET2, 1.4, 0.6)

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


# room tone (night HVAC), almost nothing in the blackout, office murmur on Monday
room = lp(colored(N, R, 1.6), 900) * 0.006
room[ns(OUT):ns(MONDAY)] *= 0.3
place(sfx, widen(room, R, 9, 0.7), 0)
# a wall clock ticking through the night
t = 0.2
while t < INSIDE:
    place(sfx, pan(tick(R, 2600, 0.12), 0.4), t)
    t += 1.0
# flicker clicks + buzz
for k in range(12):
    place(sfx, pan(click(R, 0.25, 900) + np.pad(buzz(0.04, 0.04, R), (0, ns(0.06) - ns(0.04))), R.uniform(-0.4, 0.4)), FLICKER + k * 0.1 * R.uniform(0.7, 1.3))
# tiptoe: squeaky shoes
for k in range(int((CLOSET - TIP0) / 0.42)):
    tm = TIP0 + 0.1 + k * 0.42
    sq = np.sin(phase(np.linspace(1800, 2600, ns(0.07)))) * np.hanning(ns(0.07)) * 0.08
    place(sfx, pan(step(R, 0.18) + np.pad(sq, (0, ns(0.18) - ns(0.07))), 0.1 * (-1) ** k), tm)
# the closet door creaks open
def creak(r, dur=0.9, vel=0.5):
    n = ns(dur)
    tq = np.arange(n) / SR
    f = 170 + 110 * np.sin(np.pi * tq / dur) + 25 * smooth_noise(n, r, 6)
    imp = (np.sin(phase(f)) > 0.97).astype(float)
    y = reson(imp, 700, 6) + reson(imp, 1500, 8) * 0.5
    return y / (np.abs(y).max() + 1e-9) * np.sin(np.pi * tq / dur) * vel
place(sfx, pan(creak(R, 1.0, 0.4), 0.3), CLOSET + 0.25)
# heavy breathing (two people) in the closet and the elevator
def pant_noise(dur, rate, vel, r):
    n = ns(dur)
    tq = np.arange(n) / SR
    env = np.clip(np.sin(TAU * rate * tq), 0, 1) ** 1.5 + 0.6 * np.clip(-np.sin(TAU * rate * tq), 0, 1) ** 2
    return bp(r.standard_normal(n), 500, 3500) * env * vel
for t0, t1 in ((INSIDE + 0.25, RUN0 - 0.05), (OPENED + 0.4, VENT - 0.6), (LINDA3 + 0.1, THIRD - 0.4)):
    place(sfx, pan(fades(pant_noise(t1 - t0, 1.6, 0.05, R), 0.1, 0.2), -0.25), t0)
    place(sfx, pan(fades(pant_noise(t1 - t0, 1.9, 0.045, R), 0.1, 0.2), 0.25), t0 + 0.2)
# the sprint, the elevator ding and doors
for k in range(int((OPENED - 0.6 - RUN0) / 0.17)):
    place(sfx, pan(step(R, 0.45), 0.1 * (-1) ** k), RUN0 + k * 0.17)
place(sfx, pan(ding(R, 0.32), -0.2), OPENED - 0.35)
n = ns(0.6); tq = np.arange(n) / SR
place(sfx, pan((lp(R.standard_normal(n), 1200) * 0.5 + np.sin(TAU * 95 * tq) * 0.4) * np.sin(np.pi * tq / 0.6) * 0.35, -0.2), OPENED - 0.15)
# the vent grate
place(sfx, pan(clank(R, 0.55), 0.1), VENT - 0.05)
place(sfx, pan(clank(R, 0.35), 0.2), VENT + 0.2)
# lights out
place(sfx, thud(R, 0.7, 45), OUT)
place(sfx, buzz(0.6, 0.03, R) * np.linspace(1, 0, ns(0.6)), OUT)
# the hand: a soft pat
place(sfx, pan(thud(R, 0.25, 160), 0.3), HAND)
# the slow turn: a long creak
place(sfx, pan(creak(R, 1.3, 0.25), -0.2), TURN + 0.2)
# Monday: pen scribbling on the write-up
for k in range(14):
    n = ns(0.09)
    place(sfx, pan(bp(R.standard_normal(n), 2500, 7000) * np.hanning(n) * 0.06, 0.2), MONDAY + 1.2 + k * 0.17 + R.uniform(0, 0.05))
place(sfx, pan(thud(R, 0.2, 200), 0.2), BYLINDA - 0.05)
place(sfx, buzz(0.5, 0.03, R), DIE_END - 0.45)
n = ns(0.3)
place(sfx, bp(R.standard_normal(n), 500, 6000) * np.exp(-np.arange(n) / SR / 0.05) * 0.4, DIE_END)

# ================================================================ MIX
ir_room = make_ir(0.7, 3, hf=1.6)
ir_hall = make_ir(2.2, 5, hf=1.1)
# phone line: band-limit the hold music and tuck it in at the left (Kevin's ear)
music_all = music
music_w = music_all + 0.18 * convolve_st(music_all, ir_room)
hz0, hz1 = ns(OUT), ns(MONDAY - 0.2)
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
pub = os.path.join(ROOT, "..", "..", "public", "linda")
os.makedirs(pub, exist_ok=True)
write_wav(os.path.join(pub, "mix.wav"), mix)
print("dur", mix.shape[1] / SR, "LUFS", round(integrated(mix), 2), "TP", round(true_peak(mix), 2),
      "voice", round(integrated(voice), 1), "music", round(integrated(music_d), 1), "sfx", round(integrated(sfx_w), 1))
