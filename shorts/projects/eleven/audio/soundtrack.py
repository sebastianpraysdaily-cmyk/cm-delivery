# "Eleven Years" soundtrack: original synthesized score + SFX, timed to the voice words and the picture beats
# (story.ts frames / 30). Uses the bridge short's own DSP kit (dsp.py) and instruments (instruments.py).
# Output: ../../../public/eleven/mix.wav (48 kHz stereo, exact picture length) + stems.
import json, os, sys
import numpy as np
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, reson, colored, fades, place, pan, st, widen, make_ir, convolve_st, \
    integrated, true_peak, dbg, read_wav, write_wav, smooth_noise, phase, modal
from instruments import m2f, vibes, musicbox, pluck, pad, timpani, cymbal, brush, glock, triangle

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DUR = 2065 / 30
N = ns(DUR)
R = rng(11)
fr = lambda f: f / 30.0

# ---------------------------------------------------------------- beats (seconds)
FLASH = fr(197)
LEAVE = 4.81
CLAP0, CLAP1 = 15.91, 17.15
DAVE_SMILE = 17.27
THREE = fr(745)
PLATE = fr(829)
JACKET = fr(860)
WALK0, WALK1 = fr(885), fr(967)
LOCKED = [fr(971), fr(981), fr(991)]
STAIRS = fr(1044)
ELEV = fr(1150)
FLICK0, FLICK1 = fr(1201), fr(1229)
PRINT0 = fr(1243)
BEHIND, REVEAL = 43.28, fr(1335)
LUCKY, UNLUCKY = 47.54, 49.87
ELEVEN3 = fr(1550)
EXPLAIN, WEEK, SEVENTY = 52.91, 56.92, 59.15
LATER = 60.35
NEWHIRE11 = fr(1917)
SMILES = 64.91
DIE = fr(2039)


def buf():
    return np.zeros((2, N))


# ================================================================ MUSIC
music = buf()
BPM = 112
beat = 60 / BPM
# F major office muzak: I - vi - ii - V (vibes comping, pizzicato bass, brushes, glock melody)
PROG = [(53, [65, 69, 72, 76]), (50, [62, 65, 69, 72]), (55, [62, 67, 70, 74]), (48, [64, 67, 70, 72])]
MEL = [77, 76, 74, 72, 74, 72, 69, None, 74, 72, 70, 69, 67, None, 72, None]


def muzak(t0, t1, vel=1.0, detune=0.0, glock_on=True, warp=None):
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
            # pizz bass on 1 and 3, fifth on the and of 2
            if b in (0, 2):
                place(music, pan(pluck(m2f(root - 12 + (7 if b == 2 else 0)) * ws, 0.75 * vel, R, 0.7, 0.35), -0.15), tb)
            # vibes chord stabs on 2 and 4 (and a soft one on the and of 4)
            if b in (1, 3):
                for i, m in enumerate(chord):
                    place(music, pan(vibes(m2f(m + detune) * ws, 0.22 * vel, R, 1.0, damp=0.32 * beat), -0.3 + 0.2 * i), tb + sw + 0.004 * i)
            # brushes
            place(music, pan(brush(0.32 * vel * (1.0 if b % 2 else 0.6), R, 0.25), 0.3), tb)
            place(music, pan(brush(0.18 * vel, R, 0.25, swish=True), 0.35), tb + beat / 2 + sw)
            # glock melody, one note per beat
            if glock_on:
                m = MEL[(k * 4 + b) % 16]
                if m is not None:
                    place(music, pan(glock(m2f(m + 12 + detune) * ws, 0.22 * vel, R, 1.2), 0.25), tb + sw)
        t += bar
        k += 1


muzak(0.0, LEAVE + 0.1, 1.0)                     # hook: cheery until he decides to leave
# "decided to leave": a quick descending vibes run then hold
for i, m in enumerate([81, 77, 74, 72, 69, 65]):
    place(music, pan(vibes(m2f(m), 0.25, R, 0.6), 0.2 - 0.08 * i), LEAVE + 0.06 * i)
muzak(FLASH + 0.05, DAVE_SMILE - 0.05, 1.0)      # Monday morning
# Dave smiles: muzak stops dead; a single music-box note hangs, slightly flat
for k, (tm, m) in enumerate([(DAVE_SMILE, 81), (DAVE_SMILE + 0.9, 80), (DAVE_SMILE + 1.8, 81.3)]):
    place(music, pan(musicbox(m2f(m), 0.35, R, 2.2), 0.1), tm)
