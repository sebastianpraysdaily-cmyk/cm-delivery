"""Generate voiceover + beat timings with Kokoro (free, Apache-2.0).
Usage: python3 tts.py content/v001   (needs KOKORO_DIR with kokoro-v1.0.onnx + voices-v1.0.bin;
download: github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0)"""
import json, os, sys, wave, numpy as np
from kokoro_onnx import Kokoro
D = sys.argv[1]; K = os.environ.get("KOKORO_DIR", "/tmp/kokoro") + "/"
k = Kokoro(K + "kokoro-v1.0.onnx", K + "voices-v1.0.bin")
s = json.load(open(f"{D}/script.json")); out = []; t = 0; gap = 0.18; sr = 24000
for b in s["beats"]:
    a, sr = k.create(b["text"], voice=s["voice"], speed=s.get("speed", 1.08), lang="en-us")
    idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, idx[0] - 240):idx[-1] + 480]
    b["start"] = round(t, 3); b["dur"] = round(len(a) / sr, 3)
    out += [a, np.zeros(int(gap * sr), dtype=a.dtype)]; t += len(a) / sr + gap
audio = np.concatenate(out); audio = audio / np.max(np.abs(audio)) * 0.89
with wave.open(f"{D}/vo.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((audio * 32767).astype(np.int16).tobytes())
json.dump(s, open(f"{D}/timing.json", "w"), indent=1)
print("total", round(t, 2)); [print(b["id"], b["start"], b["dur"]) for b in s["beats"]]
