import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User

user = User.objects.filter(username='admin').first()
if not user:
    user = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("Created superuser 'admin'")
else:
    user.set_password('admin123')
    user.is_active = True
    user.save()
    print("Reset password for 'admin' to 'admin123'")
