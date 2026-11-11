from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
INK="1D2440"; MINT="DFF5EC"; CORAL="FFE6DE"; SKY="E8EEFC"; CREAM="FBF7EF"
hdr=Font(bold=True,color="FFFFFF",name="Arial"); hfill=PatternFill("solid",fgColor=INK)
inp=PatternFill("solid",fgColor="FFF8D6"); out=PatternFill("solid",fgColor=MINT)
thin=Side(style="thin",color="D9D3C5"); box=Border(left=thin,right=thin,top=thin,bottom=thin)
title=Font(bold=True,size=18,name="Arial",color=INK); note=Font(italic=True,size=9,color="4A5272",name="Arial")
def head(ws,row,cols):
    for i,c in enumerate(cols,1):
        x=ws.cell(row=row,column=i,value=c); x.font=hdr; x.fill=hfill; x.alignment=Alignment(vertical="center",wrap_text=True)
wb=Workbook()
# Start
s=wb.active; s.title="Start Here"
s["A1"]="Forget-Proof Money · Spreadsheet"; s["A1"].font=title
rows=["Yellow cells = you type. Green cells = calculated for you.",
"1. Bill Dump: list every regular bill (Session 1).",
"2. Payday Split: enter your pay. It tells you what to send to each account (Session 2).",
"3. Safe-to-Spend: enter your SPEND balance + days to payday (Session 3 + weekly).",
"4. Money Dates: log your weekly 10-minute check-in.",
"5. Parking Lot: park impulse buys for 72 hours. Unlock date is calculated.",
"Google Sheets: File > Import > Upload this file. Excel / Numbers: just open it.",
"Educational only, not financial advice. Personal use licence: please don't share or resell."]
for i,t in enumerate(rows,3): s.cell(row=i,column=1,value=t).font=Font(name="Arial",size=11)
s.column_dimensions["A"].width=95
# Bill dump
b=wb.create_sheet("Bill Dump"); b["A1"]="Session 1 · The Bill Dump"; b["A1"].font=title
head(b,3,["Bill","Amount ($)","Due day (1-31)","How often","Autopay?","Pays from","Monthly cost ($)"])
dv=DataValidation(type="list",formula1='"Monthly,Weekly,Every 2 weeks,Quarterly,Yearly"',allow_blank=True); b.add_data_validation(dv)
dv2=DataValidation(type="list",formula1='"Yes,No"',allow_blank=True); b.add_data_validation(dv2)
dv3=DataValidation(type="list",formula1='"BILLS,SPEND,Other"',allow_blank=True); b.add_data_validation(dv3)
for r in range(4,34):
    for c in range(1,7): b.cell(row=r,column=c).fill=inp; b.cell(row=r,column=c).border=box
    dv.add(f"D{r}"); dv2.add(f"E{r}"); dv3.add(f"F{r}")
    b.cell(row=r,column=7,value=f'=IF(B{r}="","",ROUND(B{r}*IF(D{r}="Weekly",52/12,IF(D{r}="Every 2 weeks",26/12,IF(D{r}="Quarterly",1/3,IF(D{r}="Yearly",1/12,1)))),2))').fill=out
    b.cell(row=r,column=7).border=box; b.cell(row=r,column=2).number_format='$#,##0.00'; b.cell(row=r,column=7).number_format='$#,##0.00'
b["F35"]="TOTAL MONTHLY BILLS"; b["F35"].font=Font(bold=True,name="Arial")
b["G35"]="=SUM(G4:G33)"; b["G35"].fill=out; b["G35"].font=Font(bold=True,size=13,name="Arial"); b["G35"].number_format='$#,##0.00'
b["A36"]="Not on autopay yet:"; b["B36"]='=COUNTIF(E4:E33,"No")'; b["A36"].font=Font(bold=True,name="Arial")
for col,w in zip("ABCDEFG",[30,13,14,16,11,12,17]): b.column_dimensions[col].width=w
# Payday split
p=wb.create_sheet("Payday Split"); p["A1"]="Session 2 · Your Payday Split"; p["A1"].font=title
lab=[("Take-home pay per paycheck ($)",None),("How often you're paid",None),("Buffer per paycheck ($)",25),("Goals per paycheck ($)",20),("Safety margin on bills (%)",5)]
for i,(l,v) in enumerate(lab,3):
    p.cell(row=i,column=1,value=l).font=Font(name="Arial",bold=True); c=p.cell(row=i,column=2,value=v); c.fill=inp; c.border=box
