from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.lib.units import cm
import os
from datetime import datetime


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_DIR = os.path.join(ROOT, "output", "pdf")
os.makedirs(OUTPUT_DIR, exist_ok=True)

OUT_PATH = os.path.join(OUTPUT_DIR, "vemrehr_app_documentation.pdf")

LOGO_COMPANY = os.path.join(ROOT, "img", "vemre_logo.png")
LOGO_DEVELOPER = os.path.join(ROOT, "img", "acenelog.png")
SPLASH_IMAGE = os.path.join(
    ROOT,
    "frontend",
    "android",
    "app",
    "src",
    "main",
    "res",
    "drawable-port-xxxhdpi",
    "splash.png",
)

PAGE_WIDTH, PAGE_HEIGHT = A4

PRIMARY = colors.HexColor("#0f172a")
ACCENT = colors.HexColor("#16a34a")
MUTED = colors.HexColor("#64748b")
LIGHT_BG = colors.HexColor("#f8fafc")
WHITE = colors.white


def draw_header(c, title, subtitle=None):
    c.setFillColor(PRIMARY)
    c.rect(0, PAGE_HEIGHT - 70, PAGE_WIDTH, 70, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(2.2 * cm, PAGE_HEIGHT - 40, title)
    if subtitle:
        c.setFont("Helvetica", 10)
        c.setFillColor(colors.HexColor("#e2e8f0"))
        c.drawString(2.2 * cm, PAGE_HEIGHT - 58, subtitle)


def draw_footer(c, page_num):
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9)
    c.drawRightString(PAGE_WIDTH - 2 * cm, 1.2 * cm, f"Page {page_num}")


def draw_wrapped_text(c, text, x, y, width, font="Helvetica", size=10, leading=14, color=colors.black):
    c.setFont(font, size)
    c.setFillColor(color)
    lines = simpleSplit(text, font, size, width)
    for i, line in enumerate(lines):
        c.drawString(x, y - i * leading, line)
    return y - len(lines) * leading


def draw_bullets(c, items, x, y, width, bullet="-", font="Helvetica", size=10, leading=14):
    for item in items:
        c.setFont(font, size)
        c.setFillColor(colors.black)
        c.drawString(x, y, bullet)
        y = draw_wrapped_text(c, item, x + 12, y, width - 12, font, size, leading)
        y -= 4
    return y


def draw_screenshot_placeholder(c, x, y, w, h, title):
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor("#cbd5f5"))
    c.setLineWidth(1)
    c.rect(x, y - h, w, h, fill=1, stroke=1)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#334155"))
    c.drawString(x + 10, y - 18, title)
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawString(x + 10, y - 34, "Screenshot placeholder - replace with live capture")


