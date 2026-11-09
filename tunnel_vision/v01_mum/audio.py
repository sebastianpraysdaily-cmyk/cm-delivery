"""Synthesize the full 20 s soundtrack for Tunnel Vision #1 (no samples, no paid tools).

Part 1 (0-9 s): light, bright pluck music + varied phone SFX (no repeated swoosh).
Part 2 (9-18 s): music drops out; one soft piano note lands with the first reveal line.
Part 3 (18-20 s): music fades back in under the crossfade so the loop seam is inaudible.
Timings mirror window.T in scene.html.
"""
import sys
import wave

import numpy as np

SR = 48000
DUR = 20.0
N = int(SR * DUR)
rng = np.random.default_rng(11)

T = dict(mum1=0.25, typeStart=1.25, typeEnd=2.85, reply="why do you always ask that",
         send=3.05, read=3.75, mum2=6.05, cut=9.0, card1=9.55, xfade=19.62)


def t_axis(sec):
    return np.arange(int(SR * sec)) / SR


def place(buf, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i]
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(sig), 0] += sig * gain * l * 1.414
    buf[i:i + len(sig), 1] += sig * gain * r * 1.414


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


# ---------------- SFX ----------------
def chime_incoming_a():
    """Two soft marimba-ish notes: friendly 'new message'."""
    out = np.zeros(int(SR * 0.7))
    for k, (f, at) in enumerate([(1568.0, 0.0), (1174.7, 0.11)]):
        t = t_axis(0.5)
        s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 3.99 * t) * np.exp(-t / 0.03)
        s *= env_ad(len(t), 0.002, 0.13)
        i = int(at * SR)
        out[i:i + len(s)] += s * (0.8 if k == 0 else 1.0)
    return out


def chime_incoming_b():
    """Single soft glassy tone, lower and longer: a different, quieter message sound."""
    t = t_axis(1.0)
    f = 1046.5
    s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.15)
         + 0.15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.05))
    return s * env_ad(len(t), 0.004, 0.32)


def key_tick(space=False):
    """Soft keyboard tap; pitch and body vary per key so no two are identical."""
    n = int(SR * 0.05)
    noise = rng.standard_normal(n)
    body_f = rng.uniform(170, 230) if space else rng.uniform(1600, 2600)
    t = np.arange(n) / SR
    click = lowpass(noise, rng.uniform(3500, 6500)) * np.exp(-t / 0.004)
    body = np.sin(2 * np.pi * body_f * t) * np.exp(-t / (0.012 if space else 0.006))
    return (click * 0.7 + body * (0.6 if space else 0.35)) * rng.uniform(0.7, 1.0)


def send_bloop():
    """Short rising 'bloop' (pitched, not a whoosh)."""
    t = t_axis(0.22)
    f = 380 + 700 * (1 - np.exp(-t / 0.04))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env_ad(len(t), 0.003, 0.05)


def read_tick():
    t = t_axis(0.06)
    return np.sin(2 * np.pi * 2900 * t) * env_ad(len(t), 0.001, 0.008)


def low_thump():
    """Soft body thud on the cut, gives the music drop some weight."""
    t = t_axis(0.6)
    f = 70 * np.exp(-t / 0.4) + 42
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env_ad(len(t), 0.004, 0.16)


# ---------------- PIANO NOTE ----------------
def piano(f0, dur=10.0, vel=0.6):
    t = t_axis(dur)
    out = np.zeros_like(t)
    B = 0.00035
    for n in range(1, 16):
        fn = n * f0 * np.sqrt(1 + B * n * n)
        if fn > SR / 2.2:
            break
        amp = (1 / n ** 1.15) * np.exp(-n * (0.55 - 0.3 * vel))
        tau = 10.0 / (1 + 0.35 * n)  # sustain pedal down: long, soft ring
        env = 0.5 * np.exp(-t / (tau * 0.2)) + 0.5 * np.exp(-t / tau)
        for det in (-0.7, 0.7):  # two slightly detuned strings -> gentle beating
            fd = fn * 2 ** (det / 1200)
            out += 0.5 * amp * env * np.sin(2 * np.pi * fd * t + rng.uniform(0, 6.28))
    att = np.minimum(1, t / 0.006)
    hammer = lowpass(rng.standard_normal(int(SR * 0.03)), 1200) * np.exp(-np.arange(int(SR * 0.03)) / SR / 0.006)
    out *= att
    out[: len(hammer)] += hammer * 0.08
    return out / np.max(np.abs(out))


