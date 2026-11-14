# Pause-based forced alignment: known text + silencedetect segments -> words.json (word, start, end)
import re, json, subprocess, sys
wav, txt, out = sys.argv[1:4]
log = subprocess.run(["ffmpeg","-i",wav,"-af","silencedetect=noise=-38dB:d=0.11","-f","null","-"],capture_output=True,text=True).stderr
ss=[float(x) for x in re.findall(r"silence_start: ([\d.]+)",log)]; se=[float(x) for x in re.findall(r"silence_end: ([\d.]+)",log)]
dur=float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",wav],capture_output=True,text=True).stdout)
sil=list(zip(ss,se))
segs=[];cur=0.0
for a,b in sil:
    if a-cur>0.05: segs.append((cur,a))
    cur=b
if dur-cur>0.05: segs.append((cur,dur))
words=open(txt).read().split()
def syl(w):
    w=re.sub(r"[^a-z]","",w.lower())
    n=len(re.findall(r"[aeiouy]+",w)); 
    if w.endswith("e") and n>1 and not w.endswith("le"): n-=1
    return max(1,n)+0.35
S=[syl(w) for w in words]; P=[1 if re.search(r"[.,!?]$",w) else 0 for w in words]
tot=sum(b-a for a,b in segs); rate=tot/sum(S)
N=len(words); M=len(segs); INF=1e18
pre=[0]
for s in S: pre.append(pre[-1]+s)
dp=[[INF]*(N+1) for _ in range(M+1)]; bk=[[0]*(N+1) for _ in range(M+1)]
dp[0][0]=0
for j in range(1,M+1):
    d=segs[j-1][1]-segs[j-1][0]
    for i in range(1,N+1):
        best=INF;bi=0
        for k in range(max(0,i-25),i):
            if dp[j-1][k]>=INF: continue
            est=rate*(pre[i]-pre[k]); c=((d-est)/max(0.3,est))**2*4
            c+= 0 if (P[i-1] or i==N) else 1.5
            if dp[j-1][k]+c<best: best=dp[j-1][k]+c;bi=k
        dp[j][i]=best;bk[j][i]=bi
i=N;groups=[]
for j in range(M,0,-1):
    k=bk[j][i]; groups.append((k,i,segs[j-1])); i=k
groups.reverse(); res=[]
for k,i,(a,b) in groups:
    tot=pre[i]-pre[k]; t=a
    for w in range(k,i):
        d=(b-a)*S[w]/tot; res.append([words[w],round(t,3),round(t+d,3)]); t+=d
json.dump({"dur":dur,"words":res},open(out,"w"))
for k,i,(a,b) in groups: print(f"{a:6.2f}-{b:6.2f}  "+" ".join(words[k:i]))
