from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, Table, TableStyle, Flowable
from reportlab.lib.units import inch
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / 'output' / 'pdf'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

COMPANY_LOGO = ROOT / 'img' / 'vemre_logo.png'
DEV_LOGO = ROOT / 'img' / 'acenelog.png'

SCREENSHOT_DIR = ROOT / 'output' / 'playwright'
SCREENSHOTS = [
    ('Dashboard Overview', SCREENSHOT_DIR / 'dashboard.png'),
    ('Recruitment Pipeline', SCREENSHOT_DIR / 'recruitment.png'),
    ('Attendance Management', SCREENSHOT_DIR / 'attendance.png'),
    ('Payroll Management', SCREENSHOT_DIR / 'payroll.png'),
    ('Reimbursements', SCREENSHOT_DIR / 'reimbursements.png'),
    ('Connect and Chat', SCREENSHOT_DIR / 'chat.png'),
    ('My Payout', SCREENSHOT_DIR / 'payout.png'),
]


class CoverPage(Flowable):
    def __init__(self, company_logo, dev_logo):
        super().__init__()
        self.company_logo = company_logo
        self.dev_logo = dev_logo
        self.width, self.height = A4

    def draw(self):
        c = self.canv
        width, height = self.width, self.height

        c.setFillColor(colors.HexColor('#0f172a'))
        c.rect(0, height - 220, width, 220, fill=1, stroke=0)

        c.setFillColor(colors.HexColor('#f8fafc'))
        c.rect(0, 0, width, height - 220, fill=1, stroke=0)

        c.setFillColor(colors.HexColor('#14b8a6'))
        c.rect(0, height - 224, width, 6, fill=1, stroke=0)

        if self.company_logo.exists():
            c.drawImage(str(self.company_logo), 50, height - 140, width=140, height=55, mask='auto', preserveAspectRatio=True)
        if self.dev_logo.exists():
            c.drawImage(str(self.dev_logo), width - 190, height - 150, width=140, height=60, mask='auto', preserveAspectRatio=True)

        c.setFillColor(colors.white)
        c.setFont('Helvetica-Bold', 24)
        c.drawString(50, height - 190, 'VEMRE HRIS')
        c.setFont('Helvetica', 12)
        c.drawString(50, height - 210, 'Enterprise HR, Performance, and Workforce Management Suite')

        c.setFillColor(colors.HexColor('#0f172a'))
        c.setFont('Helvetica-Bold', 20)
        c.drawString(50, height - 280, 'Product Documentation')
        c.setFont('Helvetica', 12)
        c.drawString(50, height - 305, 'Installation, configuration, and usage guide')

        c.setFillColor(colors.HexColor('#334155'))
        c.setFont('Helvetica', 10)
        c.drawString(50, 60, 'Prepared for operational teams and system administrators')
        c.drawString(50, 44, 'Developer: Acenet Technology')


class ScreenshotCard(Flowable):
    def __init__(self, title, image_path, width=6.8 * inch, height=3.9 * inch):
        super().__init__()
        self.title = title
        self.image_path = Path(image_path)
        self.width = width
        self.height = height

    def wrap(self, availWidth, availHeight):
        return self.width, self.height + 18

    def draw(self):
        c = self.canv
        c.setFillColor(colors.HexColor('#0f172a'))
        c.setFont('Helvetica-Bold', 11)
        c.drawString(6, self.height + 6, self.title)

        c.setFillColor(colors.HexColor('#e2e8f0'))
        c.rect(0, 0, self.width, self.height, fill=1, stroke=0)

        if self.image_path.exists():
            c.drawImage(str(self.image_path), 4, 4, width=self.width - 8, height=self.height - 8, preserveAspectRatio=True, anchor='c')
        else:
            c.setFillColor(colors.HexColor('#94a3b8'))
            c.setFont('Helvetica', 10)
            c.drawCentredString(self.width / 2, self.height / 2 + 6, 'Screenshot placeholder')
            c.setFont('Helvetica-Bold', 12)
            c.drawCentredString(self.width / 2, self.height / 2 - 10, self.title)


