# Builds voice.wav and beats.json. Each entry: (clip, gap_before_s). Non-voice holds: ("#name", seconds)
import json, subprocess, numpy as np
from scipy.io import wavfile
TEMPO=1.1
SEQ=[("#start",0.25),("h1",0),("#freeze",0.35),("h2",0.1),("#rewind",0.55),
 ("h3",0.1),("g1",0.25),("#splash",0.45),("g2",0.1),("#bite",0.5),("g3a",0.15),("#sniff",0.5),("g3b",0),
 ("n1a",0.3),("n1b",0.1),("n2a",0.35),("n2b",0.1),
 ("#dream",6.4),("c1",0.35),("n3a",0.35),("n3b",0.1),("#door",0.3),
 ("d1",0.1),("d2",0.25),("n4",0.3),("#stand",0.65),("s1a",0),("s1b",0.25),
 ("r1",0.35),("r2",0.25),("r3",0.25),("r4",0.25),("r5",0.25),("#grab",0.3),("r6",0),("h1b",0.2),
 ("#toss",1.4),("e1",0.6),("n5a",0.35),("n5b",0.1),("#end",1.0)]
SR=48000; t=0.0; beats={}; parts=[]
def load(k):
    sr,x=wavfile.read(f"clips/{k}_s.wav"); x=x.astype(np.float32)/32768
    return x
for k,g in SEQ:
    t+=g if not k.startswith("#") else 0
    if k.startswith("#"):
        beats[k[1:]]=round(t,3); t+=g; continue
    src="h1" if k=="h1b" else k
    tmp=f"/tmp/claude-0/t_{k}.wav"
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",f"clips/{src}_s.wav","-af",f"atempo={TEMPO}",tmp],check=True)
    sr,x=wavfile.read(tmp); x=x.astype(np.float32)/32768
    beats[k]=[round(t,3),round(t+len(x)/SR,3)]; parts.append((t,x)); t+=len(x)/SR
total=t; y=np.zeros(int(total*SR)+SR//10,np.float32)
for s,x in parts: i=int(s*SR); y[i:i+len(x)]+=x
wavfile.write("voice.wav",SR,(np.clip(y,-1,1)*32767).astype(np.int16))
json.dump({"total":round(total,3),"beats":beats},open("beats.json","w"),indent=1)
print(round(total,2)); [print(k,v) for k,v in beats.items()]