def reverb(x, secs=2.4, wet=0.38):
    n = int(SR * secs)
    t = np.arange(n) / SR
    out = np.zeros((len(x) + n, 2))
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t / (secs / 5.5))
        ir = lowpass(ir, 4500)
        ir /= np.sqrt(np.sum(ir ** 2))
        L = len(x) + n - 1
        nfft = 1 << (L - 1).bit_length()
        out[:L, ch] = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[:L] * wet
        out[: len(x), ch] += x * (1 - wet)
    return out


# ---------------- PART 1 MUSIC ----------------
def ks_pluck(f, dur, bright=0.5):
    n = int(SR * dur)
    p = int(SR / f)
    buf = lowpass(rng.uniform(-1, 1, p), 2500 + 5000 * bright)
    out = np.zeros(n)
    for i in range(n):
        v = buf[i % p]
        out[i] = v
        buf[i % p] = 0.996 * 0.5 * (v + buf[(i + 1) % p])
    return out * env_ad(n, 0.002, dur / 3)


def music_part1(length):
    bpm = 100
    e = 60 / bpm / 2  # eighth note
    chords = [  # bright, ordinary: C - Am - F - G
        [261.63, 329.63, 392.0, 523.25], [220.0, 261.63, 329.63, 440.0],
        [174.61, 220.0, 261.63, 349.23], [196.0, 246.94, 293.66, 392.0]]
    bass = [65.41, 55.0, 43.65, 49.0]
    pattern = [0, 2, 1, 3, 2, 1, 3, 2]
    out = np.zeros((int(SR * length) + SR * 2, 2))
    step = 0
    tt = 0.0
    while tt < length:
        ci = (step // 8) % 4
        f = chords[ci][pattern[step % 8]]
        pl = ks_pluck(f, 0.9, bright=0.6) * (0.55 if step % 2 else 0.7)
        pan = -0.35 if step % 2 else 0.35
        place(out, pl, tt, 0.5, pan)
        if step % 8 == 0:
            tb = t_axis(e * 8)
            b = np.sin(2 * np.pi * bass[ci] * tb) + 0.3 * np.sin(4 * np.pi * bass[ci] * tb)
            place(out, b * env_ad(len(tb), 0.01, 0.9), tt, 0.35)
            # soft pad
            tp = t_axis(e * 8)
            pad = sum(np.sin(2 * np.pi * fc * tp) for fc in chords[ci][:3])
            pad *= np.minimum(1, tp / 0.3) * np.minimum(1, (tp[-1] - tp) / 0.3 + 1e-3)
            place(out, pad, tt, 0.045)
        if step % 2 == 1:  # light shaker on off-beats
            sh = rng.standard_normal(int(SR * 0.05))
            sh = (sh - lowpass(sh, 5000)) * env_ad(len(sh), 0.004, 0.015)
            place(out, sh, tt, 0.12, 0.2)
        step += 1
        tt += e
    return out[: int(SR * length)]


def main(path):
    mix = np.zeros((N, 2))

    # room tone throughout (very low, keeps audio never truly silent)
    room = lowpass(rng.standard_normal(N), 300) * 0.012
    mix[:, 0] += room
    mix[:, 1] += np.roll(room, 977)

    # music part 1, hard drop at the cut
    m = music_part1(T["cut"] + 0.05)
    fade = np.ones(len(m))
    k = int(0.05 * SR)
    fade[-k:] = np.linspace(1, 0, k)
    m *= fade[:, None]
    mix[: len(m)] += m * 0.55
    # music returns under the loop crossfade: the same opening bars, faded in
    tail_len = DUR - (T["xfade"] - 0.25)
    m2 = music_part1(tail_len)
    ramp = np.linspace(0, 1, len(m2)) ** 2
    mix[N - len(m2):] += m2 * ramp[:, None] * 0.55

    # SFX
    place(mix, chime_incoming_a(), T["mum1"], 0.20, -0.1)
    reply = T["reply"]
    per = (T["typeEnd"] - T["typeStart"]) / len(reply)
    for i, ch in enumerate(reply):
        place(mix, key_tick(ch == " "), T["typeStart"] + i * per + rng.uniform(-0.008, 0.008),
              0.10, rng.uniform(-0.2, 0.2))
    place(mix, send_bloop(), T["send"], 0.22, 0.15)
    place(mix, read_tick(), T["read"], 0.05, 0.2)
    place(mix, chime_incoming_b(), T["mum2"], 0.22, -0.1)
    place(mix, low_thump(), T["cut"], 0.30)

    # the single soft piano note as the truth lands (A3)
    note = reverb(piano(220.0, dur=9.5, vel=0.45))
    i = int(T["card1"] * SR) - int(0.12 * SR)
    seg = note[: N - i]
    mix[i:i + len(seg)] += seg * 0.50

    # master: gentle soft-clip + normalize to -1 dBFS
    peak = np.max(np.abs(mix))
    mix = mix / peak * 0.89
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    main(sys.argv[1])
