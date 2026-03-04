import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Employee, Department, JobRole, OnboardingGuide, Branch, ExpenseCategory

def seed_all():
    print("Starting Comprehensive Seed...")
    
    # 1. Departments
    dept, _ = Department.objects.get_or_create(name="Administrative")
    print(f"Dept: {dept.name}")
    
    # 2. Job Roles
    role, _ = JobRole.objects.get_or_create(
        name="Administrator",
        defaults={'department': dept}
    )
    print(f"Role: {role.name}")
    
    # 3. Onboarding Guide
    guide_json = [
        {"task": "Complete personal profile", "description": "Ensure your phone number and address are correct."},
        {"task": "Upload ID documentation", "description": "Passport or Driver's license."},
        {"task": "Review company handbook", "description": "Download from Knowledge Base."},
        {"task": "Setup your workstation", "description": "Request hardware from IT."}
    ]
    guide, created = OnboardingGuide.objects.get_or_create(
        job_role=role,
        defaults={
            'title': 'Administrator Onboarding',
            'checklist_json': guide_json
        }
    )
    if not created:
        guide.checklist_json = guide_json
        guide.save()
    print(f"Guide: {guide.title}")
    
    # 4. Branch
    branch, _ = Branch.objects.get_or_create(
        name="Main Office",
        defaults={
            'location': 'Headquarters',
            'latitude': 6.5244,
            'longitude': 3.3792,
            'radius': 500
        }
    )
    print(f"Branch: {branch.name}")
    
    # 5. Expense Categories
    cats = ["Office Maintenance", "Refreshment", "Repair & Services", "Fuel", "Stationery", "Transport"]
    for cname in cats:
        ExpenseCategory.objects.get_or_create(name=cname)
    print("Expense Categories Seeded.")
    
    # 6. Assign role to Opeyemi and Superadmin
    users = User.objects.all()
    for user in users:
        emp, created = Employee.objects.get_or_create(
            email=user.email,
            defaults={
                'user': user,
                'first_name': user.username,
                'last_name': 'Admin',
                'job_role': role,
                'job_title': 'System Administrator'
            }
        )
        if not created:
            emp.job_role = role
            emp.job_title = 'System Administrator'
            emp.save()
        print(f"Employee linked: {emp.first_name} ({emp.email}) -> {role.name}")

    print("Seed Completed Successfully.")

if __name__ == "__main__":
    seed_all()
