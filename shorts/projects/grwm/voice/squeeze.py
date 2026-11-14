import numpy as np, json, glob, os
from scipy.io import wavfile
class sf:
    @staticmethod
    def read(p):
        sr,x=wavfile.read(p); return x.astype(np.float64)/32768.0, sr
    @staticmethod
    def write(p,y,sr): wavfile.write(p,sr,(np.clip(y,-1,1)*32767).astype(np.int16))
CAP=0.16
out={}
for p in sorted(glob.glob("clips/*.wav")):
    if p.endswith("_s.wav"): continue
    x,sr=sf.read(p); w=int(0.02*sr)
    n=len(x)//w; e=np.array([np.sqrt(np.mean(x[i*w:(i+1)*w]**2)+1e-12) for i in range(n)])
    db=20*np.log10(e); q=db< -40
    keep=np.ones(n,bool); i=0
    while i<n:
        if q[i]:
            j=i
            while j<n and q[j]: j+=1
            if 0<i and j<n and (j-i)*0.02>CAP:
                ex=(j-i)-int(CAP/0.02); a=i+((j-i)-ex)//2; keep[a:a+ex]=False
            i=j
        else: i+=1
    y=np.concatenate([x[k*w:(k+1)*w] for k in range(n) if keep[k]]+[x[n*w:]])
    k=os.path.basename(p)[:-4]; sf.write(f"clips/{k}_s.wav",y,sr); out[k]=round(len(y)/sr,3)
json.dump(out,open("clips/durations.json","w"),indent=1); print(out, round(sum(out.values()),1))
