import json
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import FormulaRule
from openpyxl.worksheet.datavalidation import DataValidation
S=json.load(open("src/sprints.json"))
HEX={"pink":"FF5FA2","sun":"FFD23F","mint":"3DDC97","sky":"4CC9F0","grape":"7B61FF","tang":"FF8C42"}
INK="1F1B2E"; thin=Side(style="medium",color=INK); box=Border(left=thin,right=thin,top=thin,bottom=thin)
F=lambda **k: Font(name="Arial",**k)
wb=Workbook(); ov=wb.active; ov.title="Start Here"
ov["A1"]="Savings Sprints · Spreadsheet"; ov["A1"].font=F(bold=True,size=20,color=INK)
ov["A2"]="Open a sprint tab. Save a bubble's amount, then pick ✓ under it. The bubble turns color and the bar fills."; ov["A2"].font=F(size=11)
ov["A3"]="Google Sheets: File > Import > Upload. Excel / Numbers: just open it. Educational only. Personal use licence."; ov["A3"].font=F(size=9,italic=True,color="5B5670")
for i,h in enumerate(["Sprint","Goal","Saved","Progress",""],1):
    c=ov.cell(row=5,column=i,value=h); c.font=F(bold=True,color="FFFFFF"); c.fill=PatternFill("solid",fgColor=INK)
COLS=8
for n,s in enumerate(S,1):
    title=f"{n:02d} {s['name']}"[:31]; ws=wb.create_sheet(title); col=HEX[s["color"]]
    ws["A1"]=s["name"]; ws["A1"].font=F(bold=True,size=22,color=INK)
    ws["A2"]=f"{s['days']} · {s['note']}"; ws["A2"].font=F(size=10,color="5B5670")
    amts=s.get("amounts") or [0]*7
    labels=["MON","TUE","WED","THU","FRI","SAT","SUN"] if s["goal"]==0 else None
    first=6; cells=[]
    dv=DataValidation(type="list",formula1='"✓"',allow_blank=True); ws.add_data_validation(dv)
    for i,a in enumerate(amts):
        r=first+(i//COLS)*2; c=1+i%COLS
        top=ws.cell(row=r,column=c,value=(labels[i] if labels else a))
        top.font=F(bold=True,size=14,color=INK); top.alignment=Alignment(horizontal="center",vertical="center"); top.border=box
        if not labels: top.number_format='"$"#,##0'
        tick=ws.cell(row=r+1,column=c); tick.alignment=Alignment(horizontal="center"); tick.font=F(size=12,bold=True,color=INK)
        tick.fill=PatternFill("solid",fgColor="FFF8F0"); dv.add(tick.coordinate)
        ws.conditional_formatting.add(top.coordinate,FormulaRule(formula=[f'{tick.coordinate}="✓"'],fill=PatternFill("solid",fgColor=col,bgColor=col)))
        cells.append((top.coordinate,tick.coordinate))
        ws.row_dimensions[r].height=34
    for c in range(1,COLS+1): ws.column_dimensions[chr(64+c)].width=9
    last=first+((len(amts)-1)//COLS)*2+3
    goal_txt = "7 days" if s["goal"]==0 else s["goal"]
    ws.cell(row=3,column=1,value="Goal").font=F(bold=True); g=ws.cell(row=3,column=2,value=goal_txt); g.font=F(bold=True,size=13)
    if s["goal"]: g.number_format='"$"#,##0'
    ws.cell(row=3,column=4,value="Saved").font=F(bold=True)
    if s["goal"]:
        saved="+".join(f'IF({t}="✓",{a},0)' for a,t in cells)
        ws.cell(row=3,column=5,value=f"={saved}").number_format='"$"#,##0'
        pct=f"E3/{s['goal']}"
    else:
        ws.cell(row=3,column=5,value="="+"+".join(f'IF({t}="✓",1,0)' for a,t in cells)).number_format='0" days"'
        pct="E3/7"
    ws.cell(row=3,column=5).font=F(bold=True,size=13)
    ws.cell(row=4,column=1,value="Progress").font=F(bold=True)
    bar=ws.cell(row=4,column=2,value=f'=REPT("█",ROUND({pct}*20,0))&REPT("░",20-ROUND({pct}*20,0))&"  "&TEXT({pct},"0%")'); bar.font=Font(name="Consolas",size=13,color=col,bold=True)
    ws.merge_cells(start_row=4,start_column=2,end_row=4,end_column=8)
    ws.cell(row=last,column=1,value="Reward at 100%:").font=F(bold=True); ws.cell(row=last,column=3).fill=PatternFill("solid",fgColor="FFF1B8")
    # overview row
    rr=5+n; ov.cell(row=rr,column=1,value=s["name"]); ov.cell(row=rr,column=2,value=goal_txt)
    if s["goal"]: ov.cell(row=rr,column=2).number_format='"$"#,##0'
    ov.cell(row=rr,column=3,value=f"='{title}'!E3"); ov.cell(row=rr,column=4,value=f"='{title}'!B4"); ov.cell(row=rr,column=4).font=Font(name="Consolas",color=col,bold=True)
ov.cell(row=19,column=1,value="TOTAL SAVED").font=F(bold=True,size=13)
ov.cell(row=19,column=3,value="=SUM(C6:C7,C9:C17)").number_format='"$"#,##0'; ov.cell(row=19,column=3).font=F(bold=True,size=13)
for c,w in zip("ABCD",[26,10,12,34]): ov.column_dimensions[c].width=w
wb.save("dist/Savings-Sprints-Spreadsheet.xlsx"); print("saved",len(S),"sprints")
