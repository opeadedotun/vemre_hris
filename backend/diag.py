import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
try:
    print("Starting Django setup...")
    sys.stdout.flush()
    django.setup()
    print("Django setup successful")
    sys.stdout.flush()
except Exception as e:
    print(f"Error during Django setup: {e}")
    sys.stdout.flush()
    import traceback
    traceback.print_exc()
    sys.stderr.flush()
    sys.exit(1)
