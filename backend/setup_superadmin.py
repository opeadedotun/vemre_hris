import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User

def setup_superadmin():
    username = 'superadmin'
    email = 'admin@vemrehr.com'
    password = 'SuperAdminPassword2026!' # Should be changed by user later

    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': email,
            'role': User.ADMIN,
            'is_staff': True,
            'is_superuser': True
        }
    )

    if created:
        user.set_password(password)
        user.save()
        print(f"Superadmin created successfully. Username: {username}, Password: {password}")
    else:
        print(f"Superadmin already exists.")

if __name__ == "__main__":
    setup_superadmin()
