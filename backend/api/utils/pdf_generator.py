from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch
from io import BytesIO
import os
import datetime
from django.utils import timezone

def generate_payslip_pdf(record):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet()
    
    # Custom styles
    header_style = ParagraphStyle('Header', parent=styles['Heading1'], alignment=1, spaceAfter=20)
    sub_header_style = ParagraphStyle('SubHeader', parent=styles['Heading2'], alignment=0, spaceAfter=10)
    content_style = ParagraphStyle('Content', parent=styles['Normal'], fontSize=10, leading=12)
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontSize=10, fontName='Helvetica-Bold')

    elements = []

    # Title
    elements.append(Paragraph("VEMRE AREMU ENTERPRISE LIMITED", header_style))
    elements.append(Paragraph(f"PAYSLIP FOR {record.payroll_run.month}", ParagraphStyle('Month', parent=styles['Heading3'], alignment=1, spaceAfter=20)))
    
    elements.append(Spacer(1, 0.2*inch))

    # Employee Info Table
    emp_data = [
        [Paragraph("Employee Name:", label_style), Paragraph(record.employee.full_name, content_style)],
        [Paragraph("Employee Code:", label_style), Paragraph(record.employee.employee_code, content_style)],
        [Paragraph("Department:", label_style), Paragraph(record.employee.department.name if record.employee.department else "N/A", content_style)],
        [Paragraph("Job Role:", label_style), Paragraph(record.employee.job_role.name if record.employee.job_role else "N/A", content_style)],
        [Paragraph("Email:", label_style), Paragraph(record.employee.email or "N/A", content_style)],
    ]
    emp_table = Table(emp_data, colWidths=[1.5*inch, 3.5*inch])
    emp_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(emp_table)
    elements.append(Spacer(1, 0.4*inch))

    # Earnings and Deductions Table
    earnings = [
        ["Basic Salary", f"{record.basic_salary:,.2f}"],
    ]
    if record.total_allowances > 0:
        earnings.append(["Other Allowances", f"{record.total_allowances:,.2f}"])
    
    deductions = []
    if record.tax_deduction > 0:
        deductions.append(["Tax (PAYE)", f"{record.tax_deduction:,.2f}"])
    if record.pension_deduction > 0:
        deductions.append(["Pension (8%)", f"{record.pension_deduction:,.2f}"])
    if record.nhf_deduction > 0:
        deductions.append(["NHF (2.5%)", f"{record.nhf_deduction:,.2f}"])
    if record.late_deductions > 0:
        deductions.append(["Lateness Deduction", f"{record.late_deductions:,.2f}"])
    if record.absent_deductions > 0:
        deductions.append(["Absence Deduction", f"{record.absent_deductions:,.2f}"])
    if record.attendance_deduction > 0:
        deductions.append(["Disciplinary Deduction", f"{record.attendance_deduction:,.2f}"])
    
    # Balance the tables for display
    max_rows = max(len(earnings), len(deductions))
    table_data = [[Paragraph("EARNINGS", label_style), "", Paragraph("DEDUCTIONS", label_style), ""]]
    
    for i in range(max_rows):
        row = []
        # Earning col 1 & 2
        if i < len(earnings):
            row.extend(earnings[i])
        else:
            row.extend(["", ""])
        # Deduction col 3 & 4
        if i < len(deductions):
            row.extend(deductions[i])
        else:
            row.extend(["", ""])
        table_data.append(row)
    
    # Totals row
    total_earnings = record.basic_salary + record.total_allowances
    total_deductions = record.tax_deduction + record.late_deductions + record.pension_deduction + record.nhf_deduction + record.absent_deductions + record.attendance_deduction
    
    table_data.append([
        Paragraph("Total Earnings", label_style), Paragraph(f"{total_earnings:,.2f}", label_style),
        Paragraph("Total Deductions", label_style), Paragraph(f"{total_deductions:,.2f}", label_style)
    ])

    summary_table = Table(table_data, colWidths=[1.5*inch, 1*inch, 1.5*inch, 1*inch])
    summary_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('BACKGROUND', (0,0), (1,0), colors.lightgrey),
        ('BACKGROUND', (2,0), (3,0), colors.lightgrey),
        ('ALIGN', (1,1), (1,-1), 'RIGHT'),
        ('ALIGN', (3,1), (3,-1), 'RIGHT'),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.4*inch))

    # Net Pay
    net_pay_data = [
        [Paragraph("NET PAY (Take Home):", label_style), Paragraph(f"NGN {record.net_salary:,.2f}", label_style)]
    ]
    net_pay_table = Table(net_pay_data, colWidths=[2*inch, 3*inch])
    net_pay_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 2, colors.darkgreen),
        ('BACKGROUND', (0,0), (-1,-1), colors.honeydew),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(net_pay_table)

    elements.append(Spacer(1, 1*inch))
    elements.append(Paragraph("This is an electronically generated payslip.", styles['Italic']))

    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf

def generate_leave_approval_pdf(leave_request):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    styles = getSampleStyleSheet()
    
    header_style = ParagraphStyle('Header', parent=styles['Heading1'], alignment=1, spaceAfter=20)
    content_style = ParagraphStyle('Content', parent=styles['Normal'], fontSize=11, leading=14, spaceAfter=12)
    
    elements = []
    elements.append(Paragraph("VEMRE AREMU ENTERPRISE LIMITED", header_style))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph(f"Date: {timezone.now().strftime('%d %B %Y')}", styles['Normal']))
    elements.append(Spacer(1, 0.3*inch))
    
    elements.append(Paragraph("<b>LEAVE APPROVAL</b>", styles['Heading2']))
    elements.append(Spacer(1, 0.2*inch))
    
    elements.append(Paragraph(f"Dear {leave_request.employee.full_name},", content_style))
    
    # Calculate resumption date (next day after end_date)
    resumption_date = leave_request.end_date + datetime.timedelta(days=1)
    
    text = f"""This letter is to formally inform you that your request for {leave_request.leave_type.name} 
    has been approved. Your leave will commence on <b>{leave_request.start_date.strftime('%d %B %Y')}</b> 
    and end on <b>{leave_request.end_date.strftime('%d %B %Y')}</b>.
    <br/><br/>
    You are expected to resume work on <b>{resumption_date.strftime('%d %B %Y')}</b>.
    <br/><br/>
    During your absence, your responsibilities will be handled as discussed with your manager. 
    We wish you a restful leave.
    """
    elements.append(Paragraph(text, content_style))
    
    elements.append(Spacer(1, 1*inch))
    elements.append(Paragraph("Best regards,", content_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("Human Resources Department", content_style))
    elements.append(Paragraph("<b>Vemre Aremu Enterprise Limited</b>", content_style))
    
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf

def generate_resignation_acceptance_pdf(resignation):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    styles = getSampleStyleSheet()
    
    header_style = ParagraphStyle('Header', parent=styles['Heading1'], alignment=1, spaceAfter=20)
    content_style = ParagraphStyle('Content', parent=styles['Normal'], fontSize=11, leading=14, spaceAfter=12)
    
    elements = []
    elements.append(Paragraph("VEMRE AREMU ENTERPRISE LIMITED", header_style))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph(f"Date: {timezone.now().strftime('%d %B %Y')}", styles['Normal']))
    elements.append(Spacer(1, 0.3*inch))
    
    elements.append(Paragraph("<b>ACCEPTANCE OF RESIGNATION</b>", styles['Heading2']))
    elements.append(Spacer(1, 0.2*inch))
    
    elements.append(Paragraph(f"Dear {resignation.employee.full_name},", content_style))
    
    text = f"""We acknowledge receipt of your resignation letter dated <b>{resignation.resignation_date.strftime('%d %B %Y')}</b>.
    <br/><br/>
    Management has accepted your resignation. Accordingly, your last working day with <b>Vemre Aremu Enterprise Limited</b> 
    will be <b>{resignation.last_working_day.strftime('%d %B %Y')}</b>.
    <br/><br/>
    We would like to thank you for your contributions during your tenure with us and wish you 
    the very best in your future endeavors.
    <br/><br/>
    Please ensure that all company properties in your possession are returned to the IT/Admin department 
    on or before your last day.
    """
    elements.append(Paragraph(text, content_style))
    
    elements.append(Spacer(1, 1*inch))
    elements.append(Paragraph("Yours faithfully,", content_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("Human Resources Manager", content_style))
    elements.append(Paragraph("<b>Vemre Aremu Enterprise Limited</b>", content_style))
    
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