dvp=DataValidation(type="list",formula1='"Weekly,Every 2 weeks,Twice a month,Monthly"'); p.add_data_validation(dvp); dvp.add("B4"); p["B4"]="Every 2 weeks"
p["B3"].number_format=p["B5"].number_format=p["B6"].number_format='$#,##0.00'
p["A9"]="Paychecks per month"; p["B9"]='=IF(B4="Weekly",52/12,IF(B4="Every 2 weeks",26/12,IF(B4="Twice a month",2,1)))'
p["A10"]="Total monthly bills (from Bill Dump)"; p["B10"]="='Bill Dump'!G35"
head(p,12,["Account","Send per paycheck ($)"])
p["A13"]="BILLS (don't touch)"; p["B13"]='=IFERROR(ROUND(B10/B9*(1+B7/100),2),0)'
p["A14"]="BUFFER"; p["B14"]="=B5"; p["A15"]="GOALS"; p["B15"]="=B6"
p["A16"]="SPEND (what's left)"; p["B16"]='=IF(B3="","",B3-B13-B14-B15)'
for r in (9,10,13,14,15,16): p.cell(row=r,column=2).fill=out; p.cell(row=r,column=2).border=box
for r in (10,13,14,15,16): p.cell(row=r,column=2).number_format='$#,##0.00'
p["B9"].number_format="0.00"; p["B16"].font=Font(bold=True,size=13,name="Arial")
p["A18"]='=IF(AND(B3<>"",B16<0),"⚠ Your bills + savings are more than your pay. Lower Buffer/Goals to $0 for now, and see the guide (page 6).","")'
p["A18"].font=Font(bold=True,color="C0392B",name="Arial")
p["A19"]="Irregular income? Enter your lowest month from the last 6 months as pay, with 'Monthly'."; p["A19"].font=note
p.column_dimensions["A"].width=42; p.column_dimensions["B"].width=22
# Safe to spend
t=wb.create_sheet("Safe-to-Spend"); t["A1"]="Session 3 · Your Safe-to-Spend Number"; t["A1"].font=title
t["A3"]="Money in SPEND right now ($)"; t["B3"].fill=inp
t["A4"]="Next payday (date)"; t["B4"].fill=inp; t["B4"].number_format="yyyy-mm-dd"
t["A6"]="Days until payday"; t["B6"]='=IF(B4="","",MAX(1,B4-TODAY()))'
t["A7"]="SAFE-TO-SPEND PER DAY"; t["B7"]='=IF(OR(B3="",B4=""),"",ROUND(B3/B6,2))'
t["A8"]="SAFE-TO-SPEND PER WEEK"; t["B8"]='=IF(B7="","",ROUND(B7*MIN(7,B6),2))'
for c in ("B3","B4"): t[c].border=box
for c in ("B6","B7","B8"): t[c].fill=out; t[c].border=box
for c in ("B3","B7","B8"): t[c].number_format='$#,##0.00'
for c in ("A3","A4","A6","A7","A8"): t[c].font=Font(bold=True,name="Arial")
t["B7"].font=Font(bold=True,size=16,name="Arial")
t["A10"]="Overspent? Don't fix the past. Update the SPEND balance and the number resets."; t["A10"].font=note
t.column_dimensions["A"].width=36; t.column_dimensions["B"].width=20
# Money dates
m=wb.create_sheet("Money Dates"); m["A1"]="Weekly · The 10-Minute Money Date"; m["A1"].font=title
head(m,3,["Date","SPEND balance ($)","Days to payday","Safe-to-Spend/day ($)","Bills OK?","One win this week"])
for r in range(4,56):
    for c in (1,2,3,5,6): m.cell(row=r,column=c).fill=inp; m.cell(row=r,column=c).border=box
    m.cell(row=r,column=4,value=f'=IF(OR(B{r}="",C{r}=""),"",ROUND(B{r}/MAX(1,C{r}),2))').fill=out
    m.cell(row=r,column=1).number_format="yyyy-mm-dd"; m.cell(row=r,column=2).number_format=m.cell(row=r,column=4).number_format='$#,##0.00'
    dv2b=None
dvm=DataValidation(type="list",formula1='"Yes,No"'); m.add_data_validation(dvm); dvm.add("E4:E55")
for col,w in zip("ABCDEF",[13,18,15,22,11,48]): m.column_dimensions[col].width=w
# Parking lot
k=wb.create_sheet("Parking Lot"); k["A1"]="The Impulse Parking Lot · not no, just not yet"; k["A1"].font=title
head(k,3,["I want…","Price ($)","Parked on","Unlocks on","Status","Still want it?"])
dvk=DataValidation(type="list",formula1='"Yes,No"'); k.add_data_validation(dvk); dvk.add("F4:F60")
for r in range(4,61):
    for c in (1,2,3,6): k.cell(row=r,column=c).fill=inp; k.cell(row=r,column=c).border=box
    k.cell(row=r,column=4,value=f'=IF(C{r}="","",C{r}+3)').fill=out
    k.cell(row=r,column=5,value=f'=IF(C{r}="","",IF(TODAY()>=C{r}+3,"🔓 Unlocked","🔒 Parked"))').fill=out
    k.cell(row=r,column=3).number_format=k.cell(row=r,column=4).number_format="yyyy-mm-dd"; k.cell(row=r,column=2).number_format='$#,##0.00'
k["A62"]="Money not spent (said No):"; k["B62"]='=SUMIF(F4:F60,"No",B4:B60)'; k["B62"].number_format='$#,##0.00'; k["B62"].fill=out; k["A62"].font=Font(bold=True,name="Arial")
for col,w in zip("ABCDEF",[34,12,13,13,14,15]): k.column_dimensions[col].width=w
for ws in wb.worksheets: ws.sheet_view.showGridLines=False if ws.title=="Start Here" else True
wb.save("dist/Forget-Proof-Money-Spreadsheet.xlsx"); print("saved")
