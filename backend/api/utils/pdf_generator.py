from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch
from io import BytesIO
import os
import datetime
from django.utils import timezone
from django.conf import settings

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

    # Logo
    logo_path = os.path.join(settings.BASE_DIR, '..', 'img', 'vemre_logo.png')
    if os.path.exists(logo_path):
        logo_img = Image(logo_path, width=1.5*inch, height=0.6*inch)
        logo_img.hAlign = 'CENTER'
        elements.append(logo_img)
        elements.append(Spacer(1, 0.1*inch))
    
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
    # Logo
    logo_path = os.path.join(settings.BASE_DIR, '..', 'img', 'vemre_logo.png')
    if os.path.exists(logo_path):
        logo_img = Image(logo_path, width=1.5*inch, height=0.6*inch)
        logo_img.hAlign = 'CENTER'
        elements.append(logo_img)
        elements.append(Spacer(1, 0.1*inch))
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
    # Logo
    logo_path = os.path.join(settings.BASE_DIR, '..', 'img', 'vemre_logo.png')
    if os.path.exists(logo_path):
        logo_img = Image(logo_path, width=1.5*inch, height=0.6*inch)
        logo_img.hAlign = 'CENTER'
        elements.append(logo_img)
        elements.append(Spacer(1, 0.1*inch))
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

def generate_offer_letter_pdf(applicant, cv_email=None):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=48)
    styles = getSampleStyleSheet()

    header_style = ParagraphStyle('Header', parent=styles['Heading1'], alignment=1, spaceAfter=18)
    section_title = ParagraphStyle('SectionTitle', parent=styles['Heading3'], spaceAfter=8)
    content_style = ParagraphStyle('Content', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=10)
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontSize=10, fontName='Helvetica-Bold')

    elements = []

    logo_path = os.path.join(settings.BASE_DIR, '..', 'img', 'vemre_logo.png')
    if os.path.exists(logo_path):
        logo_img = Image(logo_path, width=1.6 * inch, height=0.6 * inch)
        logo_img.hAlign = 'CENTER'
        elements.append(logo_img)
        elements.append(Spacer(1, 0.12 * inch))

    company_name = "Vemre Aremu Enterprise Limited"
    elements.append(Paragraph(company_name.upper(), header_style))
    elements.append(Paragraph("Offer of Employment", ParagraphStyle('OfferTitle', parent=styles['Heading2'], alignment=1, spaceAfter=12)))
    elements.append(Paragraph(f"Date: {timezone.now().strftime('%d %B %Y')}", styles['Normal']))
    elements.append(Spacer(1, 0.2 * inch))

    applicant_name = f"{applicant.first_name} {applicant.last_name}".strip()
    job = applicant.job_posting
    applied_date = applicant.created_at.strftime('%d %B %Y') if applicant.created_at else "N/A"

    resume_name = os.path.basename(applicant.resume.name) if applicant.resume else "N/A"
    resume_ext = os.path.splitext(resume_name)[1].replace('.', '').upper() if applicant.resume else "N/A"
    resume_size = "N/A"
    if applicant.resume and hasattr(applicant.resume, 'size'):
        resume_size = f"{round(applicant.resume.size / 1024, 1)} KB"

    elements.append(Paragraph(f"Dear {applicant_name},", content_style))
    elements.append(Paragraph(
        f"We are pleased to offer you employment for the position of <b>{job.title}</b> at {company_name}. "
        "This offer is based on your application and our assessment of your qualifications.",
        content_style
    ))

    elements.append(Paragraph("Application Details", section_title))
    app_data = [
        [Paragraph("Applicant Name:", label_style), Paragraph(applicant_name, content_style)],
        [Paragraph("Email:", label_style), Paragraph(applicant.email or "N/A", content_style)],
        [Paragraph("Phone:", label_style), Paragraph(applicant.phone or "N/A", content_style)],
        [Paragraph("LinkedIn:", label_style), Paragraph(applicant.linkedin_profile or "N/A", content_style)],
        [Paragraph("Applied On:", label_style), Paragraph(applied_date, content_style)],
        [Paragraph("Current Status:", label_style), Paragraph(applicant.status or "N/A", content_style)],
    ]
    app_table = Table(app_data, colWidths=[1.6 * inch, 4.2 * inch])
    app_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(app_table)
    elements.append(Spacer(1, 0.2 * inch))

    elements.append(Paragraph("Attached CV Details", section_title))
    cv_data = [
        [Paragraph("File Name:", label_style), Paragraph(resume_name, content_style)],
        [Paragraph("File Type:", label_style), Paragraph(resume_ext or "N/A", content_style)],
        [Paragraph("File Size:", label_style), Paragraph(resume_size, content_style)],
        [Paragraph("CV Email:", label_style), Paragraph(cv_email or "N/A", content_style)],
    ]
    cv_table = Table(cv_data, colWidths=[1.6 * inch, 4.2 * inch])
    cv_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(cv_table)
    elements.append(Spacer(1, 0.2 * inch))

    elements.append(Paragraph("Job Information", section_title))
    job_data = [
        [Paragraph("Title:", label_style), Paragraph(job.title, content_style)],
        [Paragraph("Department:", label_style), Paragraph(job.department.name if job.department else "N/A", content_style)],
        [Paragraph("Job Type:", label_style), Paragraph(job.job_type or "N/A", content_style)],
        [Paragraph("Location:", label_style), Paragraph(job.location or "N/A", content_style)],
        [Paragraph("Salary Range:", label_style), Paragraph(job.salary_range or "N/A", content_style)],
        [Paragraph("Closing Date:", label_style), Paragraph(job.closing_date.strftime('%d %B %Y') if job.closing_date else "N/A", content_style)],
    ]
    job_table = Table(job_data, colWidths=[1.6 * inch, 4.2 * inch])
    job_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(job_table)
    elements.append(Spacer(1, 0.15 * inch))

    if job.description:
        elements.append(Paragraph("Role Summary", section_title))
        elements.append(Paragraph(job.description.replace('\n', '<br/>'), content_style))

    if job.requirements:
        elements.append(Paragraph("Key Requirements", section_title))
        elements.append(Paragraph(job.requirements.replace('\n', '<br/>'), content_style))

    elements.append(Paragraph(
        "Please review this offer and reply to confirm your acceptance. Additional onboarding details will follow upon confirmation.",
        content_style
    ))

    elements.append(Spacer(1, 0.4 * inch))
    elements.append(Paragraph("Sincerely,", content_style))
    elements.append(Paragraph("Human Resources Department", content_style))
    elements.append(Paragraph(f"<b>{company_name}</b>", content_style))

    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