place(music, pad([m2f(53), m2f(56.1)], 2.6, 0.12, R, att=0.8, rel=0.8, warm=600), DAVE_SMILE)
muzak(20.28, 26.7, 0.8, glock_on=False)           # the statistic, softer
# "walks very calmly": tip-toe pizzicato (staccato chromatic), building
tiptoe = [53, 55, 56, 57, 58, 57, 56, 55]
t = 26.98
i = 0
while t < 32.1:
    place(music, pan(pluck(m2f(tiptoe[i % 8] + (12 if i % 2 else 0)), 0.5, R, 0.25, 0.7), -0.2 + 0.4 * (i % 2)), t)
    if i % 4 == 0:
        place(music, pan(vibes(m2f(tiptoe[i % 8] + 24), 0.12, R, 0.5, damp=0.15), 0.3), t)
    t += beat / 2
    i += 1

# ---- horror bed: low cluster drone, heartbeat, stingers ----
def drone(t0, t1, freqs, vel, warm=500):
    place(music, pad([m2f(m) for m in freqs], t1 - t0, vel, R, att=0.8, rel=1.2, warm=warm, detune=14), t0)


drone(32.25, 47.5, [38, 45, 50, 51], 0.32)
drone(36.9, 47.5, [62, 63], 0.12, warm=1800)
for k in range(30):                               # heartbeat, speeding up
    tb = 33.6 + k * (0.95 - 0.012 * k)
    if tb > 47.3:
        break
    place(music, timpani(m2f(38), 0.45, R, 1.0), tb)
    place(music, timpani(m2f(38), 0.28, R, 0.8), tb + 0.22)


def stab(tm, notes, vel=0.6, cym=0.0):
    for i, m in enumerate(notes):
        place(music, pan(pluck(m2f(m), vel, R, 1.6, 0.9), -0.4 + 0.25 * i), tm + 0.003 * i)
    place(music, pad([m2f(m) for m in notes], 1.4, 0.35 * vel, R, att=0.01, rel=1.2, warm=2500, detune=20), tm)
    if cym:
        place(music, cymbal(cym, R, 2.6, 0.8), tm)
    place(music, timpani(m2f(31), 0.9 * vel, R, 2.0), tm)


stab(LOCKED[0], [38, 44, 49], 0.6)
stab(STAIRS + 0.05, [50, 56, 61, 63], 0.75, 0.35)
stab(ELEV + 0.05, [49, 55, 60, 62], 0.75, 0.35)
# reveal: reverse-cymbal swell from "Behind him" into the hit
sw = cymbal(0.7, R, 1.2, 1.2)[::-1]
place(music, st(sw), REVEAL - 1.2)
stab(REVEAL, [37, 43, 48, 50, 56], 0.95, 0.5)
# luckily: a hopeful major chord for a moment
place(music, pad([m2f(m) for m in [65, 69, 72, 77]], 2.1, 0.22, R, att=0.15, rel=0.4, warm=2500), LUCKY + 0.1)
for i, m in enumerate([72, 77, 81]):
    place(music, pan(glock(m2f(m + 12), 0.25, R, 1.2), 0.2), LUCKY + 0.15 + 0.12 * i)
# unluckily: minor drone back, rising cluster to "eleven"
drone(UNLUCKY, ELEVEN3 + 0.2, [37, 44, 49, 52], 0.3)
stab(ELEVEN3, [38, 44, 49, 50, 55], 1.0, 0.6)

