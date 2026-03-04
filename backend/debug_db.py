import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def check_tables():
    tables = connection.introspection.table_names()
    print("Existing tables:")
    for t in sorted(tables):
        if t.startswith('api_'):
            print(f"  - {t}")
            
    print("\nApplied migrations for 'api':")
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM django_migrations WHERE app='api' ORDER BY id")
        for row in cursor.fetchall():
            print(f"  - {row[0]}")

if __name__ == "__main__":
    check_tables()
