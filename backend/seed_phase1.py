import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Department, JobRole

def seed():
    depts = [
        ('Marketing', 'Marketing and Sales'),
        ('HR', 'Human Resources'),
        ('Operations', 'Business Operations'),
        ('Finance', 'Financial Management'),
        ('Administration', 'Admin and Front Desk'),
    ]
    
    dept_objs = {}
    for name, desc in depts:
        obj, created = Department.objects.get_or_create(name=name, defaults={'description': desc})
        dept_objs[name] = obj
        if created:
            print(f"Created department: {name}")

    roles = [
        ('Marketing Specialist', dept_objs['Marketing']),
        ('HR Officer', dept_objs['HR']),
        ('Operations Manager', dept_objs['Operations']),
        ('Accountant', dept_objs['Finance']),
        ('Field Agent', dept_objs['Operations']),
        ('Receptionist', dept_objs['Administration']),
        ('Cleaner', dept_objs['Administration']),
    ]

    for name, dept in roles:
        obj, created = JobRole.objects.get_or_create(name=name, department=dept)
        if created:
            print(f"Created job role: {name} in {dept.name}")

if __name__ == '__main__':
    seed()
