import os
import django
from django.contrib.auth import authenticate

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User

def create_fresh_admin():
    username = 'vemre_admin'
    password = 'Password123!'
    
    # Delete existing if any
    User.objects.filter(username=username).delete()
    
    # Create new superuser
    user = User.objects.create_superuser(
        username=username,
        email='admin@vemrehr.com',
        password=password
    )
    user.role = 'ADMIN'
    user.save()
    
    print(f"CREATED USER: {username}")
    
    # Test internal login
    check = authenticate(username=username, password=password)
    if check:
        print("INTERNAL AUTH TEST: PASSED")
    else:
        print("INTERNAL AUTH TEST: FAILED")

if __name__ == "__main__":
    create_fresh_admin()
