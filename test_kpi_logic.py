import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Employee, EmployeeKPI, JobRole, RoleKPITemplate, PerformanceSummary
from api.utils import assign_role_kpis
from django.utils import timezone

def test_kpi_logic():
    with open('verification_report.txt', 'w') as f:
        f.write("Testing KPI Assignment Logic...\n")
        
        month = timezone.now().strftime('%Y-%m')
        
        # Get an employee (e.g., HR Manager)
        try:
            hr_lead = Employee.objects.get(employee_code='VAE-002')
            f.write(f"Found employee: {hr_lead.full_name}, Role: {hr_lead.job_role}\n")
            
            # Assign KPIs
            created_count = assign_role_kpis(hr_lead, month)
            f.write(f"Created {created_count} KPI records for {month}\n")
            
            # Verify
            kpis = EmployeeKPI.objects.filter(employee=hr_lead, month=month)
            total_weight = sum([kpi.weight for kpi in kpis])
            f.write(f"Total KPIs for {month}: {kpis.count()}\n")
            f.write(f"Total Weight: {total_weight}%\n")
            
            if total_weight == 100:
                f.write("SUCCESS: Total weight is 100%\n")
            else:
                f.write(f"FAILURE: Total weight is {total_weight}%\n")
                
            # Test performance summary update
            if kpis.exists():
                kpi = kpis.first()
                kpi.actual_value = kpi.target_value # Score 100% for this KPI
                kpi.save()
                
                summary = PerformanceSummary.objects.get(employee=hr_lead, month=month)
                f.write(f"Performance Summary Total Score: {summary.total_score}\n")
                f.write(f"Performance Rating: {summary.performance_rating}\n")
                f.write(f"Remarks: {summary.remarks}\n")
            
            f.write("VERIFICATION COMPLETED SUCCESSFULLY\n")
                
        except Exception as e:
            f.write(f"ERROR: {str(e)}\n")

if __name__ == "__main__":
    test_kpi_logic()
