import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def inspect_salary_structure():
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(api_salarystructure)")
        columns = cursor.fetchall()
        print("api_salarystructure columns:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")

if __name__ == "__main__":
    inspect_salary_structure()