def draw_cover(c):
    c.setFillColor(PRIMARY)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

    c.setFillColor(colors.HexColor("#1e293b"))
    c.rect(0, PAGE_HEIGHT * 0.55, PAGE_WIDTH, PAGE_HEIGHT * 0.45, fill=1, stroke=0)

    c.setFillColor(ACCENT)
    c.rect(0, PAGE_HEIGHT * 0.53, PAGE_WIDTH * 0.18, 12, fill=1, stroke=0)

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(2.4 * cm, PAGE_HEIGHT * 0.7, "Vemre HRIS")

    c.setFont("Helvetica", 14)
    c.setFillColor(colors.HexColor("#e2e8f0"))
    c.drawString(2.4 * cm, PAGE_HEIGHT * 0.66, "Enterprise Human Resource Intelligence System")

    c.setFont("Helvetica", 11)
    c.drawString(2.4 * cm, PAGE_HEIGHT * 0.62, "Comprehensive Product & User Documentation")

    c.setFillColor(colors.HexColor("#0b1220"))
    c.roundRect(2.4 * cm, PAGE_HEIGHT * 0.52, PAGE_WIDTH - 4.8 * cm, 90, 12, fill=1, stroke=0)

    c.setFillColor(colors.HexColor("#e2e8f0"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(2.9 * cm, PAGE_HEIGHT * 0.58, "Version")
    c.setFont("Helvetica", 11)
    c.drawString(4.6 * cm, PAGE_HEIGHT * 0.58, datetime.now().strftime("%B %d, %Y"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(2.9 * cm, PAGE_HEIGHT * 0.54, "Prepared for")
    c.setFont("Helvetica", 11)
    c.drawString(5.0 * cm, PAGE_HEIGHT * 0.54, "VemreHR Enterprise")

    if os.path.exists(LOGO_COMPANY):
        c.drawImage(ImageReader(LOGO_COMPANY), 2.4 * cm, 3.0 * cm, width=4.0 * cm, height=4.0 * cm, mask="auto")
    if os.path.exists(LOGO_DEVELOPER):
        c.drawImage(ImageReader(LOGO_DEVELOPER), PAGE_WIDTH - 6.8 * cm, 3.2 * cm, width=4.4 * cm, height=3.6 * cm, mask="auto")

    c.setFillColor(colors.HexColor("#94a3b8"))
    c.setFont("Helvetica", 9)
    c.drawString(2.4 * cm, 2.0 * cm, "Developer and Web App Company Logos")


def generate_pdf():
    c = canvas.Canvas(OUT_PATH, pagesize=A4)
    page = 1

    # Cover
    draw_cover(c)
    draw_footer(c, page)
    c.showPage()
    page += 1

    # Overview
    draw_header(c, "Overview", "What the platform delivers")
    y = PAGE_HEIGHT - 110
    intro = (
        "Vemre HRIS is an enterprise-grade Human Resource Intelligence System that unifies employee data, "
        "performance management, payroll, attendance, onboarding, knowledge, and communication into a single, secure platform. "
        "It is designed for growing organizations that need structured HR workflows, fast reporting, and an excellent employee experience."
    )
    y = draw_wrapped_text(c, intro, 2.2 * cm, y, PAGE_WIDTH - 4.4 * cm, size=11, leading=16)

    y -= 12
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(PRIMARY)
    c.drawString(2.2 * cm, y, "Why it is valuable")
    y -= 18
    bullets = [
        "Centralizes HR data and processes to reduce manual work.",
        "Enables leadership visibility with dashboards and performance analytics.",
        "Automates payroll, attendance, and KPI scoring with audit trails.",
        "Improves employee engagement with self-service, chat, and knowledge tools.",
    ]
    y = draw_bullets(c, bullets, 2.4 * cm, y, PAGE_WIDTH - 4.8 * cm)

    draw_footer(c, page)
    c.showPage()
    page += 1

    # Features
    draw_header(c, "Core Features", "Modules that power Vemre HRIS")
    y = PAGE_HEIGHT - 110
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(PRIMARY)
    c.drawString(2.2 * cm, y, "Feature Highlights")
    y -= 18
    features = [
        "Employee management, profiles, documents, and roles",
        "Performance KPIs, templates, scoring, and summaries",
        "Payroll runs, salary structures, and payslip generation",
        "Attendance tracking with geofencing and late policy logic",
        "Leave requests, approvals, and HR ticketing",
        "Recruitment job postings and applicant workflow",
        "Knowledge base with versioning and search",
        "Onboarding guides and progress tracking",
        "Internal chat with read receipts, replies, and attachments",
        "System notifications for new chat messages (desktop and mobile)"
    ]
    y = draw_bullets(c, features, 2.4 * cm, y, PAGE_WIDTH - 4.8 * cm)

    draw_footer(c, page)
    c.showPage()
    page += 1

    # Technology
    draw_header(c, "Technology", "Stack and architecture")
    y = PAGE_HEIGHT - 110
    stack_text = (
        "Frontend: React + Vite, Tailwind CSS, React Router, Axios\n"
        "Backend: Django 5, Django REST Framework, SimpleJWT\n"
        "Mobile: Capacitor (Android build)\n"
        "Storage: SQLite (local dev), PostgreSQL recommended for production"
    )
    y = draw_wrapped_text(c, stack_text, 2.2 * cm, y, PAGE_WIDTH - 4.4 * cm, size=11, leading=16)

    y -= 10
    c.setFillColor(LIGHT_BG)
    c.rect(2.2 * cm, y - 200, PAGE_WIDTH - 4.4 * cm, 190, fill=1, stroke=0)
    c.setFillColor(PRIMARY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(2.6 * cm, y - 30, "High-level flow")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor("#1f2937"))
    c.drawString(2.6 * cm, y - 50, "1. React frontend calls API endpoints via JWT")
    c.drawString(2.6 * cm, y - 70, "2. Django API enforces permissions and business logic")
    c.drawString(2.6 * cm, y - 90, "3. Data stored in database and files served via media endpoints")
    c.drawString(2.6 * cm, y - 110, "4. Notifications dispatched for chat events")

    draw_footer(c, page)
    c.showPage()
    page += 1

    # Installation (Backend)
    draw_header(c, "Installation - Backend", "Step-by-step setup")
    y = PAGE_HEIGHT - 110
    steps = [
        "Navigate to backend directory.",
        "Create and activate a virtual environment.",
        "Install dependencies from requirements.txt.",
        "Run migrations and create an admin user.",
        "Start the Django development server.",
    ]
    y = draw_bullets(c, steps, 2.4 * cm, y, PAGE_WIDTH - 4.8 * cm)

    y -= 10
    c.setFillColor(LIGHT_BG)
    c.rect(2.2 * cm, y - 160, PAGE_WIDTH - 4.4 * cm, 150, fill=1, stroke=0)
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#0f172a"))
    sample = (
        "cd backend\n"
        "python -m venv .venv\n"
        ".venv\\Scripts\\activate\n"
        "pip install -r requirements.txt\n"
        "python manage.py migrate\n"
        "python create_fresh_admin.py\n"
        "python manage.py runserver 0.0.0.0:8000"
    )
    draw_wrapped_text(c, sample, 2.6 * cm, y - 20, PAGE_WIDTH - 5.2 * cm, font="Helvetica", size=9, leading=12, color=colors.HexColor("#0f172a"))

    draw_footer(c, page)
    c.showPage()
    page += 1

    # Installation (Frontend + Mobile)
    draw_header(c, "Installation - Frontend & Mobile", "Web and Android")
    y = PAGE_HEIGHT - 110
    front_steps = [
        "Navigate to frontend directory.",
        "Install dependencies with npm.",
        "Set VITE_API_URL to your backend API base (e.g., http://localhost:8000/api).",
        "Run the dev server for web.",
    ]
    y = draw_bullets(c, front_steps, 2.4 * cm, y, PAGE_WIDTH - 4.8 * cm)

    y -= 10
    c.setFillColor(LIGHT_BG)
    c.rect(2.2 * cm, y - 140, PAGE_WIDTH - 4.4 * cm, 130, fill=1, stroke=0)
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#0f172a"))
    sample = (
        "cd frontend\n"
        "npm install\n"
        "npm run dev\n"
        "# Android build\n"
        "npm run build\n"
        "npx cap sync android\n"
        "npx cap open android"
    )
    draw_wrapped_text(c, sample, 2.6 * cm, y - 20, PAGE_WIDTH - 5.2 * cm, font="Helvetica", size=9, leading=12, color=colors.HexColor("#0f172a"))

    draw_footer(c, page)
    c.showPage()
    page += 1

    # Usage + screenshots
    draw_header(c, "Usage & Screenshots", "Key touchpoints")
    y = PAGE_HEIGHT - 110
    usage_text = (
        "1. Sign in with admin or staff credentials.\n"
        "2. Use the dashboard to track KPIs, payroll, attendance, and insights.\n"
        "3. Open the chat module to collaborate with colleagues and receive notifications.\n"
        "4. Staff can access self-service pages for profile, leaves, expenses, and documents."
    )
    y = draw_wrapped_text(c, usage_text, 2.2 * cm, y, PAGE_WIDTH - 4.4 * cm, size=10, leading=14)

    y -= 10
    # Screenshot grid
    left_x = 2.2 * cm
    right_x = PAGE_WIDTH / 2 + 0.4 * cm
    box_w = (PAGE_WIDTH - 5.0 * cm) / 2
    box_h = 170

    if os.path.exists(SPLASH_IMAGE):
        c.setFillColor(colors.white)
        c.setStrokeColor(colors.HexColor("#cbd5f5"))
        c.rect(left_x, y - box_h, box_w, box_h, fill=1, stroke=1)
        c.drawImage(ImageReader(SPLASH_IMAGE), left_x + 10, y - box_h + 10, width=box_w - 20, height=box_h - 20, preserveAspectRatio=True, mask="auto")
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(colors.HexColor("#334155"))
        c.drawString(left_x, y + 8, "Splash Screen")
    else:
        draw_screenshot_placeholder(c, left_x, y + 8, box_w, box_h, "Splash Screen")

    draw_screenshot_placeholder(c, right_x, y + 8, box_w, box_h, "Login Screen")

    y -= box_h + 40
    draw_screenshot_placeholder(c, left_x, y + 8, box_w, box_h, "Careers Page")
    draw_screenshot_placeholder(c, right_x, y + 8, box_w, box_h, "Chat Module")

    draw_footer(c, page)
    c.showPage()
    page += 1

    # Notifications
    draw_header(c, "Chat Notifications", "System alerts for new messages")
    y = PAGE_HEIGHT - 110
    notif_text = (
        "Vemre HRIS now triggers system notifications when a new chat message arrives. "
        "On desktop web, the browser Notification API is used. On Android builds, Capacitor "
        "Local Notifications surface native alerts."
    )
    y = draw_wrapped_text(c, notif_text, 2.2 * cm, y, PAGE_WIDTH - 4.4 * cm, size=11, leading=16)

    y -= 8
    bullets = [
        "Users are prompted once for permission.",
        "Notifications appear when the app is not in focus.",
        "Unread counts are monitored for new inbound messages.",
        "Pluggable for future push delivery (FCM) when app is closed."
    ]
    y = draw_bullets(c, bullets, 2.4 * cm, y, PAGE_WIDTH - 4.8 * cm)

    draw_footer(c, page)
    c.showPage()
    page += 1

    # Troubleshooting & improvements
    draw_header(c, "Troubleshooting & Roadmap", "Keep the platform running smoothly")
    y = PAGE_HEIGHT - 110
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(PRIMARY)
    c.drawString(2.2 * cm, y, "Login network error")
    y -= 16
    y = draw_wrapped_text(
        c,
        "Ensure VITE_API_URL points to the backend API base (example: http://localhost:8000/api). "
        "The backend must be reachable on the same network and port.",
        2.2 * cm,
        y,
        PAGE_WIDTH - 4.4 * cm,
        size=10,
        leading=14,
        color=colors.HexColor("#1f2937"),
    )

    y -= 10
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(PRIMARY)
    c.drawString(2.2 * cm, y, "Recommended improvements")
    y -= 16
    improvements = [
        "Add real-time messaging via WebSockets for instant chat updates.",
        "Enable true push notifications with Firebase Cloud Messaging.",
        "Introduce role-based dashboards with configurable widgets.",
        "Switch to PostgreSQL for production scalability.",
        "Add audit logging exports and SOC-ready reporting."
    ]
    draw_bullets(c, improvements, 2.4 * cm, y, PAGE_WIDTH - 4.8 * cm)

    draw_footer(c, page)
    c.save()


if __name__ == "__main__":
    generate_pdf()
