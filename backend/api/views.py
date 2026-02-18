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

class AttendanceSummaryViewSet(viewsets.ModelViewSet):
    queryset = AttendanceSummary.objects.all()
    serializer_class = AttendanceSummarySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['month', 'employee']

    @action(detail=False, methods=['post'])
    def process_monthly(self, request):
        month = request.data.get('month')
        if not month:
            return Response({"error": "Month is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 1. Gatekeeping: Check all branches
        required_branches = ['Ogbomosho', 'Osogbo', 'Ipata'] 
        # Ideally, fetch from DB: Branch.objects.values_list('name', flat=True)
        # But for now, we check if we have uploads for all branches for this month
        
        uploaded_branches = AttendanceUpload.objects.filter(month=month).values_list('branch__name', flat=True).distinct()
        missing = [b for b in required_branches if b not in uploaded_branches]
        
        if missing:
            return Response({
                "error": f"Cannot process month. Missing uploads from: {', '.join(missing)}",
                "missing_branches": missing
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # 2. Aggregate & Calculate
        from django.db.models import Sum, Count, Q
        
        employees = Employee.objects.filter(is_active=True)
        summaries = []
        
        for emp in employees:
            logs = AttendanceLog.objects.filter(employee_code=emp.employee_code, date__startswith=month)
            if not logs.exists(): continue
            
            # Counts
            late_30 = logs.filter(late_category='LATE_30').count()
            late_1hr = logs.filter(late_category='LATE_1HR').count()
            query = logs.filter(late_category='QUERY').count()
            total_late_days = late_30 + late_1hr + query # Or just logs with late_minutes > 5
            
            # Deduction Calculation
            salary_struct = getattr(emp, 'salary_structure', None) # direct relation or through role?
            # Model says: SalaryStructure OneToOne to JobRole. Employee has JobRole.
            # So: emp.job_role.salary_structure
            
            deduction = Decimal('0.00')
            if emp.job_role and hasattr(emp.job_role, 'salary_structure'):
                struct = emp.job_role.salary_structure
                hourly_rate = struct.get_hourly_rate()
                
                # Formula: (Late_30 * Hourly * 0.5) + (Late_1Hr * Hourly * 1.0)
                d_30 = Decimal(late_30) * hourly_rate * Decimal('0.5')
                d_1hr = Decimal(late_1hr) * hourly_rate * Decimal('1.0')
                # Query? Maybe manual or full day? Let's assume 1.5x for now or leave for HR
                d_query = Decimal(query) * hourly_rate * Decimal('2.0') 
                
                deduction = d_30 + d_1hr + d_query
            
            # Create/Update Summary
            summary, _ = AttendanceMonthlySummary.objects.update_or_create(
                employee=emp,
                month=month,
                defaults={
                    'total_late_30': late_30,
                    'total_late_1hr': late_1hr,
                    'total_query': query,
                    'total_late_days': total_late_days,
                    'salary_deduction_amount': deduction,
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
            
            late_deductions = Decimal('0.00')
            absent_deductions = Decimal('0.00')
            attendance_deduction = Decimal('0.00')
            
            # Use processed monthly summary
            summary = AttendanceMonthlySummary.objects.filter(employee=emp, month=month).first()
            
            if summary and summary.is_processed:
                late_deductions = summary.salary_deduction_amount
                attendance_deduction = late_deductions # + absent_deductions if available
                
            # If no summary, maybe warning? Or strict 0.
            
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
