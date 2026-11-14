# Cap every pause in voice to CAP s (keeps a short crossfade), long beats listed in KEEP (index of pause -> seconds)
import re, subprocess, sys, numpy as np
from scipy.io import wavfile
src, dst, cap = sys.argv[1], sys.argv[2], float(sys.argv[3])
keep = {int(k): float(v) for k, v in (a.split(":") for a in sys.argv[4:])}
sr, x = wavfile.read(src); x = x.astype(np.float32)
log = subprocess.run(["ffmpeg","-i",src,"-af","silencedetect=noise=-36dB:d=0.12","-f","null","-"],capture_output=True,text=True).stderr
ss=[float(v) for v in re.findall(r"silence_start: ([\d.]+)",log)]; se=[float(v) for v in re.findall(r"silence_end: ([\d.]+)",log)]
out=[]; cur=0; fade=int(0.01*sr)
for i,(a,b) in enumerate(zip(ss,se)):
    if a < 0.05 or b > len(x)/sr-0.05: continue
    c = keep.get(i, cap)
    if b-a <= c: continue
    A=int(a*sr); B=int(b*sr); h=int(c*sr/2)
    out.append(x[cur:A+h]); cur=B-h
    print(f"pause {i}: {b-a:.2f}s at {a:.2f} -> {c}")
out.append(x[cur:]); y=np.concatenate(out)
wavfile.write(dst, sr, y.astype(np.int16))
print(len(x)/sr, "->", len(y)/sr)
