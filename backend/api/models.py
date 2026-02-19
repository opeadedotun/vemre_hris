from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class User(AbstractUser):
    ADMIN = 'ADMIN'
    HR = 'HR'
    MANAGER = 'MANAGER'
    FINANCE = 'FINANCE'
    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (HR, 'HR'),
        (MANAGER, 'Manager'),
        (FINANCE, 'Finance'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=MANAGER)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

class Branch(models.Model):
    name = models.CharField(max_length=100)  # Ogbomosho, Osogbo, Ipata
    location = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Department(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class JobRole(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='job_roles')
    shift_start = models.TimeField(null=True, blank=True, help_text="Standard check-in time")
    shift_end = models.TimeField(null=True, blank=True, help_text="Standard check-out time")
    work_days_type = models.CharField(max_length=20, choices=[
        ('MON_FRI', 'Monday-Friday'),
        ('DAILY', 'Daily (Mon-Sun)'),
        ('SHIFT_4_4', '4 Days On, 4 Days Off'),
    ], default='MON_FRI')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.department.name})"

class EmployeeSchedule(models.Model):
    employee = models.OneToOneField('Employee', on_delete=models.CASCADE, related_name='schedule')
    schedule_type = models.CharField(max_length=100)  # e.g., HR Manager, Operations Manager
    expected_start_time = models.TimeField()
    expected_end_time = models.TimeField()
    work_days_pattern = models.CharField(max_length=255, help_text="e.g., Mon-Fri, 4 On 4 Off")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.full_name} - {self.schedule_type}"

class Employee(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('TERMINATED', 'Terminated'),
    ]
    employee_code = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=255)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='employees')
    job_role = models.ForeignKey(JobRole, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    job_title = models.CharField(max_length=255)
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    date_joined = models.DateField(null=True, blank=True)
    employment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    probation_end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    passport = models.ImageField(upload_to='passports/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.employee_code:
            last_employee = Employee.objects.all().order_by('id').last()
            if not last_employee:
                self.employee_code = 'VAE-0001'
            else:
                last_code = last_employee.employee_code
                if last_code.startswith('VAE-'):
                    try:
                        code_num = int(last_code.split('-')[1]) + 1
                        self.employee_code = f'VAE-{code_num:04d}'
                    except (ValueError, IndexError):
                        self.employee_code = f'VAE-{last_employee.id + 1:04d}'
                else:
                    self.employee_code = f'VAE-{last_employee.id + 1:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.employee_code})"

class KPITemplate(models.Model):
    job_role = models.ForeignKey(JobRole, on_delete=models.CASCADE, related_name='templates')
    name = models.CharField(max_length=255)
    total_points = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.job_role.name})"

class KPITemplateItem(models.Model):
    template = models.ForeignKey(KPITemplate, on_delete=models.CASCADE, related_name='items')
    kpi_name = models.CharField(max_length=255)
    weight_points = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.kpi_name} ({self.weight_points} pts)"

class EmployeeKPI(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='kpis')
    template_item = models.ForeignKey(KPITemplateItem, on_delete=models.CASCADE, null=True)
    month = models.CharField(max_length=7)  # YYYY-MM
    target_points = models.DecimalField(max_digits=10, decimal_places=2, default=100.00)
    actual_points = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    score_percentage = models.DecimalField(max_digits=10, decimal_places=2, editable=False, default=0.00)
    weighted_score = models.DecimalField(max_digits=10, decimal_places=2, editable=False, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        from decimal import Decimal
        target = Decimal(str(self.target_points))
        actual = Decimal(str(self.actual_points))
        weight = Decimal(str(self.template_item.weight_points)) if self.template_item else Decimal('0.00')
        
        if target > 0:
            self.score_percentage = (actual / target) * Decimal('100.00')
        else:
            self.score_percentage = Decimal('0.00')
        
        self.weighted_score = (self.score_percentage * weight) / Decimal('100.00')
        super().save(*args, **kwargs)

class PerformanceSummary(models.Model):
    PROBATION_STATUS = [
        ('PASS', 'Pass'),
        ('EXTEND', 'Extend'),
        ('FAIL', 'Fail'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='performance_summaries')
    month = models.CharField(max_length=7)  # YYYY-MM
    total_score = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    performance_rating = models.CharField(max_length=20, blank=True)
    department_rank = models.IntegerField(null=True, blank=True)
    probation_status = models.CharField(max_length=10, choices=PROBATION_STATUS, null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('employee', 'month')

    @classmethod
    def update_department_rankings(cls, department_id, month):
        summaries = cls.objects.filter(employee__department_id=department_id, month=month).order_by('-total_score')
        for i, summary in enumerate(summaries, 1):
            summary.department_rank = i
            summary.save()

    def update_rating(self):
        score = self.total_score
        outcome = ""
        # Probation Rules: >70% PASS, 50-69% EXTEND, <50% FAIL
        if score >= 70:
            self.performance_rating = 'GOOD' if score < 90 else 'EXCELLENT'
            self.probation_status = 'PASS'
            outcome = "Satisfactory – confirmation recommended"
        elif score >= 50:
            self.performance_rating = 'FAIR'
            self.probation_status = 'EXTEND'
            outcome = "Improvement required – probation may be extended"
        else:
            self.performance_rating = 'UNSATISFACTORY'
            self.probation_status = 'FAIL'
            outcome = "Unsatisfactory – employment may be terminated"
        
        probation_msg = f"Outcome: {outcome}."
        if not self.remarks or probation_msg not in self.remarks:
            if self.remarks:
                self.remarks += f" {probation_msg}"
            else:
                self.remarks = probation_msg
        
        self.save()

class AttendanceUpload(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='uploads')
    month = models.CharField(max_length=7)  # YYYY-MM
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    file_name = models.CharField(max_length=255)
    file_path = models.FileField(upload_to='attendance_uploads/')
    is_uploaded = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.branch.name} - {self.month}"

class AttendanceLog(models.Model):
    LATE_CATEGORY_CHOICES = [
        ('IGNORE', 'Ignore (<= 5 min)'),
        ('LATE_30', 'Late 30 Min (6-30 min)'),
        ('LATE_1HR', 'Late 1 Hour (31-60 min)'),
        ('QUERY', 'Query (> 60 min)'),
    ]
    upload = models.ForeignKey(AttendanceUpload, on_delete=models.CASCADE, related_name='logs')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='logs', null=True)
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='attendance_logs', null=True)
    employee_code = models.CharField(max_length=50)
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    late_minutes = models.IntegerField(default=0)
    late_category = models.CharField(max_length=20, choices=LATE_CATEGORY_CHOICES, default='IGNORE')
    status = models.CharField(max_length=20, default='PRESENT')

