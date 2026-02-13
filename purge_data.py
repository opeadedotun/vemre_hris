import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Employee, EmployeeKPI, PerformanceSummary, Appraisal, AuditLog, Department

def purge():
    print("Purging data...")
    
    # Delete Employee-related data first due to FKs
    print(f"Deleting {Appraisal.objects.count()} Appraisals...")
    Appraisal.objects.all().delete()
    
    print(f"Deleting {PerformanceSummary.objects.count()} PerformanceSummaries...")
    PerformanceSummary.objects.all().delete()
    
    print(f"Deleting {EmployeeKPI.objects.count()} EmployeeKPIs...")
    EmployeeKPI.objects.all().delete()
    
    print(f"Deleting {Employee.objects.count()} Employees...")
    Employee.objects.all().delete()
    
    print(f"Deleting {Department.objects.count()} Departments...")
    Department.objects.all().delete()
    
    print(f"Deleting {AuditLog.objects.count()} AuditLogs...")
    AuditLog.objects.all().delete()
    
    # We should keep the admin users, but maybe remove non-admin users if any
    print(f"Deleting non-admin users...")
    User.objects.filter(is_superuser=False, role='MANAGER').delete()
    
    print("Data purge complete.")

if __name__ == "__main__":
    purge()
