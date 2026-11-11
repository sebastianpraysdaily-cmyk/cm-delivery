"""Export tracker art + bubble geometry for the web app (same trackers as the PDF)."""
import json, os, sys, importlib.util
os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/..")
spec = importlib.util.spec_from_file_location("b", "src/build.py"); b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)
out = []
for s in b.SPRINTS:
    col = b.PAL[s["color"]]
    if s["shape"] is None:
        out.append(dict(id=s["id"], name=s["name"], goal=s["goal"], days=s["days"], color=col, tag=s["tag"], note=s["note"], kind="days", amounts=[0]*7, pts=[], r=0, svg=""))
        continue
    g = s["geom"]
    out.append(dict(id=s["id"], name=s["name"], goal=s["goal"], days=s["days"], color=col, tag=s["tag"], note=s["note"], kind="bubbles",
                    amounts=s["amounts"], pts=g["pts"], r=round(g["step"] * 0.43, 1), svg=b.shape_svg(s["shape"], col, "#1f1b2e", 14)))
json.dump(out, open("app/src/sprints.json", "w"))
print(len(out), sum(len(x["pts"]) for x in out))
