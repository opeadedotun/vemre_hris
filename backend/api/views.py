from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from decimal import Decimal
from .models import User, Department, Employee, EmployeeKPI, PerformanceSummary, Appraisal, AuditLog, JobRole, KPITemplate, KPITemplateItem, AttendanceUpload, AttendanceLog, AttendanceSummary, SalaryStructure, PayrollRun, PayrollRecord
from .serializers import (
    UserSerializer, DepartmentSerializer, EmployeeSerializer,
    EmployeeKPISerializer,
    PerformanceSummarySerializer, AppraisalSerializer, AuditLogSerializer,
    JobRoleSerializer, KPITemplateSerializer, KPITemplateItemSerializer,
    AttendanceUploadSerializer, AttendanceLogSerializer, AttendanceSummarySerializer,
    SalaryStructureSerializer, PayrollRunSerializer, PayrollRecordSerializer
)

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
    queryset = AttendanceUpload.objects.all().order_by('-timestamp')
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
        if not file or not month:
            return Response({"error": "File and month are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        import csv
        import io
        from datetime import datetime
        
        upload = AttendanceUpload.objects.create(
            uploaded_by=request.user,
            month=month,
            file_name=file.name
        )
        
        try:
            decoded_file = file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            logs = []
            codes = set()
            
            for row in reader:
                code = row.get('employee_code')
                date_str = row.get('date')
                if not code or not date_str: continue
                
                employee = Employee.objects.filter(employee_code=code).first()
                # We need employee for shift timings
                
                check_in_str = row.get('check_in')
                late_mins = 0
                status_val = row.get('status', 'PRESENT').upper()

                if check_in_str and employee and employee.job_role and employee.job_role.shift_start:
                    try:
                        # Handle different time formats if necessary, assuming HH:MM:SS or HH:MM
                        t_fmt = '%H:%M:%S' if len(check_in_str.split(':')) == 3 else '%H:%M'
                        ci_time = datetime.strptime(check_in_str, t_fmt).time()
                        ss_time = employee.job_role.shift_start
                        
                        ci_total_mins = ci_time.hour * 60 + ci_time.minute
                        ss_total_mins = ss_time.hour * 60 + ss_time.minute
                        
                        if ci_total_mins > ss_total_mins:
                            late_mins = ci_total_mins - ss_total_mins
                            # Automatically mark as LATE if more than 5 mins
                            if late_mins > 5 and status_val == 'PRESENT':
                                status_val = 'LATE'
                    except Exception as e:
                        print(f"Error parsing time: {e}")
                
                codes.add(code)
                logs.append(AttendanceLog(
                    upload=upload,
                    employee_code=code,
                    date=datetime.strptime(date_str, '%Y-%m-%d').date(),
                    check_in=check_in_str if check_in_str else None,
                    check_out=row.get('check_out') if row.get('check_out') else None,
                    status=status_val,
                    late_minutes=late_mins
                ))
            
            AttendanceLog.objects.bulk_create(logs)
            
            # Update summaries
            from django.db.models import Count, Q
            for code in codes:
                employee = Employee.objects.filter(employee_code=code).first()
                if not employee: continue
                
                summary, _ = AttendanceSummary.objects.get_or_create(
                    employee=employee,
                    month=month
                )
                
                # Aggregate all logs for this month/employee across all uploads? 
                # Actually, standard HR logic might be better: sum existing summary + new logs?
                # Better: full recalculation for the month from ALL logs of that month.
                month_logs = AttendanceLog.objects.filter(employee_code=code, date__startswith=month)
                
                summary.total_days = month_logs.count()
                summary.present_days = month_logs.filter(status='PRESENT').count()
                summary.absent_days = month_logs.filter(status='ABSENT').count()
                summary.late_days = month_logs.filter(status='LATE').count()
                summary.total_late_minutes = month_logs.aggregate(total=Sum('late_minutes'))['total'] or 0
                summary.half_days = month_logs.filter(status='HALFDAY').count()
                summary.sick_leave = month_logs.filter(status='SICK_LEAVE').count()
                summary.emergency_leave = month_logs.filter(status='EMERGENCY_LEAVE').count()
                summary.save()

            return Response({"message": f"Successfully processed {len(logs)} logs."}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            upload.delete()
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AttendanceSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttendanceSummary.objects.all()
    serializer_class = AttendanceSummarySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['month', 'employee']

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
        month = request.data.get('month')
        if not month:
            return Response({"error": "Month is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already exists? Overwrite?
        existing = PayrollRun.objects.filter(month=month).exclude(status='DRAFT').first()
        if existing:
            return Response({"error": f"Payroll for {month} is already processed or paid."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create or Get Draft
        payroll_run, _ = PayrollRun.objects.get_or_create(month=month, status='DRAFT')
        payroll_run.records.all().delete() # Clear existing draft records
        
        employees = Employee.objects.filter(employment_status='ACTIVE')
        records = []
        
        for emp in employees:
            salary = getattr(emp.job_role, 'salary_structure', None)
            if not salary: continue
            
            from .utils import calculate_lateness_penalty
            
            late_deductions = Decimal('0.00')
            absent_deductions = Decimal('0.00')
            
            if attendance:
                hourly_rate = salary.get_hourly_rate()
                # Calculate penalty per late day based on the rules
                month_logs = AttendanceLog.objects.filter(employee_code=emp.employee_code, date__startswith=month)
                for log in month_logs:
                    if log.late_minutes > 0:
                        late_deductions += calculate_lateness_penalty(log.late_minutes, hourly_rate)
                
                absent_deductions = Decimal(str(attendance.absent_days)) * salary.absent_deduction_rate
            
            total_allowances = salary.housing_allowance + salary.transport_allowance + salary.other_allowances
            net_salary = (salary.basic_salary + total_allowances) - (late_deductions + absent_deductions)
            
            records.append(PayrollRecord(
                payroll_run=payroll_run,
                employee=emp,
                basic_salary=salary.basic_salary,
                allowances=total_allowances,
                late_deductions=late_deductions,
                absent_deductions=absent_deductions,
                net_salary=net_salary
            ))
            
        PayrollRecord.objects.bulk_create(records)
        payroll_run.processed_by = request.user
        payroll_run.save()
        
        return Response({"message": f"Successfully processed payroll for {len(records)} employees.", "id": payroll_run.id}, status=status.HTTP_201_CREATED)

class PayrollRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PayrollRecord.objects.all()
    serializer_class = PayrollRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['payroll_run', 'employee']
