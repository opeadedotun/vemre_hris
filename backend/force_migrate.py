import os
import django
from django.core.management import call_command
from io import StringIO
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def run_migrations():
    log_file = r'c:\Users\USER\Documents\Projects\vemrehr\backend\migration_debug_final.txt'
    with open(log_file, 'w') as f:
        f.write("Starting Migration Debug\n")
        
        out = StringIO()
        err = StringIO()
        
        f.write("\n--- Running makemigrations api ---\n")
        try:
            call_command('makemigrations', 'api', stdout=out, stderr=err)
            f.write("STDOUT:\n" + out.getvalue() + "\n")
            f.write("STDERR:\n" + err.getvalue() + "\n")
        except Exception as e:
            f.write(f"Error during makemigrations: {e}\n")
            
        out = StringIO()
        err = StringIO()
        f.write("\n--- Running migrate api ---\n")
        try:
            call_command('migrate', 'api', stdout=out, stderr=err)
            f.write("STDOUT:\n" + out.getvalue() + "\n")
            f.write("STDERR:\n" + err.getvalue() + "\n")
        except Exception as e:
            f.write(f"Error during migrate: {e}\n")
            
        f.write("\n--- Checking Table Existence ---\n")
        from django.db import connection
        tables = connection.introspection.table_names()
        for t in sorted(tables):
            if t.startswith('api_'):
                f.write(f"  - {t}\n")

if __name__ == "__main__":
    run_migrations()
