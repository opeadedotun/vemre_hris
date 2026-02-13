import os
import django
import sys
from datetime import time

# Set up Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Department, Employee, JobRole, KPITemplate, KPITemplateItem, SalaryStructure
from django.utils import timezone

def seed():
    with open('seed_report.txt', 'w') as f:
        f.write("Seeding database with updated Shifts and KPI Framework...\n")
        try:
            # 1. Departments
            dept_names = ["Human Resources", "Operations", "Marketing", "Accounting", "Customer Service"]
            depts = {}
            for name in dept_names:
                dept, _ = Department.objects.get_or_create(name=name)
                depts[name] = dept
            f.write(f"Created {len(depts)} departments.\n")
            
            # 2. Users (Roles)
            if not User.objects.filter(username="hr_admin").exists():
                User.objects.create_superuser("hr_admin", "admin@vemre.com", "admin123", role="ADMIN")
            
            if not User.objects.filter(username="hr_manager_user").exists():
                User.objects.create_user("hr_manager_user", "hr@vemre.com", "hr123", role="HR")
            f.write("Users seeded.\n")

            # 3. Job Roles & Salaries
            roles_data = [
                {"name": "Human Resources Manager", "dept": depts["Human Resources"], "start": "09:00", "end": "18:00", "days": "MON_FRI", "salary": 250000},
                {"name": "Branding/Marketing Manager", "dept": depts["Marketing"], "start": "08:00", "end": "17:00", "days": "MON_FRI", "salary": 200000},
                {"name": "Field Agent", "dept": depts["Operations"], "start": "08:00", "end": "17:00", "days": "MON_FRI", "salary": 80000},
                {"name": "Accountant", "dept": depts["Accounting"], "start": "08:00", "end": "17:00", "days": "MON_FRI", "salary": 180000},
                {"name": "Receptionist/Customer Service", "dept": depts["Customer Service"], "start": "08:00", "end": "20:00", "days": "SHIFT_4_4", "salary": 100000},
                {"name": "Cleaner", "dept": depts["Operations"], "start": "08:00", "end": "17:00", "days": "MON_FRI", "salary": 50000},
                {"name": "Dispatch Rider", "dept": depts["Operations"], "start": "08:00", "end": "21:00", "days": "DAILY", "salary": 70000},
            ]
            
            roles = {}
            for role_info in roles_data:
                start_h, start_m = map(int, role_info["start"].split(":"))
                end_h, end_m = map(int, role_info["end"].split(":"))
                
                # Check for and resolve duplicates
                existing_roles = JobRole.objects.filter(name=role_info["name"])
                if existing_roles.count() > 1:
                    first_role = existing_roles.first()
                    existing_roles.exclude(id=first_role.id).delete()

                role, _ = JobRole.objects.update_or_create(
                    name=role_info["name"],
                    defaults={
                        "department": role_info["dept"],
                        "shift_start": time(start_h, start_m),
                        "shift_end": time(end_h, end_m),
                        "work_days_type": role_info["days"]
                    }
                )
                roles[role_info["name"]] = role
                
                # Check for and resolve SalaryStructure duplicates
                existing_salaries = SalaryStructure.objects.filter(job_role=role)
                if existing_salaries.count() > 1:
                    first_sal = existing_salaries.first()
                    existing_salaries.exclude(id=first_sal.id).delete()

                # Create empty Salary Structure (no pre-populated values)
                SalaryStructure.objects.update_or_create(
                    job_role=role,
                    defaults={
                        "basic_salary": 0,
                        "housing_allowance": 0,
                        "transport_allowance": 0,
                        "other_allowances": 0,
                    }
                )
            f.write(f"Created {len(roles)} job roles with shifts (salaries not pre-populated).\n")

            # 4. KPI Framework Data
            kpi_framework = {
                "Human Resources Manager": [
                    ("Hr operations & record management", 25),
                    ("Recruitment & onboarding efficiency", 20),
                    ("It & operational support response", 20),
                    ("Process improvement & initiative", 15),
                    ("Communication & professional conduct", 10),
                    ("Attendance, time management & compliance", 10)
                ],
                "Branding/Marketing Manager": [
                    ("Social media & brand growth", 25),
                    ("Marketing campaign execution", 20),
                    ("Customer engagement & brand representation", 15),
                    ("Grant & promotional funding support", 15),
                    ("Market research & initiative", 15),
                    ("Attendance, time management & compliance", 10)
                ],
                "Field Agent": [
                    ("Vendor acquisition & onboarding performance", 30),
                    ("Field operations & market coverage", 20),
                    ("Vendor relationship & retention", 15),
                    ("Reporting & data accuracy", 15),
                    ("Communication & professional conduct", 10),
                    ("Attendance, time management & compliance", 10)
                ],
                "Accountant": [
                    ("Financial record accuracy & reporting", 30),
                    ("Payroll & statutory compliance", 20),
                    ("Budgeting & cost control", 15),
                    ("Financial process improvement", 15),
                    ("Communication & professional conduct", 10),
                    ("Attendance, time management & compliance", 10)
                ],
                "Receptionist/Customer Service": [
                    ("Customer service delivery & front desk management", 30),
                    ("Communication & customer support response", 20),
                    ("Record keeping & administrative support", 15),
                    ("Process improvement & initiative", 15),
                    ("Professional conduct & company representation", 10),
                    ("Attendance, time management & compliance", 10)
                ],
                "Cleaner": [
                    ("Cleanliness & hygiene maintenance", 35),
                    ("Task completion & work quality", 20),
                    ("Health, safety & equipment handling", 15),
                    ("Initiative & process improvement", 10),
                    ("Professional conduct & teamwork", 10),
                    ("Attendance, time management & compliance", 10)
                ]
            }

            for role_name, kpis in kpi_framework.items():
                if role_name not in roles: continue
                role = roles[role_name]
                
                # Check for and resolve KPITemplate duplicates
                existing_temps = KPITemplate.objects.filter(job_role=role)
                if existing_temps.count() > 1:
                    first_temp = existing_temps.first()
                    existing_temps.exclude(id=first_temp.id).delete()

                template, _ = KPITemplate.objects.update_or_create(
                    job_role=role,
                    defaults={"name": f"{role_name} Template"}
                )
                
                # Clear existing items to avoid duplicates if weights changed
                template.items.all().delete()
                
                for kpi_name, weight in kpis:
                    KPITemplateItem.objects.create(
                        template=template,
                        kpi_name=kpi_name,
                        weight_points=weight
                    )
            f.write("KPI Templates seeded with current models.\n")
            f.write("SEEDING COMPLETED SUCCESSFULLY\n")
            
        except Exception as e:
            f.write(f"CRITICAL SEEDING ERROR: {str(e)}\n")
            import traceback
            f.write(traceback.format_exc())

if __name__ == "__main__":
    seed()
