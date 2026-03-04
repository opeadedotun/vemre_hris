import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Employee, JobRole, OnboardingGuide

def verify():
    with open('verify_seed.txt', 'w') as f:
        f.write(f"Users: {User.objects.count()}\n")
        f.write(f"Employees: {Employee.objects.count()}\n")
        f.write(f"JobRoles: {JobRole.objects.count()}\n")
        f.write(f"Guides: {OnboardingGuide.objects.count()}\n")
        
        for emp in Employee.objects.all():
            f.write(f"Emp: {emp.email}, Role: {emp.job_role.name if emp.job_role else 'None'}\n")
            if emp.job_role:
                guide = OnboardingGuide.objects.filter(job_role=emp.job_role).first()
                f.write(f"  Guide for this role: {guide.title if guide else 'NONE'}\n")

if __name__ == "__main__":
    verify()
