import os
import django
import sys

# Set up Django environment
print("Setting up Django...")
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
try:
    django.setup()
    print("Django setup successful")
except Exception as e:
    print(f"Django setup failed: {e}")
    sys.exit(1)

from api.models import Employee, Department
from api.serializers import EmployeeSerializer
from rest_framework import serializers

def test_create_employee():
    # Ensure at least one department exists
    dept, _ = Department.objects.get_or_create(name="Test Dept")
    
    data = {
        "full_name": "Test Employee",
        "email": "test@example.com",
        "department": dept.id,
        "job_title": "Software Engineer",
        "is_active": True
    }
    
    serializer = EmployeeSerializer(data=data)
    if serializer.is_valid():
        print("Serializer is valid")
        try:
            employee = serializer.save()
            print(f"Employee created: {employee.full_name} with code {employee.employee_code}")
        except Exception as e:
            print(f"Error during save: {e}")
    else:
        print(f"Serializer errors: {serializer.errors}")

if __name__ == "__main__":
    test_create_employee()
