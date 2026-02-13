import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Employee, JobRole, KPITemplate, KPITemplateItem, EmployeeKPI, PerformanceSummary
from api.utils import assign_role_kpis
from django.utils import timezone

def run_checks():
    with open('final_report.txt', 'w') as f:
        f.write("=== HRIS Framework Verification Report ===\n\n")
        try:
            # 1. Check Job Roles and Templates
            roles = JobRole.objects.all()
            f.write(f"Total Job Roles: {roles.count()}\n")
            for role in roles:
                template = KPITemplate.objects.filter(job_role=role, is_active=True).first()
                if template:
                    items = KPITemplateItem.objects.filter(template=template)
                    total_weight = sum([i.weight for i in items])
                    f.write(f"- {role.name}: Template '{template.name}' ({items.count()} items), Total Weight: {total_weight}%\n")
                else:
                    f.write(f"- {role.name}: NO ACTIVE TEMPLATE\n")
                
            f.write("\n")
            
            # 2. Check Employees and KPI Assignment
            employees = Employee.objects.all()
            f.write(f"Total Employees: {employees.count()}\n")
            month = timezone.now().strftime('%Y-%m')
            
            for emp in employees:
                f.write(f"Processing {emp.full_name} ({emp.employee_code})...\n")
                if emp.job_role:
                    count = assign_role_kpis(emp, month)
                    f.write(f"  Role: {emp.job_role.name}\n")
                    f.write(f"  KPIs assigned for {month}: {count}\n")
                    
                    kpis = EmployeeKPI.objects.filter(employee=emp, month=month)
                    total_w = sum([k.weight for k in kpis])
                    f.write(f"  Actual KPIs in DB: {kpis.count()}, Combined Weight: {total_w}%\n")
                    
                    if total_w != 100 and kpis.count() > 0:
                         f.write(f"  ERROR: Total weight for {emp.full_name} is {total_w}%, expected 100%\n")
                else:
                    f.write("  WARNING: No job role assigned!\n")
            
            f.write("\n=== VERIFICATION END ===\n")
        except Exception as e:
            f.write(f"VERIFICATION CRITICAL ERROR: {str(e)}\n")
            import traceback
            f.write(traceback.format_exc())

if __name__ == "__main__":
    run_checks()
