import subprocess, json
# id: (file, start, end, tempo)
S = {
 "h1":("shout",0.20,2.58,1.0), "r6":("shout",2.80,6.20,1.0),
 "h2":("grwm",0.40,2.04,1.05), "h3":("grwm",4.16,7.00,1.05), "g1":("grwm",7.39,8.13,1.0), "g2":("grwm",9.23,9.89,1.0),
 "g3a":("grwm",10.98,11.56,1.0), "g3b":("grwm",11.79,12.94,1.0), "c1":("grwm",14.00,15.86,1.0), "e1":("grwm",16.23,20.28,1.05),
 "n1a":("narr",0.0,2.37,1.08), "n1b":("narr",2.85,6.58,1.08), "n2a":("narr",7.50,10.75,1.08), "n2b":("narr",11.30,13.90,1.08),
 "n3a":("narr",14.80,16.55,1.08), "n3b":("narr",16.58,17.84,1.08), "n4":("narr",18.39,20.40,1.0), "n5a":("narr",21.27,23.82,1.05), "n5b":("narr",24.77,26.38,1.05),
 "d1":("chad",0.36,6.74,1.12), "d2":("chad",7.54,16.78,1.12),
 "s1a":("roast",0.36,0.92,1.0), "s1b":("roast",1.56,5.36,1.0), "r1":("roast",6.00,8.77,1.05), "r2":("roast",9.52,13.40,1.05),
 "r3":("roast",14.04,18.54,1.05), "r4":("roast",19.41,22.18,1.05), "r5":("roast",22.97,25.46,1.0),
}
out = {}
for k,(f,a,b,t) in S.items():
    o=f"clips/{k}.wav"
    af=f"atempo={t}," if t!=1.0 else ""
    subprocess.run(["ffmpeg","-y","-loglevel","error","-ss",str(a),"-to",str(b),"-i",f"raw/{f}.wav","-af",af+"afade=t=in:d=0.02,areverse,afade=t=in:d=0.04,areverse,aresample=48000","-ac","1",o],check=True)
    d=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",o]))
    out[k]=round(d,3)
json.dump(out,open("clips/durations.json","w"),indent=1)
print(out, sum(out.values()))
