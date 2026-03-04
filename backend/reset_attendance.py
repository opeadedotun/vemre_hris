import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import AttendanceLog, AttendanceUpload, AttendanceSummary, AttendanceMonthlySummary, PayrollRun, PayrollRecord

def reset_attendance_data():
    print("Resetting attendance and payroll data...")
    AttendanceLog.objects.all().delete()
    AttendanceSummary.objects.all().delete()
    AttendanceMonthlySummary.objects.all().delete()
    AttendanceUpload.objects.all().delete()
    
    # Also resetting payroll as it depends on attendance
    PayrollRecord.objects.all().delete()
    PayrollRun.objects.all().delete()
    
    print("Attendance and Payroll records cleared.")

if __name__ == "__main__":
    reset_attendance_data()
