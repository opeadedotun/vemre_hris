import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

User = get_user_model()
output_file = r'c:\Users\USER\Documents\Projects\vemrehr\backend\users_final_list.txt'

def list_users():
    users = User.objects.all()
    with open(output_file, 'w') as f:
        f.write("System Users:\n")
        for u in users:
            f.write(f"  - ID: {u.id}, Username: {u.username}, Role: {u.role}, IsSuperuser: {u.is_superuser}, IsStaff: {u.is_staff}\n")

if __name__ == "__main__":
    list_users()
