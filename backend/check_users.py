import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User

users = User.objects.all()
with open('users_debug.txt', 'w') as f:
    f.write(f"Total Users: {users.count()}\n")
    for user in users:
        f.write(f"Username: {user.username}, Role: {user.role}, Is Active: {user.is_active}\n")
