import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import LeaveType

def populate_leave_types():
    leave_types = [
        {"name": "Annual Leave", "days_per_year": 20, "is_paid": True},
        {"name": "Sick Leave", "days_per_year": 12, "is_paid": True},
        {"name": "Maternity Leave", "days_per_year": 90, "is_paid": True},
    ]

    for lt in leave_types:
        LeaveType.objects.get_or_create(name=lt["name"], defaults={
            "days_per_year": lt["days_per_year"],
            "is_paid": lt["is_paid"]
        })
    print("Leave types populated.")

if __name__ == "__main__":
    populate_leave_types()
