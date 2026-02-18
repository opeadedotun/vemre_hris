
import sys
import os
import django
import traceback

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

try:
    import api.tests.test_attendance_flow
    print("Import Successful")
    with open('check_result.txt', 'w') as f:
        f.write("SUCCESS")
except Exception:
    with open('check_result.txt', 'w') as f:
        f.write(traceback.format_exc())
except SyntaxError:
    with open('check_result.txt', 'w') as f:
        f.write("SYNTAX ERROR:\n" + traceback.format_exc())
except:
    with open('check_result.txt', 'w') as f:
        f.write("UNKNOWN ERROR:\n" + traceback.format_exc())
