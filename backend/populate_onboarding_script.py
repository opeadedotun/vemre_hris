import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.join(os.getcwd()))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import OnboardingGuide, JobRole

def populate_onboarding():
    guides = [
        {
            'role': 'ADMIN',
            'title': 'System Administrator Onboarding',
            'content': """Welcome to the VEMRE HRIS Admin team. Your role involves managing system configurations, users, and security.
- Familiarize yourself with the 'Audit Logs' section.
- Review 'System Settings' for branch and department configurations.
- Understand the backup and restoration procedures.""",
            'checklist': ["Secure superadmin credentials", "Review audit logs", "Configure branch permissions"]
        },
        {
            'role': 'HR',
            'title': 'HR Officer Onboarding',
            'content': """Welcome to HR! You will be managing the employee lifecycle.
- Explore the 'Employees' module to manage profiles.
- Learn how to process attendance uploads.
- Review the performance management (KPI) system.""",
            'checklist': ["Employee data entry training", "Attendance upload walkthrough", "KPI template setup"]
        },
        {
            'role': 'MANAGER',
            'title': 'Department Manager Onboarding',
            'content': """As a Manager, your focus is on team performance and approvals.
- Review leave requests and expense claims for your department.
- Monitor employee attendance summaries.
- Provide feedback through the appraisal system.""",
            'checklist': ["Approval workflow training", "Department performance dashboard", "One-on-one meeting schedule"]
        },
        {
            'role': 'ACCOUNTANT',
            'title': 'Payroll & Finance Onboarding',
            'content': """Welcome to the Finance team. You are responsible for payroll accuracy.
- Master the 'Payroll' module for monthly runs.
- Review statutory deductions (Tax, Pension, NHF).
- Manage approved expense repayments.""",
            'checklist': ["Payroll processing cycle", "Statutory tax compliance review", "Expense reimbursement flow"]
        },
        {
            'role': 'STAFF',
            'title': 'Employee General Onboarding',
            'content': """Welcome to the company! We are glad to have you.
- Complete your profile information.
- Learn how to request leave through the portal.
- Use the 'Knowledge Base' for company policies.""",
            'checklist': ["Complete profile", "Read company handbook", "Set up chat profile"]
        }
    ]

    for item in guides:
        role = JobRole.objects.filter(name=item['role']).first()
        if role:
            OnboardingGuide.objects.update_or_create(
                job_role=role,
                defaults={
                    'title': item['title'],
                    'content': item['content'],
                    'checklist_json': item['checklist']
                }
            )
            print(f"Populated onboarding for {item['role']}")
        else:
            print(f"Role {item['role']} not found, skipping.")

if __name__ == "__main__":
    populate_onboarding()
