from pathlib import Path
from xml.sax.saxutils import escape
from docx import Document
from docx.table import Table as DocxTable
from docx.text.paragraph import Paragraph as DocxParagraph
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, PageBreak, KeepTogether

ROOT=Path(r'D:\duAnCaNhan\Sign_Light_Web')
DOCX=ROOT/'deliverables'/'SignLight_EXE201_Outcome1_Presentation_Script_IV_V.docx'
PDF=ROOT/'deliverables'/'SignLight_EXE201_Outcome1_Presentation_Script_IV_V.pdf'
pdfmetrics.registerFont(TTFont('Arial',r'C:\Windows\Fonts\arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold',r'C:\Windows\Fonts\arialbd.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Italic',r'C:\Windows\Fonts\ariali.ttf'))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='Arial-Bold',italic='Arial-Italic',boldItalic='Arial-Bold')

navy=colors.HexColor('#131B2E'); teal=colors.HexColor('#08737C');muted=colors.HexColor('#4D5B68')
styles={
 'Title':ParagraphStyle('Title',fontName='Arial-Bold',fontSize=20,leading=26,textColor=colors.black,spaceAfter=13),
 'Heading 1':ParagraphStyle('H1',fontName='Arial-Bold',fontSize=13,leading=17,textColor=colors.black,spaceBefore=14,spaceAfter=5,keepWithNext=True),
 'Heading 2':ParagraphStyle('H2',fontName='Arial-Bold',fontSize=10.3,leading=14,textColor=colors.black,spaceBefore=9,spaceAfter=4,keepWithNext=True),
 'Slide Meta':ParagraphStyle('Meta',fontName='Arial-Bold',fontSize=8.7,leading=12,textColor=muted,spaceAfter=3,keepWithNext=True),
 'Stage Cue':ParagraphStyle('Cue',fontName='Arial-Italic',fontSize=9,leading=13,textColor=teal,spaceAfter=5,keepWithNext=True),
 'Normal':ParagraphStyle('Body',fontName='Arial',fontSize=9.6,leading=14.6,textColor=navy,spaceAfter=7,alignment=TA_LEFT),
}
table_style=ParagraphStyle('Cell',fontName='Arial',fontSize=8.6,leading=11.5,textColor=navy)
header_style=ParagraphStyle('HeaderCell',fontName='Arial-Bold',fontSize=8.6,leading=11.5,textColor=colors.white)

doc=Document(DOCX)
story=[]
body=doc.element.body
seen_slide=False
for child in body.iterchildren():
    if isinstance(child,CT_P):
        p=DocxParagraph(child,doc)
        content=p.text.strip()
        if not content:continue
        style=p.style.name if p.style else 'Normal'
        if content.startswith('Slide 1  ') and not seen_slide:
            story.append(PageBreak());seen_slide=True
        if content.startswith('Slide 15  '):
            story.append(PageBreak())
        safe=escape(content)
        if style=='Normal' and content.startswith('• '):
            safe='• '+escape(content[2:])
        story.append(Paragraph(safe,styles.get(style,styles['Normal'])))
    elif isinstance(child,CT_Tbl):
        t=DocxTable(child,doc)
        data=[]
        for ri,row in enumerate(t.rows):
            data.append([Paragraph(escape(cell.text),header_style if ri==0 else table_style) for cell in row.cells])
        widths=[1.45*inch,2.2*inch,2.22*inch] if len(data[0])==3 else [1.46*inch,4.41*inch]
        tbl=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
        tbl.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#203148')),
            ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#EAF4F3')]),
            ('GRID',(0,0),(-1,-1),.35,colors.HexColor('#D9D9D9')),
            ('VALIGN',(0,0),(-1,-1),'TOP'),
            ('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),
            ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
        ]))
        story.extend([tbl,Spacer(1,8)])

def page_footer(canvas,doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#DCE6E5'));canvas.setLineWidth(.5)
    canvas.line(49,43,A4[0]-49,43)
    canvas.setFont('Arial',8);canvas.setFillColor(muted)
    canvas.drawString(49,30,'SignLight  |  EXE201 Outcome 1')
    canvas.drawRightString(A4[0]-49,30,str(doc.page))
    canvas.restoreState()

PDF.parent.mkdir(parents=True,exist_ok=True)
SimpleDocTemplate(str(PDF),pagesize=A4,rightMargin=49,leftMargin=49,topMargin=48,bottomMargin=57,title='SignLight EXE201 Outcome 1 Presentation Script').build(story,onFirstPage=page_footer,onLaterPages=page_footer)
print(PDF)