class AttendanceSummary(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_summaries')
    month = models.CharField(max_length=7)  # YYYY-MM
    total_days = models.IntegerField(default=0)
    present_days = models.IntegerField(default=0)
    absent_days = models.IntegerField(default=0)
    late_days = models.IntegerField(default=0)
    total_late_minutes = models.IntegerField(default=0)
    half_days = models.IntegerField(default=0)
    sick_leave = models.IntegerField(default=0)
    emergency_leave = models.IntegerField(default=0)

    class Meta:
        unique_together = ('employee', 'month')

class AttendanceMonthlySummary(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='monthly_attendance_summaries')
    month = models.CharField(max_length=7)  # YYYY-MM
    total_late_30 = models.IntegerField(default=0)
    total_late_1hr = models.IntegerField(default=0)
    total_query = models.IntegerField(default=0)
    total_late_days = models.IntegerField(default=0)
    absent_days = models.IntegerField(default=0)
    salary_deduction_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Total
    absent_deduction_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('employee', 'month')

class Appraisal(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='appraisals')
    appraisal_period = models.CharField(max_length=255)
    total_score = models.DecimalField(max_digits=10, decimal_places=2)
    rating = models.CharField(max_length=50)
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    comments = models.TextField(blank=True, null=True)
    appraisal_date = models.DateField(auto_now_add=True)

class DisciplinaryAction(models.Model):
    ACTION_TYPES = [
        ('WARNING', 'Warning'),
        ('HR_REVIEW', 'HR Review'),
        ('QUERY_LETTER', 'Query Letter'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='disciplinary_actions')
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    reason = models.TextField()
    date_issued = models.DateField(auto_now_add=True)
    month = models.CharField(max_length=7) # YYYY-MM
    is_resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.action_type} - {self.employee.full_name} ({self.month})"

class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50)  # CREATE, UPDATE, DELETE
    entity = models.CharField(max_length=50)   # Employee, KPI, etc.
    entity_id = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

class SalaryStructure(models.Model):
    job_role = models.OneToOneField(JobRole, on_delete=models.CASCADE, related_name='salary_structure')
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    housing_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    transport_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    medical_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    utility_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    late_deduction_rate = models.DecimalField(max_digits=10, decimal_places=2, default=500.00) 
    absent_deduction_rate = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00)

    def get_hourly_rate(self):
        """
        Calculates hourly rate based on monthly salary (basic + allowances).
        Formula: Daily Rate = Monthly Salary / 22 (common working days)
                 Hourly Rate = Daily Rate / 8 (common work hours)
        """
        from decimal import Decimal
        total_monthly = self.basic_salary + self.housing_allowance + self.transport_allowance + \
                        self.medical_allowance + self.utility_allowance + self.other_allowances
        daily_rate = total_monthly / Decimal('22.0')
        return daily_rate / Decimal('8.0')

    def __str__(self):
        return f"Salary for {self.job_role.name}"

class PayrollRun(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
    ]
    month = models.CharField(max_length=7)  # YYYY-MM
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payroll {self.month} - {self.status}"

class PayrollRecord(models.Model):
    payroll_run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name='records')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    housing_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    transport_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    medical_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    utility_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    late_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    absent_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    attendance_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.employee.full_name} - {self.payroll_run.month}"

# Update PerformanceSummary on EmployeeKPI save
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Sum

@receiver(post_save, sender=EmployeeKPI)
def update_performance_summary(sender, instance, **kwargs):
    summary, created = PerformanceSummary.objects.get_or_create(
        employee=instance.employee,
        month=instance.month
    )
    if not summary.is_locked:
        total = EmployeeKPI.objects.filter(
            employee=instance.employee, 
            month=instance.month
        ).aggregate(total=Sum('weighted_score'))['total'] or 0
        summary.total_score = total
        summary.update_rating()
        # Trigger departmental ranking update
        PerformanceSummary.update_department_rankings(instance.employee.department_id, instance.month)
