import os
import django
import sys

with open('seed_trace_final.txt', 'w') as f:
    f.write("Starting final seed...\n")
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
        django.setup()
        
        from api.models import User, Employee, JobRole, OnboardingGuide, Department, Branch, ExpenseCategory
        f.write("Imports successful.\n")
        
        # 1. Dept & Role
        dept, _ = Department.objects.get_or_create(name="Administrative")
        role, _ = JobRole.objects.get_or_create(name="Administrator", defaults={'department': dept})
        f.write(f"Role: {role.name}\n")
        
        # 2. Guide
        guide_json = [
            "Complete personal profile",
            "Upload ID documentation",
            "Review company handbook",
            "Setup your workstation"
        ]
        guide, created = OnboardingGuide.objects.get_or_create(
            job_role=role,
            defaults={
                'title': 'System Administrator Onboarding',
                'checklist_json': guide_json
            }
        )
        if not created:
            guide.checklist_json = guide_json
            guide.save()
        f.write(f"Guide: {guide.title}\n")
        
        # 3. Branch
        branch, _ = Branch.objects.get_or_create(
            name="Main Office",
            defaults={
                'location': 'Headquarters',
                'latitude': 6.5244,
                'longitude': 3.3792,
                'radius': 500
            }
        )
        f.write(f"Branch: {branch.name}\n")
        
        # 4. Expense Categories
        cats = ["Office Maintenance", "Refreshment", "Repair & Services", "Fuel", "Stationery", "Transport"]
        for cname in cats:
            ExpenseCategory.objects.get_or_create(name=cname)
        f.write("Expense Categories Seeded.\n")
        
        # 5. Employees
        for u in User.objects.all():
            emp, created = Employee.objects.get_or_create(
                email=u.email,
                defaults={
                    'full_name': u.username,
                    'department': dept,
                    'job_role': role,
                    'job_title': 'System Administrator'
                }
            )
            if not created:
                emp.job_role = role
                emp.job_title = 'System Administrator'
                emp.save()
            f.write(f"Updated/Created Employee for {u.username}: {emp.email}\n")
            
        f.write("Final Seed SUCCESS.\n")
    except Exception as e:
        f.write(f"ERROR: {str(e)}\n")
        import traceback
        f.write(traceback.format_exc())
