
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from api.models import (
    Branch, Employee, JobRole, SalaryStructure, AttendanceUpload, 
    AttendanceLog, AttendanceMonthlySummary, PayrollRun, PayrollRecord
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

class AttendanceFlowTest(TestCase):
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
        
        # Create JobRole & Salary
        self.salary, _ = SalaryStructure.objects.get_or_create(
            name='Standard',
            defaults={
                'basic_salary': 100000,
                'housing_allowance': 20000,
                'transport_allowance': 10000,
                'other_allowances': 5000,
                'monthly_work_hours': 176
            }
        )
        
        self.role, _ = JobRole.objects.get_or_create(
            name='Developer',
            defaults={
                'salary_structure': self.salary,
                'shift_start': datetime.time(8, 0),
                'shift_end': datetime.time(17, 0)
            }
        )
        
        # Create Employee
        self.employee, _ = Employee.objects.get_or_create(
            employee_code='EMP001',
            defaults={
                'first_name': 'John',
                'last_name': 'Doe',
                'job_role': self.role,
                'is_active': True
            }
        )
        
    def test_full_attendance_payroll_flow(self):
        try:
            with open('test_outcome.txt', 'w') as f:
                f.write('STARTING TEST\n')
            
            month = '2023-10'
            
            # 1. Create Uploads
            AttendanceUpload.objects.create(month=month, branch=self.branch_1, uploaded_by=self.user, is_uploaded=True)
            AttendanceUpload.objects.create(month=month, branch=self.branch_2, uploaded_by=self.user, is_uploaded=True)
            AttendanceUpload.objects.create(month=month, branch=self.branch_3, uploaded_by=self.user, is_uploaded=True)
            
            # 2. Add Logs 
            AttendanceLog.objects.create(
                employee_code='EMP001', date=datetime.date(2023, 10, 1), 
                check_in=datetime.time(8, 20), late_minutes=20, late_category='LATE_30',
                branch=self.branch_1
            )
            AttendanceLog.objects.create(
                employee_code='EMP001', date=datetime.date(2023, 10, 2), 
                check_in=datetime.time(8, 45), late_minutes=45, late_category='LATE_1HR',
                branch=self.branch_1
            )
            
            # 3. Process Monthly Attendance
            self.client.force_login(self.user)
            response = self.client.post('/api/attendance-summary/process_monthly/', {'month': month})
            
            if response.status_code != 200:
                with open('test_outcome.txt', 'a') as f:
                    f.write(f'FAILURE: process_monthly returned {response.status_code}\n{response.content}\n')
                self.fail(f'process_monthly returned {response.status_code}')
            
            # Verify Summary
            summary = AttendanceMonthlySummary.objects.get(employee=self.employee, month=month)
            self.assertEqual(summary.total_late_30, 1)
            self.assertEqual(summary.total_late_1hr, 1)
            
            # Verify Deduction Calculation
            hourly = Decimal('100000') / Decimal('22') / Decimal('8')
            expected_deduction = hourly * Decimal('1.5')
            
            self.assertAlmostEqual(summary.salary_deduction_amount, expected_deduction, places=2)
            
            # 4. Process Payroll
            response = self.client.post('/api/payroll-run/process/', {'month': month})
            if response.status_code != 201:
                with open('test_outcome.txt', 'a') as f:
                    f.write(f'FAILURE: payroll returned {response.status_code}\n{response.content}\n')
                self.fail(f'payroll returned {response.status_code}') # No response.content in fail to avoid noise in console if console worked
            
            # Verify Payroll Record
            payroll = PayrollRun.objects.get(month=month)
            record = PayrollRecord.objects.get(payroll_run=payroll, employee=self.employee)
            
            self.assertAlmostEqual(record.attendance_deduction, expected_deduction, places=2)
            
            with open('test_outcome.txt', 'a') as f:
                f.write('SUCCESS\n')
                
        except Exception:
            with open('test_outcome.txt', 'a') as f:
                f.write(f'EXCEPTION:\n{traceback.format_exc()}\n')
            raise
