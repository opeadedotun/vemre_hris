import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Employee, Department
from api.serializers import EmployeeSerializer

def verify():
    print("Verifying Employee creation...")
    dept, _ = Department.objects.get_or_create(name="HR")
    
    data = {
        "full_name": "Verified Employee",
        "email": "verified@vemre.com",
        "department": dept.id,
        "job_title": "HR Specialist",
        "is_active": True
    }
    
    serializer = EmployeeSerializer(data=data)
    if serializer.is_valid():
        employee = serializer.save()
        print(f"SUCCESS: Employee created: {employee.full_name} ({employee.employee_code})")
        # Check if is_active is True
        if employee.is_active:
            print("SUCCESS: is_active field is working.")
        else:
            print("FAILURE: is_active field is False.")
    else:
        print(f"FAILURE: Serializer errors: {serializer.errors}")

if __name__ == "__main__":
    try:
        verify()
    except Exception as e:
        print(f"ERROR: {e}")
