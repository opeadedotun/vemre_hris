import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Branch, JobRole, KPITemplate, KPITemplateItem, Department

def seed_branches():
    # Strictly enforce only these 4 branches
    requested_branches = [
        {'name': 'Head Office', 'location': 'Taiwo Road, Ilorin (Headquarters)'},
        {'name': 'Ipata Market Branch', 'location': 'Ipata, Ilorin'},
        {'name': 'Ogbomosho Branch', 'location': 'Ogbomosho, Oyo'},
        {'name': 'Osogbo Branch', 'location': 'Osogbo, Osun'},
    ]

    # Clear all existing branches to avoid "Appearing twice" or stale data
    print("Clearing existing branches...")
    Branch.objects.all().delete()

    for b_data in requested_branches:
        branch = Branch.objects.create(
            name=b_data['name'],
            location=b_data['location']
        )
        print(f"Created branch: {branch.name}")

def seed_dispatch_rider_kpi():
    # Ensure Dispatch Rider job role exists
    # First, ensure an 'Operations' department exists if not found
    dept, _ = Department.objects.get_or_create(name='Operations')
    
    role, created = JobRole.objects.get_or_create(
        name='Dispatch Rider',
        department=dept,
        defaults={'description': 'Handles deliveries and pickups'}
    )
    
    template, created = KPITemplate.objects.get_or_create(
        job_role=role,
        name='Dispatch Rider KPI Template',
        defaults={'total_points': 100}
    )
    
    items = [
        ('DELIVERY PERFORMANCE & TURNAROUND TIME', 30),
        ('DELIVERY ACCURACY & CUSTOMER SATISFACTION', 20),
        ('SAFETY, RIDING CONDUCT & ASSET CARE', 15),
        ('DOCUMENTATION & REPORTING', 15),
        ('PROFESSIONAL CONDUCT & CUSTOMER REPRESENTATION', 10),
        ('ATTENDANCE, TIME MANAGEMENT & COMPLIANCE', 10),
    ]
    
    # Clear existing items to avoid duplicates if re-running
    KPITemplateItem.objects.filter(template=template).delete()
    
    for name, points in items:
        KPITemplateItem.objects.create(
            template=template,
            kpi_name=name,
            weight_points=points
        )
    print(f"Created/Updated KPI Template for Dispatch Rider")

if __name__ == "__main__":
    seed_branches()
    seed_dispatch_rider_kpi()
