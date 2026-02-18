
import os
import sys
import traceback

# Debug setup
with open('manual_debug.txt', 'w') as f:
    f.write(f"StartCWD: {os.getcwd()}\n")
    f.write(f"Path: {sys.path}\n")

try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    import django
    django.setup()
    with open('manual_debug.txt', 'a') as f:
        f.write("Django Setup OK\n")
except Exception:
    with open('manual_debug.txt', 'a') as f:
        f.write(f"Django Setup Failed:\n{traceback.format_exc()}\n")
    sys.exit(1)

try:
    # Try importing views to check for pandas/dependency issues early
    import api.views
    with open('manual_debug.txt', 'a') as f:
        f.write("api.views Import OK\n")
except Exception:
    with open('manual_debug.txt', 'a') as f:
        f.write(f"api.views Import Failed:\n{traceback.format_exc()}\n")
    # Continue to see if test import fails too

try:
    from api.tests.test_attendance_flow import AttendanceFlowTest
    with open('manual_debug.txt', 'a') as f:
        f.write("Test Class Import OK\n")
except Exception:
    with open('manual_debug.txt', 'a') as f:
        f.write(f"Test Class Import Failed:\n{traceback.format_exc()}\n")
    sys.exit(1)

try:
    with open('manual_test_outcome.txt', 'w') as f:
        f.write('STARTING MANUAL RUN\n')
        
    test_instance = AttendanceFlowTest()
    test_instance.setUp()
    # Manually setting up test environment if needed, but lets see if basic run works
    # Note: Client might need test environment setup
    from django.test.utils import setup_test_environment
    setup_test_environment()
    
    test_instance.test_full_attendance_payroll_flow()
    
    with open('manual_test_outcome.txt', 'a') as f:
        f.write('MANUAL SUCCESS\n')
    print("MANUAL SUCCESS")
    
except Exception:
    with open('manual_test_outcome.txt', 'a') as f:
        f.write(f'MANUAL FAILURE:\n{traceback.format_exc()}\n')
    print("MANUAL FAILURE")
    traceback.print_exc()
