from .models import EmployeeKPI, KPITemplate, KPITemplateItem
from decimal import Decimal

def assign_role_kpis(employee, month):
    """
    Automatically creates EmployeeKPI records for a given employee and month
    based on their JobRole's active KPI template.
    """
    if not employee.job_role:
        return 0
    
    template = KPITemplate.objects.filter(job_role=employee.job_role, is_active=True).first()
    if not template:
        return 0
        
    items = KPITemplateItem.objects.filter(template=template)
    created_count = 0
    
    for item in items:
        # Check if KPI already exists for this employee, month, and template item
        exists = EmployeeKPI.objects.filter(
            employee=employee,
            month=month,
            template_item=item
        ).exists()
        
        if not exists:
            EmployeeKPI.objects.create(
                employee=employee,
                template_item=item,
                month=month,
                target_points=100.00,
                actual_points=0.00
            )
            created_count += 1
            
    return created_count

def calculate_lateness_penalty(late_minutes, hourly_rate):
    """
    Rules:
    - 5 mins or less: 0
    - > 5 to 30 mins: 0.5 hour salary
    - > 30 to 60 mins: 1 hour salary
    - > 60 mins: Pro-rated hourly (ceil to next hour)
    """
    if late_minutes <= 5:
        return Decimal('0.00')
    
    if late_minutes <= 30:
        return hourly_rate / Decimal('2.0')
    
    if late_minutes <= 60:
        return hourly_rate
    
    # Over 1 hour: Round up to the nearest hour
    import math
    hours = math.ceil(late_minutes / 60.0)
    return Decimal(str(hours)) * hourly_rate

