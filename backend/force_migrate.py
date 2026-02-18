import os
import django
from django.core.management import call_command

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

try:
    print("Running makemigrations for api...")
    call_command('makemigrations', 'api')
    print("Running migrate...")
    call_command('migrate')
except Exception as e:
    import traceback
    traceback.print_exc()
