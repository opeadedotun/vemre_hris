import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Employee, OnboardingGuide

def check_opeyemi():
    try:
        user = User.objects.get(username='opeyemi')
        print(f"User: {user.username}, Role: {user.role}, IsSuperuser: {user.is_superuser}")
        
        try:
            emp = Employee.objects.get(email=user.email)
            print(f"Employee: {emp.full_name}, Job Role: {emp.job_role}, Job Title: {emp.job_title}")
            
            if emp.job_role:
                guide = OnboardingGuide.objects.filter(job_role=emp.job_role).first()
                if guide:
                    print(f"Guide found for role {emp.job_role}: {guide.id}")
                else:
                    print(f"No guide found for role {emp.job_role}")
            else:
                print("No job role assigned to employee.")
                
        except Employee.DoesNotExist:
            print(f"No employee record found for email {user.email}")
            
    except User.DoesNotExist:
        print("User 'opeyemi' not found.")

if __name__ == "__main__":
    check_opeyemi()
