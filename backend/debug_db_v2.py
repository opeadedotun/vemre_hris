import os
import django
import sys

print("Python version:", sys.version)
print("Starting Django setup...")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
try:
    django.setup()
    print("Django setup successful.")
except Exception as e:
    print(f"Django setup failed: {e}")
    sys.exit(1)

from django.db import connection
tables = connection.introspection.table_names()
print(f"Found {len(tables)} tables.")
for t in sorted(tables):
    if t.startswith('api_'):
        print(f"  - {t}")
