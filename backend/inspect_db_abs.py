import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

output_file = r'c:\Users\USER\Documents\Projects\vemrehr\backend\inspection_result_abs.txt'
with open(output_file, 'w') as f:
    f.write(f"Current Working Directory: {os.getcwd()}\n")
    f.write(f"DB Settings: {django.conf.settings.DATABASES['default']}\n")
    
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(api_salarystructure)")
        columns = cursor.fetchall()
        f.write("api_salarystructure columns:\n")
        for col in columns:
            f.write(f"  - {col[1]} ({col[2]})\n")
    
    tables = connection.introspection.table_names()
    f.write("\nAll tables:\n")
    for t in sorted(tables):
        if t.startswith('api_'):
            f.write(f"  - {t}\n")

print(f"Done. Wrote to {output_file}")
