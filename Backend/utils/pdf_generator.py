import io
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_timetable_pdf(title, timetable_records):
    """
    Generates a professional PDF timetable document using ReportLab.
    Returns bytes buffer of the PDF file.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CollegeTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor('#0b5ed7'),
        alignment=1, # Center
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#1e293b'),
        alignment=1,
        spaceAfter=15
    )

    elements = []
    
    # Header
    elements.append(Paragraph("Shantilal Shah Engineering College (SSEC), Bhavnagar", title_style))
    elements.append(Paragraph(f"Department of Information Technology — {title}", subtitle_style))
    elements.append(Spacer(1, 10))

    # Table Header
    table_data = [
        ["Day", "Time Slot", "Sem", "Classroom", "Subject", "Faculty", "Room"]
    ]

    for record in timetable_records:
        table_data.append([
            record.get('day', '-'),
            record.get('time_slot', '-'),
            f"Sem {record.get('semester', '-')}",
            record.get('classroom', '-'),
            record.get('subject', '-'),
            record.get('professor', '-'),
            record.get('room_number', '-')
        ])

    if len(table_data) == 1:
        table_data.append(["No schedules found", "-", "-", "-", "-", "-", "-"])

    # Build Table
    t = Table(table_data, colWidths=[90, 110, 50, 90, 180, 130, 70])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0d6efd')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    elements.append(t)
    doc.build(elements)
    
    buffer.seek(0)
    return buffer.getvalue()
