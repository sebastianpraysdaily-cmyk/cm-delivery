"""Synthesize a Tunnel Vision soundtrack from a video config (no samples, no paid tools).

Sounds come from the config's events, so every video gets SFX that match its thread.
Each video picks its own chime timbres, music (key, tempo, instrument, progression) and the
pitch of the single piano note, so no two videos sound the same.
Usage: python3 audio.py <config.json> <out.wav>
"""
import json
import sys
import wave

import numpy as np

SR = 48000
DUR = 20.0
N = int(SR * DUR)


def t_axis(sec):
    return np.arange(int(SR * sec)) / SR


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def env_ad(n, att, dec):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(att, 1e-4)) * np.exp(-t / dec)


def place(buf, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= len(buf) or i < 0:
        return
    sig = sig[: len(buf) - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(sig), 0] += sig * gain * l * 1.414
    buf[i:i + len(sig), 1] += sig * gain * r * 1.414


class Synth:
    def __init__(self, seed):
        self.rng = np.random.default_rng(seed)

    # ---- incoming-message chimes (pick per video) ----
    def chime(self, kind):
        t = t_axis(1.0)
        if kind == "marimba2":
            out = np.zeros(len(t))
            for f, at, g in [(1568.0, 0, .8), (1174.7, .11, 1)]:
                tt = t_axis(.5)
                s = (np.sin(2 * np.pi * f * tt) + .25 * np.sin(2 * np.pi * f * 3.99 * tt) * np.exp(-tt / .03)) * env_ad(len(tt), .002, .13)
                out[int(at * SR):int(at * SR) + len(s)] += s * g
            return out
        if kind == "glass":
            f = 1046.5
            return (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / .15)) * env_ad(len(t), .004, .32)
        if kind == "bell":
            f = 1318.5
            return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / .2)
                    + .2 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / .08)) * env_ad(len(t), .003, .45)
        if kind == "pluck":
            return self.ks(880.0, .6, .8) * 1.3
        if kind == "wood2":
            out = np.zeros(len(t))
            for f, at in [(700, 0), (930, .09)]:
                tt = t_axis(.2)
                s = np.sin(2 * np.pi * f * tt) * env_ad(len(tt), .001, .03)
                out[int(at * SR):int(at * SR) + len(s)] += s
            return out
        if kind == "ping":
            f = 1760 * (1 + .03 * np.exp(-t / .05))
            return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), .002, .22)
        if kind == "soft2":
            out = np.zeros(len(t))
            for f, at in [(987.8, 0), (1318.5, .14)]:
                tt = t_axis(.6)
                s = np.sin(2 * np.pi * f * tt) * env_ad(len(tt), .004, .18)
                out[int(at * SR):int(at * SR) + len(s)] += s
            return out
        raise ValueError(kind)

    def key_tick(self, space=False, back=False):
        n = int(SR * .05)
        t = np.arange(n) / SR
        noise = self.rng.standard_normal(n)
        f = self.rng.uniform(170, 230) if space else (self.rng.uniform(900, 1300) if back else self.rng.uniform(1600, 2600))
        click = lowpass(noise, self.rng.uniform(3500, 6500)) * np.exp(-t / .004)
        body = np.sin(2 * np.pi * f * t) * np.exp(-t / (.012 if space else .006))
        return (click * .7 + body * (.6 if space else .35)) * self.rng.uniform(.7, 1)

    def send(self, lo, hi):
        t = t_axis(.22)
        f = lo + (hi - lo) * (1 - np.exp(-t / .04))
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), .003, .05)

    def tick(self, f=2900, dec=.008):
        t = t_axis(.08)
        return np.sin(2 * np.pi * f * t) * env_ad(len(t), .001, dec)

    def clock_flip(self):
        out = np.zeros(int(SR * .3))
        for at, f in [(0, 2200), (.12, 1700)]:
            s = self.tick(f, .01)
            out[int(at * SR):int(at * SR) + len(s)] += s
        return out

    def voice_pop(self):
        t = t_axis(.35)
        f = 300 + 500 * np.exp(-t / .03)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), .002, .07)

    def star(self):
        t = t_axis(.5)
        return (np.sin(2 * np.pi * 1975 * t) + .4 * np.sin(2 * np.pi * 2960 * t)) * env_ad(len(t), .002, .09)

    def thump(self):
        t = t_axis(.6)
        f = 70 * np.exp(-t / .4) + 42
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), .004, .16)

    # ---- instruments ----
    def ks(self, f, dur, bright=.5):
        n, p = int(SR * dur), max(2, int(SR / f))
        buf = lowpass(self.rng.uniform(-1, 1, p), 2500 + 5000 * bright)
        out = np.zeros(n)
        for i in range(n):
            v = buf[i % p]
            out[i] = v
            buf[i % p] = .996 * .5 * (v + buf[(i + 1) % p])
        return out * env_ad(n, .002, dur / 3)

    def note(self, inst, f, dur):
        t = t_axis(dur)
        if inst == "ks":
            return self.ks(f, dur, .6)
        if inst == "bell":
            return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / .3)) * env_ad(len(t), .004, .5)
        if inst == "marimba":
            return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / .03)) * env_ad(len(t), .002, .25)
        if inst == "epiano":
            m = np.sin(2 * np.pi * f * t + 1.2 * np.exp(-t / .3) * np.sin(2 * np.pi * f * 2 * t))
            return m * env_ad(len(t), .004, .7)
        raise ValueError(inst)

    def piano(self, f0, dur=9.5, vel=.45):
        t = t_axis(dur)
        out = np.zeros_like(t)
        for n in range(1, 16):
            fn = n * f0 * np.sqrt(1 + .00035 * n * n)
            if fn > SR / 2.2:
                break
            amp = (1 / n ** 1.15) * np.exp(-n * (.55 - .3 * vel))
            tau = 10.0 / (1 + .35 * n)
            env = .5 * np.exp(-t / (tau * .2)) + .5 * np.exp(-t / tau)
            for det in (-.7, .7):
                out += .5 * amp * env * np.sin(2 * np.pi * fn * 2 ** (det / 1200) * t + self.rng.uniform(0, 6.28))
        h = int(SR * .03)
        out *= np.minimum(1, t / .006)
        out[:h] += lowpass(self.rng.standard_normal(h), 1200) * np.exp(-np.arange(h) / SR / .006) * .08
        return out / np.max(np.abs(out))

    def reverb(self, x, secs=2.4, wet=.38):
        n = int(SR * secs)
        t = np.arange(n) / SR
        L = len(x) + n - 1
        nfft = 1 << (L - 1).bit_length()
        out = np.zeros((L, 2))
        for ch in range(2):
            ir = lowpass(self.rng.standard_normal(n) * np.exp(-t / (secs / 5.5)), 4500)
            ir /= np.sqrt(np.sum(ir ** 2))
            out[:, ch] = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[:L] * wet
            out[:len(x), ch] += x * (1 - wet)
        return out

    def music(self, m, length):
        e = 60 / m["bpm"] / 2
        root = m["root"]
        chords = [[root * 2 ** (s / 12) for s in ch] for ch in m["prog"]]
        pattern = m.get("pattern", [0, 2, 1, 3, 2, 1, 3, 2])
        out = np.zeros((int(SR * length) + SR * 2, 2))
        step, tt = 0, 0.0
        while tt < length:
            ci = (step // 8) % len(chords)
            ch = chords[ci]
            f = ch[pattern[step % 8] % len(ch)]
            place(out, self.note(m["inst"], f, .9), tt, .5 * (.55 if step % 2 else .7), -.35 if step % 2 else .35)
            if step % 8 == 0:
                tb = t_axis(e * 8)
                bf = ch[0] / 4
                place(out, (np.sin(2 * np.pi * bf * tb) + .3 * np.sin(4 * np.pi * bf * tb)) * env_ad(len(tb), .01, .9), tt, .35)
                pad = sum(np.sin(2 * np.pi * fc / 2 * tb) for fc in ch[:3])
                pad *= np.minimum(1, tb / .3) * np.minimum(1, (tb[-1] - tb) / .3 + 1e-3)
                place(out, pad, tt, .04)
            if step % 2 == 1 and m.get("shaker", True):
                sh = self.rng.standard_normal(int(SR * .05))
                sh = (sh - lowpass(sh, 5000)) * env_ad(len(sh), .004, .015)
                place(out, sh, tt, .11, .2)
            step += 1
            tt += e
        return out[: int(SR * length)]


def build(cfg, path):
    global DUR, N
    DUR = cfg.get("end", 20.0)
    N = int(SR * DUR)
    A = cfg["audio"]
    sy = Synth(cfg["no"] * 101)
    mix = np.zeros((N, 2))
    room = lowpass(sy.rng.standard_normal(N), 300) * .012
    mix[:, 0] += room
    mix[:, 1] += np.roll(room, 977)
    cut = cfg.get("cut", 9.0)
    m = sy.music(A["music"], cut + .05)
    k = int(.05 * SR)
    m[-k:] *= np.linspace(1, 0, k)[:, None]
    mix[:len(m)] += m * .55
    m2 = sy.music(A["music"], 0.63)
    mix[N - len(m2):] += m2 * (np.linspace(0, 1, len(m2)) ** 2)[:, None] * .55

    chimes = A["chimes"]
    ci = 0
    for e in cfg["events"]:
        tt = e.get("t")
        if tt == "msg" and e["at"] >= 0:
            if e["side"] == "in":
                place(mix, sy.chime(chimes[min(ci, len(chimes) - 1)]), e["at"], A.get("chime_gain", .2), -.1)
                ci += 1
            else:
                place(mix, sy.send(*A.get("send", [380, 1080])), e["at"], .22, .15)
        elif tt == "voice":
            place(mix, sy.voice_pop(), e["at"], .3)
        elif tt == "type":
            per = (e["to"] - e["from"]) / len(e["text"])
            for i, c in enumerate(e["text"]):
                place(mix, sy.key_tick(c == " "), e["from"] + i * per + sy.rng.uniform(-.008, .008), .10, sy.rng.uniform(-.2, .2))
        elif tt == "erase":
            per = (e["to"] - e["from"]) / e["count"]
            for i in range(e["count"]):
                place(mix, sy.key_tick(back=True), e["from"] + i * per, .08, .1)
        elif tt == "receipt" and e["at"] >= 0:
            place(mix, sy.tick(), e["at"], .05, .2)
        elif tt == "clock":
            place(mix, sy.clock_flip(), e["at"], .12)
        elif tt == "rating":
            place(mix, sy.voice_pop(), e["at"], .15)
            place(mix, sy.star(), e["tap"], .16)
            place(mix, sy.tick(1500, .015), e["submit"], .12)
    place(mix, sy.thump(), cut, .30)

    note = sy.reverb(sy.piano(A["piano"], 9.5, .45))
    i = int(cfg["cards"][0][0] * SR) - int(.12 * SR)
    seg = note[: N - i]
    mix[i:i + len(seg)] += seg * .5

    mix = mix / np.max(np.abs(mix)) * .89
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    build(json.load(open(sys.argv[1])), sys.argv[2])
