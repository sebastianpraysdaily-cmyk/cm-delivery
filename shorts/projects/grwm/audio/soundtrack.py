# "Get Ready With Me (For The Last Time)" soundtrack: original synthesized score + SFX timed to the voice timeline
# (../voice/beats.json) and the picture beats (src/videos/grwm/story.ts frames / 30).
# Output: ../../../public/grwm/mix.wav (48 kHz stereo, exact picture length) + stems.
import json, os
import numpy as np
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, reson, colored, fades, place, pan, st, widen, make_ir, convolve_st, \
    integrated, true_peak, dbg, read_wav, write_wav, smooth_noise, phase, modal
from instruments import m2f, vibes, musicbox, pluck, pad, timpani, cymbal, brush, glock, brass, snare

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TOTAL = 2421
DUR = TOTAL / 30
N = ns(DUR)
R = rng(31)
fr = lambda f: f / 30.0
BE = json.load(open(os.path.join(ROOT, "voice", "beats.json")))["beats"]


def buf():
    return np.zeros((2, N))


music, sfx = buf(), buf()
BPM = 100
beat = 60 / BPM
PROG = [(53, [65, 69, 72, 76]), (50, [65, 69, 72, 74]), (46, [62, 65, 70, 74]), (48, [64, 67, 70, 72])]
MEL = [77, None, 76, 74, 72, None, 74, 76, 77, 79, 77, None, 74, 72, 74, None]
exec(open(os.path.join(HERE, "kit.py")).read(), globals())   # muzak, stab, record_scratch, whoosh, thud, ding, ...

# ---------------------------------------------------------------- beats (seconds)
FREEZE, REWIND = fr(73), fr(129)
SPLASH, BITE, SNIFF = fr(250), fr(284), fr(320)
DREAM, LAUNCH, WINGS, HONK = fr(682), fr(766), fr(774), fr(874)
DOOR, STAND, LANYARD = fr(1025), fr(1377), fr(1464)
CHAD_WORDS = [fr(w) for w in [1039, 1085, 1132, 1162, 1175, 1214, 1228, 1244, 1267, 1308]]
ROAST = [(fr(1515), fr(1597 - 12)), (fr(1600), fr(1685 - 12)), (fr(1690), fr(1798 - 12)), (fr(1802), fr(1875 - 12)), (fr(1879), fr(1932 - 12))]
GRAB, TOSS, LAND, SONG2 = fr(1932), fr(2105), fr(2116), fr(2142)
END = fr(TOTAL - 10)


# ================================================================ instruments for this one
def kick(vel=0.9, r=None, dur=0.4):
    t = tt(dur); f = 45 + 110 * np.exp(-t / 0.035)
    x = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / 0.16) + 0.25 * bp(R.standard_normal(len(t)), 1000, 5000) * np.exp(-t / 0.006)
    return x * vel


def hat(vel=0.3, dur=0.06):
    t = tt(dur); return hp(R.standard_normal(len(t)), 7000) * np.exp(-t / (dur / 3)) * vel


def clap(vel=0.5):
    t = tt(0.25); n = bp(R.standard_normal(len(t)), 900, 4000)
    env = sum(np.exp(-np.clip(t - d, 0, None) / 0.012) * (t >= d) for d in (0, 0.011, 0.022)) + 0.6 * np.exp(-t / 0.09)
    return n * env * vel * 0.6


def bass808(f, dur, vel=0.8):
    t = tt(dur); ff = f * (1 + 0.6 * np.exp(-t / 0.03))
    x = np.tanh(1.6 * np.sin(TAU * np.cumsum(ff) / SR)) * np.minimum(1, (dur - t) / 0.05)
    return lp(x, 900) * vel * np.exp(-t / (dur * 1.4))


def uke(f, vel=0.5):
    return pluck(f, vel, R, 0.55, 0.85, 0.12)