# ---- explanation + time-lapse: music box lullaby (F major, a touch out of tune) ----
LULL = [72, 77, 76, 74, 72, 69, 70, 72, 74, 72, 69, 65, 67, 69, 70, 69, 65, 64, 65, None]
t, i = EXPLAIN + 0.2, 0
while t < LATER - 0.2:
    m = LULL[i % len(LULL)]
    if m is not None:
        place(music, pan(musicbox(m2f(m + 12) * (1 + 0.003 * np.sin(i)), 0.45, R, 1.6), -0.1 + 0.2 * np.sin(i)), t)
    if i % 4 == 0:
        place(music, pan(musicbox(m2f([53, 50, 46, 48][(i // 4) % 4] + 12), 0.3, R, 2.0), -0.3), t)
    # the weeks speed the lullaby up
    t += (0.42 if t < WEEK else max(0.13, 0.42 - 0.09 * (t - WEEK)))
    i += 1

# ---- ten years later: the muzak again, then it warps and dies with the lights ----
warp = lambda tb: 1.0 if tb < SMILES else 2 ** (-(tb - SMILES) * 0.9 / 12)
muzak(LATER, DIE - 0.3, 0.9, warp=warp)
place(music, pad([m2f(m) for m in [41, 47, 52]], DIE - SMILES, 0.18, R, att=1.5, rel=0.3, warm=500, detune=18), SMILES)
stab(DIE, [29, 35, 40, 41], 0.9, 0.5)

# ================================================================ SFX
sfx = buf()


def clap(r):
    n = ns(0.12)
    t = np.arange(n) / SR
    x = bp(r.standard_normal(n), 900, 4200, 2) * np.exp(-t / 0.018) * (1 - np.exp(-t / 0.0008))
    return reson(x, r.uniform(1100, 1700), 3) * 0.6 + x


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


def rattle(r, vel=0.8):
    n = ns(0.32)
    t = np.arange(n) / SR
    hits = np.zeros(n)
    for k in range(7):
        i = ns(0.035 * k + r.uniform(0, 0.01))
        if i < n:
            hits[i] = r.uniform(0.6, 1.0)
    body = sum(np.convolve(hits, modal(0.2, [(f, 1, 0.05)], r), "full")[:n] for f in (180, 420, 960, 2300))
    return (body * 0.5 + lp(hits, 3000) * 2) * vel


def creak(r, dur=0.9, vel=0.5):
    n = ns(dur)
    t = np.arange(n) / SR
    f = 160 + 90 * np.sin(np.pi * t / dur) + 20 * smooth_noise(n, r, 6)
    imp = (np.sin(phase(f)) > 0.97).astype(float)
    y = reson(imp, 700, 6) + reson(imp, 1500, 8) * 0.5
    return y / (np.abs(y).max() + 1e-9) * np.sin(np.pi * t / dur) * vel


def ding(r, vel=0.5):
    return (modal(1.8, [(1318, 1, 0.9), (1318 * 2.0, 0.2, 0.4), (1318 * 2.76, 0.15, 0.2)], r)
            + 0.8 * np.pad(modal(1.52, [(1046, 1, 0.9), (2092, 0.2, 0.4)], r), (ns(0.28), 0))[:ns(1.8)]) * vel


def slide(r, dur=0.55, vel=0.4):
    n = ns(dur)
    t = np.arange(n) / SR
    return (lp(r.standard_normal(n), 1200) * 0.5 + np.sin(TAU * 95 * t) * 0.4) * np.sin(np.pi * t / dur) * vel


def buzz(dur, vel, r):
    n = ns(dur)
    t = np.arange(n) / SR
    y = np.sign(np.sin(TAU * 120 * t)) * 0.3 + np.sin(TAU * 240 * t) * 0.3 + hp(r.standard_normal(n), 3000) * 0.05
    return lp(y, 2500) * vel


def tick(r, f=3200, vel=0.4):
    return modal(0.05, [(f, 1, 0.006), (f * 1.7, 0.5, 0.004)], r) * vel


# room tone: office HVAC hum throughout, heavier fluorescent buzz in the horror stretch
room = lp(colored(N, R, 1.6), 900) * 0.006
place(sfx, widen(room, R, 9, 0.7), 0)
hz = buzz(52.5 - 40.1, 0.005, R)
hz *= np.clip(np.arange(len(hz)) / ns(0.3), 0, 1)
place(sfx, pan(hz, 0.15), 40.1)
# hook: Kevin's hurried steps out of the room (shot 2)
for k in range(6):
    place(sfx, pan(step(R, 0.5, False), 0.2 + 0.1 * k), fr(141) + k * 0.31)
place(sfx, whoosh(R, 0.5, 400, 4000, 0.5), FLASH - 0.35)
place(sfx, pan(clink(R, 2200, 0.25), -0.3), 11.75)        # mug raised
for k in range(55):                                          # applause
    tm = CLAP0 + R.uniform(0, CLAP1 - CLAP0)
    place(sfx, pan(clap(R), R.uniform(-0.7, 0.7)), tm, 0.35)
for tm in (THREE, THREE + 0.1):                              # clone pops
    n = ns(0.12)
    t = np.arange(n) / SR
    place(sfx, np.sin(phase(np.linspace(380, 900, n))) * np.exp(-t / 0.04) * 0.45, tm)
place(sfx, pan(clink(R, 3100, 0.35), 0.3), PLATE)          # plate on the table
place(sfx, pan(whoosh(R, 0.35, 600, 2500, 0.35), 0.2), JACKET)
for k in range(int((WALK1 - WALK0) / 0.48)):                 # calm carpet steps
    place(sfx, pan(step(R, 0.35), 0.1 * (-1) ** k), WALK0 + 0.2 + k * 0.48)
for tm in LOCKED:
    place(sfx, rattle(R, 0.85), tm)
place(sfx, pan(creak(R, 0.9, 0.5), 0.35), STAIRS - 0.1)
place(sfx, pan(ding(R, 0.35), -0.3), ELEV - 0.75)
place(sfx, pan(slide(R, 0.6, 0.4), -0.3), ELEV)
for k in range(14):                                          # flicker clicks
    place(sfx, pan(tick(R, 900, 0.5) + np.pad(buzz(0.04, 0.05, R), (0, ns(0.05) - ns(0.04))), R.uniform(-0.4, 0.4)), FLICK0 + k * 0.068 * R.uniform(0.6, 1.4))
# printer: motor whir + a page every 5 frames
pr = buzz(1.9, 0.0, R) + lp(R.standard_normal(ns(1.9)), 500) * 0.12 + np.sin(TAU * 180 * tt(1.9)) * 0.06
place(sfx, pan(fades(pr, 0.1, 0.2), 0.3), PRINT0 - 0.15)
for k in range(12):
    place(sfx, pan(whoosh(R, 0.18, 1500, 6000, 0.22), 0.3), PRINT0 + k * fr(5))
place(sfx, lp(colored(ns(1.0), R, 2), 120) * np.sin(np.pi * tt(1.0)) * 0.3, BEHIND)  # low rumble
place(sfx, pan(clink(R, 4200, 0.12) + clink(R, 5100, 0.1), 0.1), LUCKY + 0.6)       # badge jingle
for k in range(11):                                         # tally marks scratched in
    n = ns(0.05)
    place(sfx, bp(R.standard_normal(n), 2500, 7000) * np.exp(-np.arange(n) / SR / 0.015) * 0.3, fr(1540) + k * fr(1.4))
t = WEEK - 1.0
while t < SEVENTY + 1.0:                                     # clock, faster and faster
    place(sfx, pan(tick(R, 3000, 0.25), -0.2), t)
    t += 0.5 if t < WEEK else max(0.06, 0.5 - 0.18 * (t - WEEK))
place(sfx, pan(clink(R, 2400, 0.2), 0.3), 61.2)            # break-room cup
place(sfx, buzz(0.9, 0.03, R), DIE - 0.8)                  # lights die
n = ns(0.3)
place(sfx, bp(R.standard_normal(n), 500, 6000) * np.exp(-np.arange(n) / SR / 0.05) * 0.5, DIE)

# ================================================================ MIX
ir_room = make_ir(0.7, 3, hf=1.6)
ir_hall = make_ir(2.2, 5, hf=1.1)
music_w = music + 0.18 * convolve_st(music, ir_room)
# the horror stretch gets a long dark hall
hz0, hz1 = ns(32.0), ns(53.0)
music_w[:, hz0:hz1] += 0.35 * convolve_st(music[:, hz0:hz1], ir_hall)
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
music_w *= dbg(-21.0 + 3.0 - integrated(music_w))   # standard mix: music +3 dB over its bed level
sfx_w *= dbg(-24.0 - 6.0 + 6.0 - integrated(sfx_w))  # SFX -6 dB relative to their raw event level (events are loud)
music_d = music_w * duck()[None, :]
mix = voice + music_d + sfx_w
# final loudness: -14 LUFS, peak-limit to -1 dBTP with a soft clip
mix *= dbg(-14.0 - integrated(mix))
pk = true_peak(mix)
if pk > -1.0:
    g = np.abs(mix).max()
    lim = dbg(-1.2)
    mix = np.tanh(mix / lim) * lim
mix = fades(mix, 0.005, 0.05)
out_dir = os.path.join(ROOT, "audio")
write_wav(os.path.join(out_dir, "stem_music.wav"), music_d)
write_wav(os.path.join(out_dir, "stem_sfx.wav"), sfx_w)
write_wav(os.path.join(out_dir, "mix.wav"), mix)
pub = os.path.join(ROOT, "..", "..", "public", "eleven", "mix.wav")
write_wav(pub, mix)
print("dur", mix.shape[1] / SR, "LUFS", round(integrated(mix), 2), "TP", round(true_peak(mix), 2))
