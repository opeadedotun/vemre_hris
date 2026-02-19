from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from decimal import Decimal
from .models import User, Department, Employee, EmployeeKPI, PerformanceSummary, Appraisal, AuditLog, JobRole, KPITemplate, KPITemplateItem, AttendanceUpload, AttendanceLog, AttendanceSummary, AttendanceMonthlySummary, SalaryStructure, PayrollRun, PayrollRecord, Branch
from .serializers import (
    UserSerializer, DepartmentSerializer, EmployeeSerializer,
    EmployeeKPISerializer,
    PerformanceSummarySerializer, AppraisalSerializer, AuditLogSerializer,
    JobRoleSerializer, KPITemplateSerializer, KPITemplateItemSerializer,
    AttendanceUploadSerializer, AttendanceLogSerializer, AttendanceSummarySerializer,
    SalaryStructureSerializer, PayrollRunSerializer, PayrollRecordSerializer, BranchSerializer
)
from .services.attendance import AttendanceEngine
from django.utils import timezone
from .services.attendance import AttendanceEngine

class IsAdminOrHR(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'HR']

def log_action(user, action, entity, entity_id):
    from .models import AuditLog
    AuditLog.objects.create(
        user=user,
        action=action,
        entity=entity,
        entity_id=entity_id
    )

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'CREATE', 'User', instance.id)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'UPDATE', 'User', instance.id)

    def get_permissions(self):
        if self.action in ['list', 'create', 'destroy']:
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from .models import Employee, KPITemplate, PerformanceSummary, PayrollRun, PayrollRecord, AttendanceSummary
        from django.db.models import Avg, Sum, Count
        
        total_employees = Employee.objects.filter(employment_status='ACTIVE').count()
        active_kpis = KPITemplate.objects.filter(is_active=True).count()
        
        # Get current month
        from datetime import datetime
        current_month = datetime.now().strftime('%Y-%m-%d')[:7]
        
        avg_performance = PerformanceSummary.objects.filter(month=current_month).aggregate(avg=Avg('total_score'))['avg'] or 0
        
        # Rankings (Top 5)
        top_performers = PerformanceSummary.objects.filter(month=current_month).order_by('-total_score')[:5]
        top_performers_data = [{
            'name': p.employee.full_name,
            'score': float(p.total_score),
            'rating': p.performance_rating
        } for p in top_performers]

        # Rating distribution
        dist = {
            'EXCELLENT': PerformanceSummary.objects.filter(month=current_month, performance_rating='EXCELLENT').count(),
            'GOOD': PerformanceSummary.objects.filter(month=current_month, performance_rating='GOOD').count(),
            'FAIR': PerformanceSummary.objects.filter(month=current_month, performance_rating='FAIR').count(),
            'UNSATISFACTORY': PerformanceSummary.objects.filter(month=current_month, performance_rating='UNSATISFACTORY').count(),
        }

        # Payroll Stats
        payroll = PayrollRun.objects.filter(month=current_month, status='PAID').first()
        total_payout = 0
        if payroll:
            total_payout = PayrollRecord.objects.filter(payroll_run=payroll).aggregate(total=Sum('net_salary'))['total'] or 0
        
        # Attendance Stats
        attendance = AttendanceSummary.objects.filter(month=current_month).aggregate(
            total_late=Sum('late_days'),
            total_absent=Sum('absent_days')
        )

        return Response({
            "total_employees": total_employees,
            "active_kpis": active_kpis,
            "avg_performance": round(float(avg_performance), 1),
            "top_performers": top_performers_data,
            "rating_distribution": dist,
            "payroll_stats": {
                "total_payout": float(total_payout),
                "month": current_month,
                "status": payroll.status if payroll else "NOT_PROCESSED"
            },
            "attendance_stats": {
                "late_days": attendance['total_late'] or 0,
                "absent_days": attendance['total_absent'] or 0
            }
        })

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'CREATE', 'Department', instance.id)

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'CREATE', 'Employee', instance.id)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'UPDATE', 'Employee', instance.id)

    @action(detail=False, methods=['post'])
    def import_csv(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        import csv
        import io
        try:
            decoded_file = file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            created_count = 0
            errors = []
            
            for row in reader:
                try:
                    dept_name = row.get('department')
                    dept, _ = Department.objects.get_or_create(name=dept_name)
                    
                    role_name = row.get('job_role') or row.get('role')
                    role = None
                    if role_name:
                        role = JobRole.objects.filter(name__iexact=role_name).first()

                    # If employee_code is blank, update_or_create won't work correctly for "auto-generation" context
                    code = row.get('employee_code')
                    
                    defaults = {
                        'full_name': row.get('full_name') or f"{row.get('first_name', '')} {row.get('last_name', '')}".strip(),
                        'email': row.get('email'),
                        'department': dept,
                        'job_role': role,
                        'job_title': row.get('designation') or row.get('job_title') or (role.name if role else ''),
                        'is_active': row.get('is_active', 'True').lower() == 'true',
                        'employment_status': row.get('employment_status', 'ACTIVE').upper(),
                        'probation_end_date': row.get('probation_end_date') or None
                    }

                    if code:
                        Employee.objects.update_or_create(
                            employee_code=code,
                            defaults=defaults
                        )
                    else:
                        Employee.objects.create(**defaults)
                    created_count += 1
                except Exception as e:
                    errors.append(f"Error in row {row.get('employee_code', 'New')}: {str(e)}")
            
            return Response({
                "message": f"Successfully imported {created_count} employees.",
                "errors": errors
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class KPITemplateViewSet(viewsets.ModelViewSet):
    queryset = KPITemplate.objects.all()
    serializer_class = KPITemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['job_role']

class KPITemplateItemViewSet(viewsets.ModelViewSet):
    queryset = KPITemplateItem.objects.all()
    serializer_class = KPITemplateItemSerializer
    permission_classes = [permissions.IsAuthenticated]

class EmployeeKPIViewSet(viewsets.ModelViewSet):
    queryset = EmployeeKPI.objects.all()
    serializer_class = EmployeeKPISerializer
    permission_classes = [permissions.IsAuthenticated]

class PerformanceSummaryViewSet(viewsets.ModelViewSet):
    queryset = PerformanceSummary.objects.all()
    serializer_class = PerformanceSummarySerializer
    permission_classes = [permissions.IsAuthenticated]

class AppraisalViewSet(viewsets.ModelViewSet):
    queryset = Appraisal.objects.all()
    serializer_class = AppraisalSerializer
    permission_classes = [permissions.IsAuthenticated]

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]

# Removed RoleKPITemplateViewSet as it is replaced by KPITemplateViewSet

class JobRoleViewSet(viewsets.ModelViewSet):
    queryset = JobRole.objects.all()
    serializer_class = JobRoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return JobRoleSerializer

class AttendanceUploadViewSet(viewsets.ModelViewSet):
    queryset = AttendanceUpload.objects.all().order_by('-uploaded_at')
    serializer_class = AttendanceUploadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        instance = serializer.save(uploaded_by=self.request.user)
        # Logic for parsing is handled in a custom action 'process'
        pass

    @action(detail=False, methods=['post'])
    def process(self, request):
        file = request.FILES.get('file')
        month = request.data.get('month')
        branch_id = request.data.get('branch') # Expecting ID
        
        if not file or not month or not branch_id:
            return Response({"error": "File, month, and branch are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            branch = Branch.objects.get(id=branch_id)
        except Branch.DoesNotExist:
            return Response({"error": "Invalid branch ID"}, status=status.HTTP_400_BAD_REQUEST)

        # Create upload record
        upload = AttendanceUpload.objects.create(
            uploaded_by=request.user,
            month=month,
            file_name=file.name,
            branch=branch,
            is_uploaded=True
        )
        
        try:
            # Initialize Engine
            engine = AttendanceEngine()
            
            # Save file to temp path for pandas
            import os
            import tempfile
            
            suffix = os.path.splitext(file.name)[1]
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                for chunk in file.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name
            
            try:
                parsed_data = engine.parse_file(tmp_path, branch.id, month)
            finally:
                os.unlink(tmp_path)
            
            employees = Employee.objects.filter(is_active=True)
            logs = []
            
            for row in parsed_data:
                # Match employee
                emp = engine.match_employee(row['employee_raw'], employees)
                if not emp:
                    # Optional: Log warning or store raw name
                    continue
                
                # Check for schedule/shift to calculate lateness
                expected_start = None
                if hasattr(emp, 'job_role') and emp.job_role and emp.job_role.shift_start:
                    expected_start = emp.job_role.shift_start
                
                late_mins, late_category = engine.classify_lateness(row['check_in'], expected_start)
                
                logs.append(AttendanceLog(
                    upload=upload,
                    branch=branch,
                    employee_code=emp.employee_code,
                    date=row['date'],
                    check_in=row['check_in'],
                    check_out=row['check_out'],
                    status="PRESENT", 
                    late_minutes=late_mins,
                    late_category=late_category
                ))
            
            AttendanceLog.objects.bulk_create(logs)
            
            return Response({"message": f"Successfully processed {len(logs)} logs for {branch.name}."}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            upload.delete()
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def manual_entry(self, request):
        """Allow HR to manually add an attendance log for a specific employee & date."""
        employee_id = request.data.get('employee')
        date = request.data.get('date')
        check_in = request.data.get('check_in')
        check_out = request.data.get('check_out', None)
        branch_id = request.data.get('branch')

        if not employee_id or not date or not check_in or not branch_id:
            return Response({"error": "employee, date, check_in, and branch are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            emp = Employee.objects.get(id=employee_id)
            branch = Branch.objects.get(id=branch_id)
        except (Employee.DoesNotExist, Branch.DoesNotExist):
            return Response({"error": "Invalid employee or branch ID."}, status=status.HTTP_400_BAD_REQUEST)

        from datetime import time as dt_time
        from .services.attendance import AttendanceEngine
        engine = AttendanceEngine()

        ci = engine.parse_time(check_in)
        co = engine.parse_time(check_out) if check_out else None

        expected_start = None
        if emp.job_role and emp.job_role.shift_start:
            expected_start = emp.job_role.shift_start

        late_mins, late_category = engine.classify_lateness(ci, expected_start)

        log, created = AttendanceLog.objects.update_or_create(
            employee_code=emp.employee_code,
            date=date,
            defaults={
                'branch': branch,
                'check_in': ci,
                'check_out': co,
                'status': 'PRESENT',
                'late_minutes': late_mins,
                'late_category': late_category,
            }
        )
        action_text = 'created' if created else 'updated'
        return Response({"message": f"Attendance log {action_text} for {emp.full_name} on {date}."}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def generate_query(self, request):
        """Generate a professional query letter for a late employee."""
        employee_id = request.data.get('employee')
        month = request.data.get('month')

        if not employee_id or not month:
            return Response({"error": "employee and month are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            emp = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response({"error": "Invalid employee ID."}, status=status.HTTP_400_BAD_REQUEST)

        logs = AttendanceLog.objects.filter(
            employee_code=emp.employee_code,
            date__startswith=month,
            late_category__in=['LATE_1HR', 'QUERY']
        ).order_by('date')

        if not logs.exists():
            return Response({"error": "No late records found for this employee in the given month."}, status=status.HTTP_404_NOT_FOUND)

        from datetime import datetime
        month_label = datetime.strptime(month, "%Y-%m").strftime("%B %Y")
        today = datetime.now().strftime("%d %B %Y")

        dates_list = ", ".join([log.date.strftime("%d/%m/%Y") for log in logs])
        total_late_days = logs.count()

        letter = f"""VEMRE AREMU ENTERPRISE LIMITED
{today}

QUERY LETTER

Dear {emp.full_name},

RE: EXCESSIVE LATENESS FOR THE MONTH OF {month_label.upper()}

This letter serves as a formal query regarding your persistent lateness to work during the month of {month_label}.

Our records indicate that you arrived late on {total_late_days} occasion(s), specifically on the following date(s): {dates_list}.

As a member of staff, you are expected to resume work at the officially stipulated time as defined by your job schedule. Your persistent lateness constitutes a breach of the company's attendance policy and negatively impacts productivity and team morale.

You are hereby required to provide a written explanation for this conduct within 48 hours of receiving this letter. Failure to provide a satisfactory explanation may result in further disciplinary action, including but not limited to salary deductions, warnings, or suspension.

Please treat this matter with the seriousness it deserves.

Yours faithfully,
Human Resources Department
Vemre Aremu Enterprise Limited"""

        return Response({"letter": letter, "employee_name": emp.full_name, "month": month_label}, status=status.HTTP_200_OK)

class AttendanceSummaryViewSet(viewsets.ModelViewSet):
    queryset = AttendanceSummary.objects.all()
    serializer_class = AttendanceSummarySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['month', 'employee']

    @action(detail=False, methods=['post'])
    def process_monthly(self, request):
        month = request.data.get('month')
        branch_id = request.data.get('branch')  # Optional: process per-branch
        if not month:
            return Response({"error": "Month is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # No gatekeeping - allow processing for whatever branch data is available
        
        # 2. Aggregate & Calculate
        from django.db.models import Sum, Count, Q
        
        engine = AttendanceEngine()
        working_days = engine.get_working_days_in_month(month)
        
        employees = Employee.objects.filter(is_active=True)
        # If branch_id is provided, filter employees by branch (through their attendance logs)
        if branch_id:
            emp_codes = AttendanceLog.objects.filter(
                branch_id=branch_id, date__startswith=month
            ).values_list('employee_code', flat=True).distinct()
            employees = employees.filter(employee_code__in=emp_codes)
        
        summaries = []
        
        for emp in employees:
            logs = AttendanceLog.objects.filter(employee_code=emp.employee_code, date__startswith=month)
            if not logs.exists(): continue
            
            # Counts
            present_days = logs.values('date').distinct().count()
            
            # Use employee-specific shift pattern if possible, else default
            emp_working_days = working_days
            if emp.job_role:
                emp_working_days = engine.get_working_days_in_month(month, emp.job_role.work_days_type)
            
            absent_days = max(0, emp_working_days - present_days)
            
            late_30 = logs.filter(late_category='LATE_30').count()
            late_1hr = logs.filter(late_category='LATE_1HR').count()
            query = logs.filter(late_category='QUERY').count()
            total_late_days = late_30 + late_1hr + query
            
            # Deduction Calculation
            late_deduction = Decimal('0.00')
            absent_deduction = Decimal('0.00')
            
            if emp.job_role and hasattr(emp.job_role, 'salary_structure'):
                struct = emp.job_role.salary_structure
                hourly_rate = struct.get_hourly_rate()
                
                # Lateness: hourly based
                d_30 = Decimal(late_30) * hourly_rate * Decimal('0.5')
                d_1hr = Decimal(late_1hr) * hourly_rate * Decimal('1.0')
                d_query = Decimal(query) * hourly_rate * Decimal('2.0') 
                late_deduction = d_30 + d_1hr + d_query
                
                # Absence: flat rate from structure
                absent_deduction = Decimal(absent_days) * struct.absent_deduction_rate
            
            total_deduction = late_deduction + absent_deduction
            
            summary, _ = AttendanceMonthlySummary.objects.update_or_create(
                employee=emp,
                month=month,
                defaults={
                    'total_late_30': late_30,
                    'total_late_1hr': late_1hr,
                    'total_query': query,
                    'total_late_days': total_late_days,
                    'absent_days': absent_days,
                    'salary_deduction_amount': total_deduction,
                    'absent_deduction_amount': absent_deduction,
                    'is_processed': True,
                    'processed_at': timezone.now()
                }
            )
            
            # 3. Disciplinary Actions
            if query > 0:
                 DisciplinaryAction.objects.get_or_create(
                    employee=emp, month=month, action_type='QUERY_LETTER',
                    defaults={'reason': f"Recorded {query} days with > 1 hour lateness."}
                 )
            elif total_late_days > 5:
                 DisciplinaryAction.objects.get_or_create(
                    employee=emp, month=month, action_type='HR_REVIEW',
                    defaults={'reason': f"Recorded {total_late_days} late days in {month}."}
                 )
            elif total_late_days > 3:
                 DisciplinaryAction.objects.get_or_create(
                    employee=emp, month=month, action_type='WARNING',
                    defaults={'reason': f"Recorded {total_late_days} late days in {month}."}
                 )

        return Response({"message": "Monthly attendance processed successfully."}, status=status.HTTP_200_OK)


class SalaryStructureViewSet(viewsets.ModelViewSet):
    queryset = SalaryStructure.objects.all()
    serializer_class = SalaryStructureSerializer
    permission_classes = [permissions.IsAuthenticated]

class PayrollRunViewSet(viewsets.ModelViewSet):
    queryset = PayrollRun.objects.all().order_by('-created_at')
    serializer_class = PayrollRunSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def process(self, request):
        from .services.tax import calculate_monthly_tax
        month = request.data.get('month')
        if not month:
            return Response({"error": "Month is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        existing = PayrollRun.objects.filter(month=month).exclude(status='DRAFT').first()
        if existing:
            return Response({"error": f"Payroll for {month} is already processed or paid."}, status=status.HTTP_400_BAD_REQUEST)
        
        payroll_run, _ = PayrollRun.objects.get_or_create(month=month, status='DRAFT')
        payroll_run.records.all().delete()
        
        employees = Employee.objects.filter(employment_status='ACTIVE')
        records = []
        
        for emp in employees:
            salary = getattr(emp.job_role, 'salary_structure', None) if emp.job_role else None
            if not salary:
                continue
            
            late_deductions = Decimal('0.00')
            absent_deductions = Decimal('0.00')
            attendance_deduction = Decimal('0.00')
            
            summary = AttendanceMonthlySummary.objects.filter(employee=emp, month=month).first()
            if summary and summary.is_processed:
                late_deductions = summary.salary_deduction_amount - summary.absent_deduction_amount
                absent_deductions = summary.absent_deduction_amount
                attendance_deduction = summary.salary_deduction_amount
            
            housing = salary.housing_allowance
            transport = salary.transport_allowance
            medical = salary.medical_allowance
            utility = salary.utility_allowance
            other = salary.other_allowances
            total_allowances = housing + transport + medical + utility + other
            
            monthly_gross = salary.basic_salary + total_allowances
            tax_deduction = calculate_monthly_tax(monthly_gross)
            
            net_salary = monthly_gross - late_deductions - absent_deductions - tax_deduction
            
            records.append(PayrollRecord(
                payroll_run=payroll_run,
                employee=emp,
                basic_salary=salary.basic_salary,
                housing_allowance=housing,
                transport_allowance=transport,
                medical_allowance=medical,
                utility_allowance=utility,
                other_allowances=other,
                total_allowances=total_allowances,
                late_deductions=late_deductions,
                absent_deductions=absent_deductions,
                attendance_deduction=attendance_deduction,
                tax_deduction=tax_deduction,
                net_salary=net_salary
            ))
            
        PayrollRecord.objects.bulk_create(records)
        payroll_run.processed_by = request.user
        payroll_run.save()
        
        return Response({"message": f"Successfully processed payroll for {len(records)} employees.", "id": payroll_run.id}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        payroll_run = self.get_object()
        if payroll_run.status != 'DRAFT':
            return Response({"error": "Only draft payrolls can be approved."}, status=status.HTTP_400_BAD_REQUEST)
        
        payroll_run.status = 'APPROVED'
        payroll_run.save()
        log_action(request.user, 'APPROVE', 'PayrollRun', payroll_run.id)
        return Response({"message": f"Payroll for {payroll_run.month} approved successfully."})

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        import csv
        from django.http import HttpResponse
        payroll_run = self.get_object()
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="payroll_{payroll_run.month}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Employee', 'Basic Salary', 'Housing', 'Transport', 'Medical',
            'Utility', 'Other', 'Total Allowances', 'Late Ded.', 'Absent Ded.',
            'Tax Deduction', 'Net Salary'
        ])
        
        for r in payroll_run.records.select_related('employee').all():
            writer.writerow([
                r.employee.full_name,
                r.basic_salary, r.housing_allowance, r.transport_allowance,
                r.medical_allowance, r.utility_allowance, r.other_allowances,
                r.total_allowances, r.late_deductions, r.absent_deductions,
                r.tax_deduction, r.net_salary
            ])
        
        return response

class PayrollRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PayrollRecord.objects.all()
    serializer_class = PayrollRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['payroll_run', 'employee']

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]
