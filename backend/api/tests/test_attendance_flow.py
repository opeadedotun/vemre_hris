
from django.test import TestCase
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from api.models import (
    Branch, Employee, JobRole, SalaryStructure, AttendanceUpload, 
    AttendanceLog, AttendanceMonthlySummary, PayrollRun, PayrollRecord,
    Department
)
from decimal import Decimal
import datetime
import traceback

# Verify module loading
try:
    with open('load_check.txt', 'w') as f:
        f.write('MODULE LOADED')
except:
    pass

User = get_user_model()

class AttendanceFlowTest(APITestCase):
    def setUp(self):
        # Cleanup previous test data
        month = '2023-10'
        AttendanceUpload.objects.filter(month=month).delete()
        AttendanceLog.objects.filter(date__startswith=month).delete()
        AttendanceMonthlySummary.objects.filter(month=month).delete()
        PayrollRun.objects.filter(month=month).delete()
        
        # Create User
        self.user, _ = User.objects.get_or_create(username='hr', defaults={'role': 'HR'})
        if not self.user.check_password('password'):
            self.user.set_password('password')
            self.user.save()
        
        # Create Branches
        self.branch_1, _ = Branch.objects.get_or_create(name='Ogbomosho')
        self.branch_2, _ = Branch.objects.get_or_create(name='Osogbo')
        self.branch_3, _ = Branch.objects.get_or_create(name='Ipata')
        
        # Create JobRole
        self.role, _ = JobRole.objects.get_or_create(
            name='Developer',
            defaults={
                'department': Department.objects.create(name='IT'),
                'shift_start': datetime.time(8, 0),
                'shift_end': datetime.time(17, 0),
                'work_days_type': 'MON_FRI'
            }
        )

        # Create SalaryStructure
        self.salary, _ = SalaryStructure.objects.get_or_create(
            job_role=self.role,
            defaults={
                'basic_salary': 100000,
                'housing_allowance': 20000,
                'transport_allowance': 10000,
                'medical_allowance': 5000,
                'utility_allowance': 5000,
                'other_allowances': 5000,
                'late_deduction_rate': 500,
                'absent_deduction_rate': 1000
            }
        )
        
        # Create Employee
        self.employee, _ = Employee.objects.get_or_create(
            employee_code='EMP001',
            defaults={
                'full_name': 'John Doe',
                'job_role': self.role,
                'department': self.role.department,
                'email': 'john@example.com',
                'is_active': True,
                'employment_status': 'ACTIVE'
            }
        )
        
    def test_full_attendance_payroll_flow(self):
        try:
            with open('test_outcome.txt', 'w') as f:
                f.write('STARTING TEST\n')
            
            month = '2023-10'
            
            # 1. Create Uploads
            AttendanceUpload.objects.create(month=month, branch=self.branch_1, uploaded_by=self.user, is_uploaded=True, file_name='test.xlsx', file_path='test.xlsx')
            AttendanceUpload.objects.create(month=month, branch=self.branch_2, uploaded_by=self.user, is_uploaded=True, file_name='test.xlsx', file_path='test.xlsx')
            AttendanceUpload.objects.create(month=month, branch=self.branch_3, uploaded_by=self.user, is_uploaded=True, file_name='test.xlsx', file_path='test.xlsx')
            
            # 2. Add Logs 
            # Oct 2 2023 is Monday (working day)
            AttendanceLog.objects.create(
                employee=self.employee,
                employee_code='EMP001', date=datetime.date(2023, 10, 2), 
                check_in=datetime.time(8, 20), late_minutes=20, late_category='LATE_30',
                branch=self.branch_1, upload=AttendanceUpload.objects.first()
            )
            # Oct 3 2023 is Tuesday (working day)
            AttendanceLog.objects.create(
                employee=self.employee,
                employee_code='EMP001', date=datetime.date(2023, 10, 3), 
                check_in=datetime.time(8, 45), late_minutes=45, late_category='LATE_1HR',
                branch=self.branch_1, upload=AttendanceUpload.objects.first()
            )
            
            # 3. Process Monthly Attendance
            self.client.force_authenticate(user=self.user)
            response = self.client.post('/api/v1/attendance-summaries/process_monthly/', {'month': month})
            
            self.assertEqual(response.status_code, 200)
            
            # Verify Summary
            summary = AttendanceMonthlySummary.objects.get(employee=self.employee, month=month)
            self.assertEqual(summary.total_late_30, 1)
            self.assertEqual(summary.total_late_1hr, 1)
            
            # Expected Absences: 22 working days, 2 days logged -> 20 absences
            self.assertEqual(summary.absent_days, 20)
            
            # Verify Deduction Calculation
            # Total Gross = 100 + 20 + 10 + 5 + 5 + 5 = 145,000
            # Hourly = 145000 / 22 / 8 = 823.8636
            # Late Deduction = (0.5 * hourly) + (1.0 * hourly) = 1.5 * hourly = 1235.795
            total_gross = Decimal('145000')
            hourly = total_gross / Decimal('22') / Decimal('8')
            late_deduction = hourly * Decimal('1.5')
            
            absent_deduction = Decimal('20') * Decimal('1000') # 20 absences * 1000 rate
            expected_total = late_deduction + absent_deduction
            
            self.assertAlmostEqual(summary.salary_deduction_amount, expected_total, places=2)
            
            # 4. Process Payroll
            response = self.client.post('/api/v1/payroll-runs/process/', {'month': month})
            self.assertEqual(response.status_code, 201)
            
            # Verify Payroll Record
            payroll = PayrollRun.objects.get(month=month)
            record = PayrollRecord.objects.get(payroll_run=payroll, employee=self.employee)
            
            self.assertAlmostEqual(record.attendance_deduction, expected_total, places=2)
            self.assertAlmostEqual(record.late_deductions, late_deduction, places=2)
            self.assertAlmostEqual(record.absent_deductions, absent_deduction, places=2)
                
        except Exception:
            with open('test_outcome.txt', 'a') as f:
                f.write(f'EXCEPTION:\n{traceback.format_exc()}\n')
            raise
