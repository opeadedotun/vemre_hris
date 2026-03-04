import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Employee

def list_users():
    with open('user_dump.txt', 'w') as f:
        for u in User.objects.all():
            emp = Employee.objects.filter(email=u.email).first()
            f.write(f"User: {u.username}, Email: {u.email}, Role: {u.role}\n")
            if emp:
                f.write(f"  Employee: {emp.first_name}, Role: {emp.job_role.name if emp.job_role else 'NONE'}\n")
            else:
                f.write(f"  No Employee record.\n")

if __name__ == "__main__":
    list_users()