def trap(t0, t1, vel=1.0, bpm=140, bassline=(41, 41, 44, 39)):
    """half-time trap: kick, snare on 3, rolling hats, 808 line"""
    b = 60 / bpm
    t, k = t0, 0
    while t < t1 - 0.02:
        bar = k // 8; s = k % 8
        if s in (0, 3, 5): place(music, st(kick(0.95 * vel)), t)
        if s == 4: place(music, pan(snare(0.7 * vel, R, 0.3), 0.05), t); place(music, pan(clap(0.5 * vel), -0.05), t)
        for h in range(2 if s % 2 else 1):
            place(music, pan(hat(0.22 * vel), 0.3), t + h * b / 4)
        if s == 0: place(music, st(bass808(m2f(bassline[bar % 4] - 12), 4 * b, 0.7 * vel)), t)
        t += b / 2; k += 1


def ukesong(t0, t1, vel=1.0, stop_hard=False):
    """the happy daydream song: strummed ukulele, glock tune, claps on 2 and 4"""
    b = 60 / 118
    chords = [[67, 72, 76, 79], [67, 71, 74, 79], [69, 72, 76, 81], [65, 69, 72, 77]]
    tune = [84, 86, 88, None, 86, 84, 81, None, 79, 81, 84, 86, 84, None, 81, 79]
    t, k = t0, 0
    while t < t1 - 0.01:
        ch = chords[(k // 8) % 4]
        down = k % 2 == 0
        for i, m in enumerate(ch if down else ch[::-1]):
            place(music, pan(uke(m2f(m), (0.32 if down else 0.22) * vel), -0.2 + 0.12 * i), t + 0.012 * i)
        if k % 4 == 2: place(music, pan(clap(0.35 * vel), 0.2), t)
        m = tune[k % 16]
        if m is not None and k % 1 == 0: place(music, pan(glock(m2f(m), 0.18 * vel, R, 0.9), 0.3), t)
        if k % 8 == 0: place(music, st(pluck(m2f(ch[0] - 24), 0.5 * vel, R, 0.8, 0.3)), t)
        t += b / 2; k += 1


def honk(t0, vel=0.7, dur=0.55):
    t = tt(dur)
    x = sum(np.sign(np.sin(TAU * f * t)) for f in (392, 494))
    x = lp(x, 2200) * np.minimum(1, t / 0.01) * np.minimum(1, (dur - t) / 0.03)
    place(sfx, pan(x * 0.25 * vel, 0.1), t0)


def rewind(t0, dur=0.6, vel=0.5):
    t = tt(dur); n = R.standard_normal(len(t))
    sweep = 400 * (8 ** (t / dur))
    x = np.zeros(len(t))
    for i in range(0, len(t) - 512, 256):
        f = sweep[i]; seg = bp(n[i:i + 512], f, min(f * 2.5, 16000))
        x[i:i + 512] += seg * np.hanning(512)
    warble = np.sin(TAU * np.cumsum(220 * (8 ** (t / dur)) * (1 + 0.1 * np.sin(TAU * 18 * t))) / SR) * 0.3
    place(sfx, st((x * 0.5 + warble) * np.sin(np.pi * t / dur) * vel), t0)


def engine(t0, t1, vel=0.08):
    n = ns(t1 - t0); t = np.arange(n) / SR
    x = lp(colored(n, R, -1.0), 180) * (1 + 0.3 * np.sin(TAU * 31 * t)) + 0.3 * np.sin(TAU * 31 * t)
    place(sfx, st(fades(x * vel, 0.3, 0.3)), t0)


def roomtone(t0, t1, vel=0.03, f=120):
    n = ns(t1 - t0); x = lp(colored(n, R, -0.5), 600) + 0.2 * np.sin(TAU * f * np.arange(n) / SR)
    place(sfx, st(fades(x * vel, 0.2, 0.2)), t0)


def keys(t0, t1, vel=0.25):
    t = t0
    while t < t1:
        place(sfx, pan(tick(R, 3000 + R.uniform(-500, 500), vel * R.uniform(0.5, 1.0)), R.uniform(-0.3, 0.3)), t)
        t += R.uniform(0.07, 0.22)


def bird(t0, vel=0.12):
    t = tt(0.18); f = 3200 + 900 * np.sin(TAU * 9 * t)
    place(sfx, pan(np.sin(TAU * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.18) * vel, R.uniform(-0.6, 0.6)), t0)


# ================================================================ MUSIC
# hook: trap under the yelling; record scratch on the freeze, silence, then the tape rewinds
trap(0.0, FREEZE, 1.0)
record_scratch(FREEZE - 0.05, 0.6)
# GRWM: bouncy influencer muzak
muzak(REWIND + 0.5, fr(372) - 0.05, 0.9)
# the narrator over the mess and the jam: a deflated, slowed version of it
muzak(fr(372), fr(528), 0.45, glock_on=False, warp=lambda tb: 0.94)
drone(fr(528), DREAM - 0.1, [41, 48, 53], 0.12, warm=400)
# the daydream: the happy song... cut dead by the honk
ukesong(DREAM, HONK, 1.0)
slide_whistle(LAUNCH - 0.1, 500, 1300, 0.5, 0.35)
stab(WINGS + 0.15, [65, 69, 72, 77], 0.45, cym=0.4, timp=False)
# Chad: a too-happy cheer loop under his yelling
muzak(DOOR + 0.2, fr(1323), 0.7, glock_on=True)
# the narrator leans in: a rising drone, then dead silence on the stand
drone(fr(1323), STAND, [38, 45, 50, 57], 0.18, warm=700)
stab(LANYARD, [41, 48, 53, 56], 0.85, cym=0.7)
# the roast strut: trap, a stab on every punchline
trap(fr(1515), GRAB, 1.0)
for _, hit in ROAST:
    stab(hit, [43, 50, 55, 58], 0.55, cym=0.35, timp=True)
trap(GRAB, TOSS - 0.05, 0.75, bassline=(39, 39, 41, 36))
# the toss: silence... then the daydream song, for real
ukesong(SONG2, END + 0.3, 0.9)

# ================================================================ SFX
place(sfx, pan(thud(R, 0.5, 90), 0.0), 0.3)
for k in range(10): place(sfx, pan(step(R, 0.3, carpet=True), 0.15 * (-1) ** k), 0.2 + k * 0.23)
rewind(REWIND - 0.1, 0.7)
# the apartment: a tap splash, a bite, a sniff
n = ns(0.5); place(sfx, pan(bp(R.standard_normal(n), 600, 5000) * np.exp(-np.arange(n) / SR / 0.12) * 0.45, -0.1), SPLASH)
place(sfx, pan(crunch(R, 0.5, 0.2), 0.0), BITE)
for k in range(3): n = ns(0.12); place(sfx, pan(bp(R.standard_normal(n), 1500, 6000) * np.hanning(n) * 0.12, 0.0), SNIFF - 0.3 + k * 0.14)
roomtone(fr(129), fr(528), 0.02, 60)
# the roach: a tiny squeak
place(sfx, pan(boing(R, 0.12, 0.25), 0.2), fr(470))
# gridlock: engines, distant horns
engine(fr(528), DREAM)
for tm in (fr(560), fr(605), fr(650)): honk(tm, 0.25, 0.35)
# the dream: whoosh off the cliff, wind while gliding, gulls on the beach
place(sfx, st(whoosh(R, 1.0, 300, 2500, 0.5)), LAUNCH - 0.2)
place(sfx, st(fades(bp(colored(ns(2.2), R, -0.5), 300, 2000) * 0.15, 0.4, 0.4)), WINGS)
for k in range(3): bird(fr(850) + 0.25 * k)
# HONK
honk(HONK, 1.0, 0.7)
engine(HONK, fr(946))
# the office: keyboards and hum; Chad's door bang; a ding on every shouted word
roomtone(fr(946), TOSS, 0.025, 120)
keys(fr(946), fr(1025), 0.18)
place(sfx, pan(thud(R, 0.7, 70), 0.2), DOOR)
for w in CHAD_WORDS:
    place(sfx, pan(ding(R, 0.45), 0.15), w)
# the stand: a chair scrape
n = ns(0.4); place(sfx, pan(bp(R.standard_normal(n), 300, 1800) * np.sin(np.pi * np.arange(n) / n) * 0.25, -0.1), STAND + 0.1)
# whips between the roast targets
for a, _ in ROAST[1:]:
    place(sfx, st(whoosh(R, 0.3, 600, 4000, 0.35)), a - 0.12)
for k in range(int((GRAB - fr(1515)) / 0.43)):
    place(sfx, pan(step(R, 0.28, carpet=True), 0.1 * (-1) ** k), fr(1515) + k * 0.43)
# security: scuffle
for k in range(3): place(sfx, pan(thud(R, 0.4, 110 + 30 * k), 0.2 * (-1) ** k), GRAB + 0.1 + 0.12 * k)
# the toss: door bang, whoosh, a big thud on the pavement, then the street
place(sfx, pan(clank(R, 0.6), 0.0), TOSS - 0.03)
place(sfx, st(whoosh(R, 0.45, 300, 2200, 0.5)), TOSS + 0.03)
place(sfx, st(thud(R, 1.0, 55)), LAND)
n = ns(DUR - TOSS); place(sfx, st(fades(lp(colored(n, R, -0.8), 900) * 0.03, 0.5, 0.5)), TOSS)
for k in range(6): bird(SONG2 + 0.6 + 1.7 * k + R.uniform(0, 0.4))

# ================================================================ MIX
ir_room = make_ir(0.7, 3, hf=1.6)
music_w = music + 0.15 * convolve_st(music, ir_room)
sfx_w = sfx + 0.1 * convolve_st(sfx, ir_room)
vx, vsr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
assert vsr == SR
v = vx.mean(0) if vx.shape[0] > 1 else vx[0]
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]
voice = st(voice)
spans = [v for v in BE.values() if isinstance(v, list)]


def duck(depth_db=-9.0, pre=0.08, post=0.15, att=0.06, rel=0.4):
    ctrl = 1000
    nc = int(DUR * ctrl) + 2
    va = np.zeros(nc)
    for s, e in spans:
        va[max(0, int((s - pre) * ctrl)): int((e + post) * ctrl)] = 1
    ka, kr = 1 - np.exp(-1 / (att * ctrl)), 1 - np.exp(-1 / (rel * ctrl))
    env = np.zeros(nc); e = 0.0
    for i in range(nc):
        e += (va[i] - e) * (ka if va[i] > e else kr); env[i] = e
    return dbg(np.interp(np.arange(N) / SR, np.arange(nc) / ctrl, depth_db * env))


voice *= dbg(-17.0 - integrated(voice))
music_w *= dbg(-21.0 + 3.0 + 1.0 - integrated(music_w))
sfx_w *= dbg(-24.0 - 6.0 + 8.0 - integrated(sfx_w))
music_d = music_w * duck()[None, :]
mix = voice + music_d + sfx_w
mix *= dbg(-14.0 - integrated(mix))
if true_peak(mix) > -1.0:
    lim = dbg(-1.2)
    mix = np.tanh(mix / lim) * lim
mix = fades(mix, 0.005, 0.3)
write_wav(os.path.join(HERE, "stem_music.wav"), music_d)
write_wav(os.path.join(HERE, "stem_sfx.wav"), sfx_w)
write_wav(os.path.join(HERE, "mix.wav"), mix)
pub = os.path.join(ROOT, "..", "..", "public", "grwm")
os.makedirs(pub, exist_ok=True)
write_wav(os.path.join(pub, "mix.wav"), mix)
print("dur", mix.shape[1] / SR, "LUFS", round(integrated(mix), 2), "TP", round(true_peak(mix), 2),
      "voice", round(integrated(voice), 1), "music", round(integrated(music_d), 1), "sfx", round(integrated(sfx_w), 1))
