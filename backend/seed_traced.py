import os
import django
import sys

with open('seed_trace.txt', 'w') as f:
    f.write("Starting script...\n")
    try:
        f.write(f"Python path: {sys.executable}\n")
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
        f.write("Setting up django...\n")
        django.setup()
        f.write("Django setup successful.\n")
        
        from api.models import User, Employee, JobRole, OnboardingGuide
        f.write("Imports successful.\n")
        
        # Simple test
        count = User.objects.count()
        f.write(f"User count: {count}\n")
        
        # Actual fix for Onboarding
        from api.models import Department
        dept, _ = Department.objects.get_or_create(name="Administrative")
        role, _ = JobRole.objects.get_or_create(name="Administrator", defaults={'department': dept})
        guide_json = [{"task": "Complete personal profile", "description": "Ensure your phone number and address are correct."}]
        guide, _ = OnboardingGuide.objects.get_or_create(job_role=role, defaults={'title': 'Admin Guide', 'checklist_json': guide_json})
        
        for u in User.objects.all():
            emp, _ = Employee.objects.get_or_create(email=u.email, defaults={'user': u, 'first_name': u.username, 'job_role': role})
            emp.job_role = role
            emp.save()
            f.write(f"Updated {u.username}\n")
            
        f.write("Done.\n")
    except Exception as e:
        f.write(f"ERROR: {str(e)}\n")
        import traceback
        f.write(traceback.format_exc())
