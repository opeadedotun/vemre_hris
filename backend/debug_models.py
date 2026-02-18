import os
import django
from django.apps import apps
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

try:
    Branch = apps.get_model('api', 'Branch')
    print(f"Branch model loaded: {Branch}")
    
    # Check if table exists
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='api_branch';")
        table = cursor.fetchone()
        print(f"Table api_branch exists: {table is not None}")

    # Check migrations recorder
    with connection.cursor() as cursor:
        cursor.execute("SELECT app, name FROM django_migrations WHERE app='api' ORDER BY name;")
        migrations = cursor.fetchall()
        print("\nApplied migrations:")
        for m in migrations:
            print(f" - {m[0]} {m[1]}")

except Exception as e:
    with open("debug_result.txt", "w") as f:
        f.write(f"Error: {e}")
else:
    with open("debug_result.txt", "w") as f:
        f.write(f"Branch model loaded: {Branch}\n")
        
        # Check if table exists
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='api_branch';")
            table = cursor.fetchone()
            f.write(f"Table api_branch exists: {table is not None}\n")


        # List branches
        branches = Branch.objects.all()
        f.write(f"\nTotal Branches: {branches.count()}\n")
        for b in branches:
            f.write(f" - {b.name} ({b.location})\n")
