import os
import django
from django.contrib.auth import authenticate

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User

def debug_login():
    with open('login_debug_final.txt', 'w') as f:
        f.write("--- USER AUDIT ---\n")
        admins = User.objects.filter(role='ADMIN')
        f.write(f"Found {admins.count()} ADMIN users.\n")
        for a in admins:
            f.write(f"Username: {a.username}, Email: {a.email}, Active: {a.is_active}, Staff: {a.is_staff}, IsSuper: {a.is_superuser}\n")
        
        # Ensure 'admin' exists and has correct props
        u, created = User.objects.get_or_create(username='admin', defaults={'email': 'admin@vemre.com', 'role': 'ADMIN', 'is_staff': True, 'is_superuser': True})
        if created:
            f.write("Created missing 'admin' user.\n")
        
        u.set_password('admin123')
        u.role = 'ADMIN'
        u.is_active = True
        u.is_staff = True
        u.is_superuser = True
        u.save()
        f.write("Updated 'admin' user with password 'admin123' and full permissions.\n")
        
        # Test Authenticate
        user = authenticate(username='admin', password='admin123')
        if user:
            f.write("AUTHENTICATION SUCCESS: 'admin' / 'admin123' works in backend shell.\n")
        else:
            f.write("AUTHENTICATION FAILED: 'admin' / 'admin123' does NOT work in backend shell.\n")

if __name__ == "__main__":
    debug_login()
