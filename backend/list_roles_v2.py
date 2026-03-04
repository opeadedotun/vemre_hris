import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import JobRole, OnboardingGuide

def list_roles_and_guides():
    roles = JobRole.objects.all()
    print("Job Roles:")
    for r in roles:
        guide = OnboardingGuide.objects.filter(job_role=r).first()
        print(f"  - ID: {r.id}, Name: {r.name}, Dept: {r.department.name if r.department else 'N/A'}, Guide: {guide.id if guide else 'None'}")

if __name__ == "__main__":
    list_roles_and_guides()
