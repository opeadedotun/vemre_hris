import os
import django
import sys
from django.contrib.auth import authenticate

# Set up Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User

def test():
    username = 'admin'
    password = 'admin123'
    
    with open('login_debug.txt', 'w') as f:
        f.write("Checking user 'admin'...\n")
        user = User.objects.filter(username=username).first()
        if not user:
            f.write("ERROR: User 'admin' does not exist in the database.\n")
            # Create it
            User.objects.create_superuser(username, 'admin@vemre.com', password, role='ADMIN')
            f.write("New admin user created.\n")
            user = User.objects.get(username=username)
        
        f.write(f"User found: {user.username}\n")
        f.write(f"Is active: {user.is_active}\n")
        f.write(f"Is staff: {user.is_staff}\n")
        f.write(f"Role: {user.role}\n")
        
        # Test authentication
        auth_user = authenticate(username=username, password=password)
        if auth_user:
            f.write("AUTHENTICATION SUCCESSFUL\n")
        else:
            f.write("AUTHENTICATION FAILED\n")
            # Try setting password again
            user.set_password(password)
            user.save()
            f.write("Password reset. Re-testing...\n")
            auth_user = authenticate(username=username, password=password)
            if auth_user:
                f.write("RE-AUTHENTICATION SUCCESSFUL\n")
            else:
                f.write("RE-AUTHENTICATION FAILED\n")

if __name__ == "__main__":
    test()