def build_document():
    filename = OUTPUT_DIR / 'vemre_hris_documentation.pdf'
    doc = SimpleDocTemplate(
        str(filename),
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=54,
        bottomMargin=48,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle('SectionTitle', parent=styles['Heading2'], textColor=colors.HexColor('#0f172a'), spaceAfter=12))
    styles.add(ParagraphStyle('Body', parent=styles['BodyText'], fontSize=10, leading=14, spaceAfter=8))
    styles.add(ParagraphStyle('Caption', parent=styles['BodyText'], fontSize=9, textColor=colors.HexColor('#64748b'), spaceAfter=6))

    elements = []
    elements.append(CoverPage(COMPANY_LOGO, DEV_LOGO))
    elements.append(PageBreak())

    def section_header(title):
        table = Table([[Paragraph(title, styles['SectionTitle'])]], colWidths=[6.8 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        return table

    elements.append(section_header('About VEMRE HRIS'))
    elements.append(Paragraph(
        'VEMRE HRIS is a full scale Human Resource Information System that blends core HR operations with performance, payroll, and employee engagement workflows. '
        'The platform centralizes workforce data so HR teams can manage recruitment pipelines, attendance, salary processing, reimbursements, and internal communications from a single console.',
        styles['Body']
    ))
    elements.append(Paragraph(
        'This documentation provides a complete setup and usage guide, highlighting the application features, configuration steps, and recommended operating practices for enterprise teams.',
        styles['Body']
    ))

    elements.append(section_header('Key Value for Companies'))
    value_points = [
        'Unified employee database with structured job roles and departmental insights.',
        'Automated attendance and lateness deductions integrated into payroll processing.',
        'Recruitment workflow management from application to offer letters.',
        'Self service portal for employees to review KPIs, payslips, documents, and tickets.',
        'Secure internal messaging and collaboration across departments.'
    ]
    for point in value_points:
        elements.append(Paragraph(f'- {point}', styles['Body']))

    elements.append(section_header('Core Features'))
    feature_blocks = [
        ('HR Management', 'Departments, employee profiles, job roles, bulk imports, and structured approvals.'),
        ('Recruitment Hub', 'Public job postings, applicant tracking, interviews, and offer letter generation.'),
        ('Attendance and Compliance', 'Daily clock in, geofencing support, lateness classification, and query letters.'),
        ('Payroll Engine', 'Automated salary calculations, tax deductions, payslip generation, and approvals.'),
        ('Reimbursements', 'Expense submissions, approval workflows, and payment tracking.'),
        ('Knowledge and Onboarding', 'Company articles, onboarding guides, and AI assistance.'),
        ('Connect and Chat', 'Direct internal messaging with file attachments.'),
    ]
    for title, desc in feature_blocks:
        elements.append(Paragraph(f'<b>{title}:</b> {desc}', styles['Body']))

    elements.append(PageBreak())
    elements.append(section_header('Technology Stack'))
    elements.append(Paragraph('Backend: Django 5, Django REST Framework, JWT authentication, SQLite for development, and optional PostgreSQL for production.', styles['Body']))
    elements.append(Paragraph('Frontend: React 18, TypeScript, Vite, TailwindCSS, and Axios for API integration.', styles['Body']))
    elements.append(Paragraph('Supporting services: ReportLab for document generation and scheduled operational scripts.', styles['Body']))

    elements.append(section_header('Installation Guide'))
    elements.append(Paragraph('<b>Backend Setup</b>', styles['Body']))
    backend_steps = [
        'Navigate to the backend directory: cd backend',
        'Create and activate a virtual environment: python -m venv venv',
        'Install dependencies: pip install -r requirements.txt',
        'Run migrations: python manage.py migrate',
        'Seed demo data (optional): python seed_data.py from the project root',
        'Start server: python manage.py runserver 0.0.0.0:8000'
    ]
    for step in backend_steps:
        elements.append(Paragraph(f'- {step}', styles['Body']))

    elements.append(Paragraph('<b>Frontend Setup</b>', styles['Body']))
    frontend_steps = [
        'Navigate to the frontend directory: cd frontend',
        'Install dependencies: npm install',
        'Configure API URL in frontend/.env.local: VITE_API_URL=http://localhost:8000/api/v1',
        'Start the frontend: npm run dev'
    ]
    for step in frontend_steps:
        elements.append(Paragraph(f'- {step}', styles['Body']))

    elements.append(PageBreak())
    elements.append(section_header('Usage Overview'))
    usage_sections = [
        ('Login', 'Use provided admin or HR credentials to access the dashboard.'),
        ('Dashboard', 'Review real time workforce statistics, attendance highlights, and payroll status.'),
        ('Recruitment', 'Manage job postings, move applicants through pipeline stages, and issue offer letters.'),
        ('Attendance', 'Upload attendance logs, process monthly attendance, and review lateness deductions.'),
        ('Payroll', 'Sync attendance, process payroll runs, approve payroll, and distribute payslips.'),
        ('Reimbursements', 'Review claims, approve requests, and record payments.'),
        ('Connect and Chat', 'Start direct chats with colleagues and share files.'),
        ('Self Service', 'Employees can view KPIs, documents, leaves, tickets, and payout history.'),
    ]
    for title, desc in usage_sections:
        elements.append(Paragraph(f'<b>{title}:</b> {desc}', styles['Body']))

    elements.append(section_header('Screenshots'))
    elements.append(Paragraph('Screenshots below highlight key areas of the application interface. Replace placeholders with live captures for final distribution.', styles['Caption']))

    for title, path in SCREENSHOTS:
        elements.append(ScreenshotCard(title, path))
        elements.append(Spacer(1, 0.2 * inch))

    elements.append(PageBreak())
    elements.append(section_header('Deployment and Operations'))
    elements.append(Paragraph('Deploy backend services using Gunicorn or Daphne behind Nginx. Build the frontend with npm run build and host the dist directory.', styles['Body']))
    elements.append(Paragraph('Configure environment variables for SECRET_KEY, DEBUG, ALLOWED_HOSTS, EMAIL_HOST, and database credentials.', styles['Body']))
    elements.append(Paragraph('Establish backup routines using the admin export tool and schedule regular database snapshots.', styles['Body']))

    elements.append(section_header('Improvement Opportunities'))
    improvements = [
        'Integrate a configurable offer letter template editor with approval workflows.',
        'Add advanced analytics dashboards for department level KPI trends.',
        'Introduce payroll batch exports aligned with bank transfer templates.',
        'Implement multi factor authentication and audit log alerts.'
    ]
    for item in improvements:
        elements.append(Paragraph(f'- {item}', styles['Body']))

    elements.append(section_header('Support and Maintenance'))
    elements.append(Paragraph('For feature requests or operational support, contact the development team at Acenet Technology.', styles['Body']))

    doc.build(elements)
    return filename


if __name__ == '__main__':
    output = build_document()
    print(f"Generated {output}")
