"""Build Tunnel Vision videos from videos/videos.json.

  python3 build.py prepare <no>...   # write page + config to build/vNN (for stills)
  python3 build.py render <no>...    # full build into a new timestamped output folder, ffprobe-verified

Finished videos are never overwritten: each build lands in its own UTC-timestamped folder and
gets a line in output/tunnel-vision/MANIFEST.csv with its sha256.
"""
import hashlib
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
TV = os.path.dirname(HERE)
ROOT = os.path.dirname(TV)
sys.path.insert(0, HERE)
import art  # noqa: E402
import audio  # noqa: E402

END = 20.0


def card_times(texts, start=9.55, end=20.0, gap=0.15):
    words = [len(t.split()) for t in texts]
    last = max(2.1, 0.3 * words[-1] + 0.9)
    last_start = end - last
    weights = [0.3 * w + 0.8 for w in words[:-1]]
    avail = last_start - start - gap * len(weights)
    out, t = [], start
    for w in weights:
        d = avail * w / sum(weights)
        out.append([round(t, 3), round(t + d, 3), texts[len(out)]])
        t += d + gap
    out.append([round(last_start, 3), end, texts[-1]])
    return out


def load(no):
    for v in json.load(open(os.path.join(TV, "videos", "videos.json"))):
        if v["no"] == no:
            v = dict(v)
            v.setdefault("cut", 5.5)
            v.setdefault("end", 15.0)
            v["cards"] = card_times(v["cards"], v["cut"] + 0.5, v["end"])
            return v
    raise SystemExit(f"no video {no}")


def prepare(no):
    cfg = load(no)
    d = os.path.join(TV, "build", f"v{no:02d}")
    os.makedirs(d, exist_ok=True)
    page = open(os.path.join(HERE, "template.html")).read()
    page = page.replace("__SVG__", art.SCENES[no]()).replace("__CFG__", json.dumps(cfg))
    open(os.path.join(d, "page.html"), "w").write(page)
    json.dump(cfg, open(os.path.join(d, "config.json"), "w"), indent=1)
    return cfg, d


def sh(*a):
    subprocess.run(a, check=True)


def probe(path, *args):
    return subprocess.run(["ffprobe", "-v", "error", *args, "-of", "csv=p=0", path],
                          check=True, capture_output=True, text=True).stdout.strip()


def render(no):
    cfg, d = prepare(no)
    name = f"tunnel-vision-{no:02d}-{cfg['slug']}"
    stamp = time.strftime("%Y%m%d-%H%M%S", time.gmtime())
    out = os.path.join(ROOT, "output", "tunnel-vision", f"{no:02d}_{cfg['slug']}", stamp)
    os.makedirs(out)
    wav = os.path.join(d, "mix.wav")
    audio.build(cfg, wav)
    mp4 = os.path.join(out, name + ".mp4")
    sh("node", os.path.join(HERE, "render.js"), os.path.join(d, "page.html"), wav, mp4, "30", str(cfg["end"]))
    sh("ffmpeg", "-v", "error", "-y", "-ss", str(cfg.get("thumb_t", 8.5)), "-i", mp4, "-frames:v", "1", "-q:v", "2",
       os.path.join(out, name + "-thumb.jpg"))
    meta = {"channel": "Tunnel Vision", "series_no": no, "slug": cfg["slug"], **cfg["meta"],
            "suggested_post_times_local": {"youtube": "12:00-15:00 or 19:00-21:00", "tiktok": "18:00-22:00",
                                           "instagram": "11:00-13:00 or 19:00-21:00", "facebook": "13:00-16:00"},
            "script": {"thread": [e for e in cfg["events"] if e["t"] in ("msg", "voice", "type", "erase", "rating")],
                       "reveal": [c[2] for c in cfg["cards"]]},
            "claims": [],
            "format": {"resolution": "1080x1920", "aspect": "9:16", "fps": 30, "duration_s": cfg["end"], "loop": True, "voiceover": False}}
    json.dump(meta, open(os.path.join(out, name + ".json"), "w"), indent=1, ensure_ascii=False)

    # done only if ffprobe verifies size, both streams, full duration, and a clean decode
    assert probe(mp4, "-select_streams", "v:0", "-show_entries", "stream=width,height") == "1080,1920"
    assert probe(mp4, "-select_streams", "a:0", "-show_entries", "stream=codec_type") == "audio"
    dur = float(probe(mp4, "-show_entries", "format=duration"))
    assert abs(dur - cfg["end"]) <= 0.1, dur
    sh("ffmpeg", "-v", "error", "-i", mp4, "-f", "null", "-")
    sha = hashlib.sha256(open(mp4, "rb").read()).hexdigest()
    man = os.path.join(ROOT, "output", "tunnel-vision", "MANIFEST.csv")
    new = not os.path.exists(man)
    with open(man, "a") as f:
        if new:
            f.write("built_utc,video,path,duration_s,sha256\n")
        f.write(f"{stamp},{name}.mp4,{os.path.relpath(mp4, ROOT)},{dur:.6f},{sha}\n")
    print(f"OK {os.path.relpath(mp4, ROOT)} {dur:.2f}s {sha[:12]}")


if __name__ == "__main__":
    cmd, nums = sys.argv[1], [int(x) for x in sys.argv[2:]]
    for n in nums:
        (prepare if cmd == "prepare" else render)(n)
