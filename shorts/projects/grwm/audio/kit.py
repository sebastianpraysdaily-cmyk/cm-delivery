# shared synth kit lifted from the linda soundtrack (functions only)
import numpy as np
from dsp import *
from instruments import *
def buf():
    return np.zeros((2, N))

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

def creak(r, dur=0.9, vel=0.5):
    n = ns(dur)
    tq = np.arange(n) / SR
    f = 170 + 110 * np.sin(np.pi * tq / dur) + 25 * smooth_noise(n, r, 6)
    imp = (np.sin(phase(f)) > 0.97).astype(float)
    y = reson(imp, 700, 6) + reson(imp, 1500, 8) * 0.5
    return y / (np.abs(y).max() + 1e-9) * np.sin(np.pi * tq / dur) * vel

def pant_noise(dur, rate, vel, r):
    n = ns(dur)
    tq = np.arange(n) / SR
    env = np.clip(np.sin(TAU * rate * tq), 0, 1) ** 1.5 + 0.6 * np.clip(-np.sin(TAU * rate * tq), 0, 1) ** 2
    return bp(r.standard_normal(n), 500, 3500) * env * vel
