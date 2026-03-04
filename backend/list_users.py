import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

User = get_user_model()

def list_users():
    users = User.objects.all()
    print("System Users:")
    for u in users:
        print(f"  - ID: {u.id}, Username: {u.username}, Role: {u.role}, IsSuperuser: {u.is_superuser}, IsStaff: {u.is_staff}")

if __name__ == "__main__":
    list_users()
