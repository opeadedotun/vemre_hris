from rest_framework import viewsets, permissions, status
from datetime import time
from rest_framework.response import Response
from rest_framework.decorators import action
from decimal import Decimal
from .models import (
    User, Department, Employee, EmployeeKPI, PerformanceSummary, Appraisal,
    AuditLog, JobRole, KPITemplate, KPITemplateItem, AttendanceUpload,
    AttendanceLog, AttendanceSummary, AttendanceMonthlySummary, DisciplinaryAction,
    SalaryStructure, PayrollRun, PayrollRecord, Branch, ExpenseCategory, Expense,
    LeaveType, LeaveRequest, Resignation, EmployeeDocument, HRTicket, TicketMessage,
    KnowledgeCategory, KnowledgeArticle, KnowledgeVersion, OnboardingGuide, OnboardingProgress,
    AIQueryLog
)
from django.db.models import Q
from .serializers import (
    UserSerializer, DepartmentSerializer, EmployeeSerializer,
    EmployeeKPISerializer,
    PerformanceSummarySerializer, AppraisalSerializer, AuditLogSerializer,
    JobRoleSerializer, KPITemplateSerializer, KPITemplateItemSerializer,
    AttendanceUploadSerializer, AttendanceLogSerializer, AttendanceSummarySerializer, 
    AttendanceMonthlySummarySerializer, SalaryStructureSerializer, 
    PayrollRunSerializer, PayrollRecordSerializer, BranchSerializer,
    ExpenseCategorySerializer, ExpenseSerializer, LeaveTypeSerializer, 
    LeaveRequestSerializer, ResignationSerializer, EmployeeDocumentSerializer,
    HRTicketSerializer, TicketMessageSerializer,
    KnowledgeCategorySerializer, KnowledgeArticleSerializer, KnowledgeVersionSerializer,
    OnboardingGuideSerializer, OnboardingProgressSerializer, AIQueryLogSerializer
)
from .services.attendance import AttendanceEngine
from django.utils import timezone
from .utils.pdf_generator import generate_payslip_pdf
from .utils.email_sender import send_email_with_attachment
from .utils.geofencing import calculate_distance
from django.http import HttpResponse

def recalculate_employee_summary(emp, month):
    """Recalculate monthly attendance summary and deductions for a single employee."""
    logs = AttendanceLog.objects.filter(employee_code=emp.employee_code, date__startswith=month)
    if not logs.exists():
        # Clean up if no logs exist
        AttendanceMonthlySummary.objects.filter(employee=emp, month=month).delete()
        return

    engine = AttendanceEngine()
    
    # Counts
    present_days = logs.values('date').distinct().count()
    
    # Use employee-specific shift pattern if possible, else default
    emp_working_days = engine.get_working_days_in_month(month)
    if emp.job_role:
        emp_working_days = engine.get_working_days_in_month(month, emp.job_role.work_days_type)
    
    absent_days = max(0, emp_working_days - present_days)
    
    late_30 = logs.filter(late_category='LATE_30').count()
    late_1hr = logs.filter(late_category='LATE_1HR').count()
    query = logs.filter(late_category='QUERY').count()
    total_late_days = late_30 + late_1hr + query
    
    # Deduction Calculation: ONLY lateness, NO absence deduction
    late_deduction = Decimal('0.00')
    absent_deduction = Decimal('0.00')
    
    if emp.job_role and hasattr(emp.job_role, 'salary_structure'):
        struct = emp.job_role.salary_structure
        hourly_rate = struct.get_hourly_rate(emp_working_days)
        
        # New Lateness Policy:
        # First 5 mins ignored, 6-30 mins = 0.5hr, 31-60 mins = 1hr, >60 = proportional
        d_30 = Decimal(late_30) * hourly_rate * Decimal('0.5')
        d_1hr = Decimal(late_1hr) * hourly_rate * Decimal('1.0')
        
        # Handle QUERY (>60m) logs individually to be precise
        query_logs = logs.filter(late_category='QUERY')
        d_query = Decimal('0.00')
        for ql in query_logs:
            hours_late = Decimal(str(ql.late_minutes)) / Decimal('60.0')
            d_query += hours_late * hourly_rate
            
        late_deduction = d_30 + d_1hr + d_query
        
        # No absence deduction as per user request
        absent_deduction = Decimal('0.00')
    
    summary, _ = AttendanceMonthlySummary.objects.update_or_create(
        employee=emp,
        month=month,
        defaults={
            'total_late_30': late_30,
            'total_late_1hr': late_1hr,
            'total_query': query,
            'total_late_days': total_late_days,
            'absent_days': absent_days,
            'salary_deduction_amount': late_deduction,
            'absent_deduction_amount': absent_deduction,
            'is_processed': True,
            'processed_at': timezone.now()
        }
    )
    
    # Disciplinary Actions
    if total_late_days > 3:
            DisciplinaryAction.objects.get_or_create(
            employee=emp, month=month, action_type='QUERY_LETTER',
            defaults={'reason': f"Recorded {total_late_days} late days in {month}. Exceeded maximum of 3 late days per month."}
            )
    
    return summary

class IsAdminOrHR(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'HR']

class IsAccountant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'ACCOUNTANT']

class IsDepartmentHead(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['ADMIN', 'HR']:
            return True
        if request.user.role == 'MANAGER':
            try:
                emp = Employee.objects.get(email=request.user.email)
                if hasattr(obj, 'department'):
                    return obj.department == emp.department
                if hasattr(obj, 'category') and obj.category.department:
                    return obj.category.department == emp.department
            except Employee.DoesNotExist:
                return False
        return False

class IsStaffReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ['ADMIN', 'HR', 'MANAGER']

class AdminOnlyDelete(permissions.BasePermission):
    """
    Enforces that only Admin (Superadmin) can delete data.
    """
    def has_permission(self, request, view):
        if request.method == 'DELETE':
            return request.user.is_authenticated and request.user.role == 'ADMIN'
        return True

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
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]

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

        # Top Late Comers
        top_late = AttendanceSummary.objects.filter(month=current_month).order_by('-total_late_minutes')[:5]
        top_late_data = [{
            'name': a.employee.full_name,
            'minutes': a.total_late_minutes,
            'late_days': a.late_days
        } for a in top_late]

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
                "absent_days": attendance['total_absent'] or 0,
                "top_late_comers": top_late_data
            }
        })

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'CREATE', 'Department', instance.id)

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'CREATE', 'Employee', instance.id)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'UPDATE', 'Employee', instance.id)

    @action(detail=False, methods=['post'])
    def clock_in(self, request):
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if latitude is None or longitude is None:
            return Response({"error": "Location coordinates are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            employee = Employee.objects.get(email=request.user.email)
        except Employee.DoesNotExist:
            return Response({"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Find nearest branch
        branches = Branch.objects.all()
        nearest_branch = None
        min_distance = float('inf')
        
        for branch in branches:
            dist = calculate_distance(latitude, longitude, branch.latitude, branch.longitude)
            if dist < min_distance:
                min_distance = dist
                nearest_branch = branch
        
        if not nearest_branch:
             return Response({"error": "No branch offices configured for geofencing"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Make nearest_branch.radius an integer just to be safe if it's stored as Decimal
        is_within = float(min_distance) <= float(nearest_branch.radius)
        
        # Check if already clocked in today
        today = timezone.now().date()
        existing = AttendanceLog.objects.filter(employee=employee, date=today).first()
        
        if existing and existing.check_in:
            # If already clocked in, but no check out, we treat this as a check out?
            # Or just update check out if it's much later.
            if not existing.check_out:
                existing.check_out = timezone.now().time()
                existing.save()
                return Response({"message": "Clocked out successfully", "time": str(existing.check_out)})
            else:
                return Response({"error": "You have already clocked in and out today"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Determine lateness
        engine = AttendanceEngine()
        expected_start = time(8, 0) # Default
        if employee.job_role and employee.job_role.shift_start:
            expected_start = employee.job_role.shift_start
        
        check_in_time = timezone.now().time()
        late_minutes, category = engine.classify_lateness(check_in_time, expected_start)
        
        log = AttendanceLog.objects.create(
            employee=employee,
            employee_code=employee.employee_code,
            branch=nearest_branch,
            date=today,
            check_in=check_in_time,
            latitude=latitude,
            longitude=longitude,
            is_within_geofence=is_within,
            clock_in_device="Web App",
            late_minutes=late_minutes,
            late_category=category,
            status="PRESENT" if is_within else "OUT_OF_GEOFENCE"
        )
        
        # Trigger summary recalculation for the month
        month = today.strftime("%Y-%m")
        recalculate_employee_summary(employee, month)
        
        return Response({
            "message": "Clocked in successfully",
            "time": str(check_in_time),
            "within_geofence": is_within,
            "branch": nearest_branch.name
        })

    @action(detail=False, methods=['get'])
    def me(self, request):
        try:
            employee = Employee.objects.get(email=request.user.email)
            serializer = self.get_serializer(employee)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response({"error": "No employee profile found for this user"}, status=status.HTTP_404_NOT_FOUND)

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
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]
    filterset_fields = ['job_role']

class KPITemplateItemViewSet(viewsets.ModelViewSet):
    queryset = KPITemplateItem.objects.all()
    serializer_class = KPITemplateItemSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]

class EmployeeKPIViewSet(viewsets.ModelViewSet):
    queryset = EmployeeKPI.objects.all()
    serializer_class = EmployeeKPISerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]

    @action(detail=True, methods=['post'])
    def send_to_employee(self, request, pk=None):
        instance = self.get_object()
        emp = instance.employee
        if not emp.email:
            return Response({"error": "Employee does not have an email registered."}, status=status.HTTP_400_BAD_REQUEST)
        
        subject = f"Monthly KPI Update: {instance.month}"
        body = f"Dear {emp.full_name},\n\nYour KPI score for {instance.month} has been updated.\n\nKPI: {instance.template_item.kpi_name if instance.template_item else 'General'}\nScore: {instance.score_percentage}%\nWeighted Score: {instance.weighted_score}\n\nBest regards,\nHR Department"
        
        from .utils.email_sender import send_email_with_attachment
        success = send_email_with_attachment(subject, body, emp.email)
        if success:
            instance.is_sent = True
            instance.save()
            return Response({"message": f"KPI notification sent successfully to {emp.email}"})
        else:
            return Response({"error": "Failed to send email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def send_role_kpis(self, request):
        role_id = request.data.get('role_id')
        month = request.data.get('month')
        if not role_id or not month:
            return Response({"error": "role_id and month are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        kpis = EmployeeKPI.objects.filter(employee__job_role_id=role_id, month=month)
        if not kpis.exists():
            return Response({"error": "No KPIs found for this role and month."}, status=status.HTTP_404_NOT_FOUND)
        
        sent_count = 0
        for kpi in kpis:
            # Re-using the logic (could be structured better)
            emp = kpi.employee
            if emp.email:
                subject = f"Monthly KPI Update: {month}"
                body = f"Dear {emp.full_name},\n\nYour KPI score for {month} has been updated.\n\nKPI: {kpi.template_item.kpi_name if kpi.template_item else 'General'}\nScore: {kpi.score_percentage}%\nWeighted Score: {kpi.weighted_score}\n\nBest regards,\nHR Department"
                from .utils.email_sender import send_email_with_attachment
                if send_email_with_attachment(subject, body, emp.email):
                    kpi.is_sent = True
                    kpi.save()
                    sent_count += 1
        
        return Response({"message": f"KPIs sent to {sent_count} employees."})

class PerformanceSummaryViewSet(viewsets.ModelViewSet):
    queryset = PerformanceSummary.objects.all()
    serializer_class = PerformanceSummarySerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]

class AppraisalViewSet(viewsets.ModelViewSet):
    queryset = Appraisal.objects.all()
    serializer_class = AppraisalSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]

# Removed RoleKPITemplateViewSet as it is replaced by KPITemplateViewSet

class JobRoleViewSet(viewsets.ModelViewSet):
    queryset = JobRole.objects.all()
    serializer_class = JobRoleSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]

    def get_serializer_class(self):
        return JobRoleSerializer

class AttendanceUploadViewSet(viewsets.ModelViewSet):
    queryset = AttendanceUpload.objects.all().order_by('-uploaded_at')
    serializer_class = AttendanceUploadSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]

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
                'upload': None, # Explicitly null for manual entry
                'branch': branch,
                'check_in': ci,
                'check_out': co,
                'status': 'PRESENT',
                'late_minutes': late_mins,
                'late_category': late_category,
            }
        )
        
        # Trigger re-calculation for the summary table
        month = date[:7] # YYYY-MM
        recalculate_employee_summary(emp, month)
        
        action_text = 'created' if created else 'updated'
        return Response({"message": f"Attendance log {action_text} for {emp.full_name} on {date}. Summary updated."}, status=status.HTTP_201_CREATED)

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

    @action(detail=False, methods=['post'])
    def send_query_email(self, request):
        """Send a generated query letter to the employee's official email."""
        employee_id = request.data.get('employee')
        letter_body = request.data.get('letter')
        month = request.data.get('month')

        if not employee_id or not letter_body:
            return Response({"error": "employee and letter body are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            emp = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response({"error": "Invalid employee ID."}, status=status.HTTP_400_BAD_REQUEST)

        if not emp.email:
            return Response({"error": f"Employee {emp.full_name} does not have an email registered."}, status=status.HTTP_400_BAD_REQUEST)

        subject = f"QUERY LETTER: EXCESSIVE LATENESS - {month.upper()}"
        success = send_email_with_attachment(subject, letter_body, emp.email)

        if success:
            return Response({"message": f"Query letter sent successfully to {emp.email}"})
        else:
            return Response({"error": "Failed to send email. Check server logs for details."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AttendanceSummaryViewSet(viewsets.ModelViewSet):
    queryset = AttendanceSummary.objects.all()
    serializer_class = AttendanceSummarySerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]
    filterset_fields = ['month', 'employee']

    @action(detail=False, methods=['post'])
    def process_monthly(self, request):
        month = request.data.get('month')
        branch_id = request.data.get('branch')  # Optional: process per-branch
        if not month:
            return Response({"error": "Month is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        employees = Employee.objects.filter(is_active=True)
        # If branch_id is provided, filter employees by branch (through their attendance logs)
        if branch_id:
            emp_codes = AttendanceLog.objects.filter(
                branch_id=branch_id, date__startswith=month
            ).values_list('employee_code', flat=True).distinct()
            employees = employees.filter(employee_code__in=emp_codes)
        
        for emp in employees:
            recalculate_employee_summary(emp, month)

        return Response({"message": "Monthly attendance processed successfully."}, status=status.HTTP_200_OK)

class AttendanceMonthlySummaryViewSet(viewsets.ModelViewSet):
    queryset = AttendanceMonthlySummary.objects.all()
    serializer_class = AttendanceMonthlySummarySerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]
    filterset_fields = ['month', 'employee']


class SalaryStructureViewSet(viewsets.ModelViewSet):
    queryset = SalaryStructure.objects.all()
    serializer_class = SalaryStructureSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]

class PayrollRunViewSet(viewsets.ModelViewSet):
    queryset = PayrollRun.objects.all().order_by('-created_at')
    serializer_class = PayrollRunSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]

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
            
            other = salary.other_allowances
            total_allowances = other
            
            monthly_gross = salary.basic_salary + total_allowances
            
            # Pension: 8% of Basic – only if enabled for this role
            pension = salary.basic_salary * Decimal('0.08') if salary.has_pension else Decimal('0.00')
            # NHF: 2.5% of Basic – only if enabled for this role
            nhf = salary.basic_salary * Decimal('0.025') if salary.has_nhf else Decimal('0.00')
            
            if salary.use_manual_tax:
                tax_deduction = salary.manual_tax_amount
            else:
                from .utils.tax_utils import calculate_nigerian_tax
                tax_deduction = calculate_nigerian_tax(monthly_gross, pension, nhf)
            
            # Net Salary = Gross - Lates - Tax - Pension - NHF
            net_salary = monthly_gross - late_deductions - tax_deduction - pension - nhf
            
            records.append(PayrollRecord(
                payroll_run=payroll_run,
                employee=emp,
                basic_salary=salary.basic_salary,
                other_allowances=other,
                total_allowances=total_allowances,
                late_deductions=late_deductions,
                absent_deductions=absent_deductions,
                attendance_deduction=attendance_deduction,
                pension_deduction=pension,
                nhf_deduction=nhf,
                tax_deduction=tax_deduction,
                net_salary=net_salary
            ))
            
        PayrollRecord.objects.bulk_create(records)
        payroll_run.processed_by = request.user
        payroll_run.save()
        
        return Response({"message": f"Successfully processed payroll for {len(records)} employees.", "id": payroll_run.id}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def create_manual_record(self, request):
        employee_id = request.data.get('employee_id')
        days_worked = request.data.get('days_worked')
        month_str = request.data.get('month')
        daily_rate = request.data.get('daily_rate', 2000)
        disciplinary_days = request.data.get('disciplinary_days', 0)
        lateness_hours = request.data.get('lateness_hours', 0)

        if not all([employee_id, days_worked, month_str]):
            return Response({"error": "employee_id, days_worked and month are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create payroll run for the month
        payroll_run, created = PayrollRun.objects.get_or_create(
            month=month_str,
            defaults={'status': 'DRAFT'}
        )

        try:
            emp = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response({"error": "Invalid employee ID."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            days = Decimal(str(days_worked))
            rate = Decimal(str(daily_rate))
            disc_days = Decimal(str(disciplinary_days or 0))
            late_hrs = Decimal(str(lateness_hours or 0))
        except (ValueError, TypeError):
            return Response({"error": "Invalid number for days, rate, or deductions."}, status=status.HTTP_400_BAD_REQUEST)

        gross_pay = days * rate
        disc_deduction = disc_days * rate
        late_deduction = late_hrs * (rate / Decimal('8')) # Assume 8hr workday
        
        net_salary = gross_pay - disc_deduction - late_deduction

        record = PayrollRecord.objects.create(
            payroll_run=payroll_run,
            employee=emp,
            basic_salary=gross_pay,
            attendance_deduction=disc_deduction,
            late_deductions=late_deduction,
            net_salary=net_salary
        )

        return Response({
            "message": f"Manual payroll record created for {emp.full_name}.",
            "record_id": record.id
        }, status=status.HTTP_201_CREATED)

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
            'Employee', 'Basic Salary', 'Other Allowances', 'Total Allowances', 
            'Late Ded.', 'Absent Ded.', 'Tax Deduction', 'Net Salary'
        ])
        
        for r in payroll_run.records.select_related('employee').all():
            writer.writerow([
                r.employee.full_name,
                r.basic_salary, r.other_allowances,
                r.total_allowances, r.late_deductions, r.absent_deductions,
                r.total_allowances, r.late_deductions, r.absent_deductions,
                r.tax_deduction, r.net_salary
            ])
        
        return response

class PayrollRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PayrollRecord.objects.all()
    serializer_class = PayrollRecordSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]
    filterset_fields = ['payroll_run', 'employee']

    @action(detail=True, methods=['get'])
    def payslip_pdf(self, request, pk=None):
        record = self.get_object()
        pdf_content = generate_payslip_pdf(record)
        
        response = HttpResponse(content_type='application/pdf')
        filename = f"Payslip_{record.employee.employee_code}_{record.payroll_run.month}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response.write(pdf_content)
        return response

    @action(detail=True, methods=['post'])
    def send_payslip(self, request, pk=None):
        record = self.get_object()
        emp = record.employee
        
        if not emp.email:
            return Response({"error": "Employee does not have an email."}, status=status.HTTP_400_BAD_REQUEST)
        
        pdf_content = generate_payslip_pdf(record)
        subject = f"Payslip for {record.payroll_run.month}"
        body = f"Dear {emp.full_name},\n\nPlease find attached your payslip for the month of {record.payroll_run.month}.\n\nBest regards,\nHR Department"
        filename = f"Payslip_{record.payroll_run.month}.pdf"
        
        success = send_email_with_attachment(subject, body, emp.email, pdf_content, filename)
        
        if success:
            return Response({"message": f"Payslip sent successfully to {emp.email}"})
        else:
            return Response({"error": "Failed to send email. Check server logs."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]

class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAdminOrHR]

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]
    filterset_fields = ['employee', 'status', 'category']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'HR', 'ACCOUNTANT']:
            return Expense.objects.all().order_by('-date')
        return Expense.objects.filter(employee__email=user.email).order_by('-date')

    def perform_create(self, serializer):
        user = self.request.user
        try:
            employee = Employee.objects.get(email=user.email)
            serializer.save(employee=employee)
        except Employee.DoesNotExist:
            # Fallback for admins who might not have an employee record, though they should
            if user.role == 'ADMIN':
                serializer.save()
            else:
                from rest_framework import serializers
                raise serializers.ValidationError({"detail": "Employee profile not found for this user."})
        
        log_action(self.request.user, 'CREATE', 'Expense', serializer.instance.id)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdminOrHR])
    def approve(self, request, pk=None):
        instance = self.get_object()
        if instance.status != 'PENDING':
            return Response({"error": "Only pending expenses can be approved."}, status=status.HTTP_400_BAD_REQUEST)
        instance.status = 'APPROVED'
        instance.approved_by = request.user
        instance.approved_at = timezone.now()
        instance.save()
        log_action(request.user, 'APPROVE', 'Expense', instance.id)
        return Response({"message": "Expense approved."})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAccountant])
    def reimburse(self, request, pk=None):
        instance = self.get_object()
        if instance.status != 'APPROVED':
            return Response({"error": "Only approved expenses can be reimbursed."}, status=status.HTTP_400_BAD_REQUEST)
        
        reference = request.data.get('payment_reference')
        if not reference:
            return Response({"error": "Payment reference is required."}, status=status.HTTP_400_BAD_REQUEST)

        instance.status = 'PAID'
        instance.reimbursed_by = request.user
        instance.reimbursed_at = timezone.now()
        instance.payment_reference = reference
        instance.save()
        
        log_action(request.user, 'REIMBURSE', 'Expense', instance.id)
        return Response({"message": f"Expense of {instance.amount} marked as PAID."})

class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAdminOrHR]

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyDelete]
    filterset_fields = ['employee', 'status', 'leave_type']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'HR']:
            return LeaveRequest.objects.all().order_by('-start_date')
        return LeaveRequest.objects.filter(employee__email=user.email).order_by('-start_date')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['ADMIN', 'HR']:
            try:
                employee = Employee.objects.get(email=user.email)
                serializer.save(employee=employee)
            except Employee.DoesNotExist:
                serializer.save()
        else:
            serializer.save()
        log_action(self.request.user, 'CREATE', 'LeaveRequest', serializer.instance.id)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'HR']:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        instance = self.get_object()
        instance.status = 'APPROVED'
        instance.approved_by = request.user
        instance.approved_at = timezone.now()
        instance.save()
        return Response({"message": "Leave request approved."})

    @action(detail=True, methods=['get'])
    def approval_letter(self, request, pk=None):
        instance = self.get_object()
        if instance.status != 'APPROVED':
            return Response({"error": "Letter can only be generated for approved leaves."}, status=status.HTTP_400_BAD_REQUEST)
        
        from .utils.pdf_generator import generate_leave_approval_pdf
        pdf_content = generate_leave_approval_pdf(instance)
        
        response = HttpResponse(content_type='application/pdf')
        filename = f"Leave_Approval_{instance.employee.employee_code}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response.write(pdf_content)
        return response

class ResignationViewSet(viewsets.ModelViewSet):
    queryset = Resignation.objects.all().order_by('-resignation_date')
    serializer_class = ResignationSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'HR']:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        instance = self.get_object()
        instance.status = 'APPROVED'
        instance.approved_by = request.user
        instance.approved_at = timezone.now()
        instance.save()
        return Response({"message": "Resignation approved."})

    @action(detail=True, methods=['get'])
    def exit_letter(self, request, pk=None):
        instance = self.get_object()
        if instance.status != 'APPROVED':
            return Response({"error": "Letter can only be generated for approved resignations."}, status=status.HTTP_400_BAD_REQUEST)

        from .utils.pdf_generator import generate_resignation_acceptance_pdf
        pdf_content = generate_resignation_acceptance_pdf(instance)
        
        response = HttpResponse(content_type='application/pdf')
        filename = f"Exit_Acceptance_{instance.employee.employee_code}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response.write(pdf_content)
        return response

class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    queryset = EmployeeDocument.objects.all()
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'HR']:
            return EmployeeDocument.objects.all()
        # Employees can only see their own documents
        return EmployeeDocument.objects.filter(employee__email=user.email)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
        log_action(self.request.user, 'UPLOAD', 'EmployeeDocument', serializer.instance.id)

class HRTicketViewSet(viewsets.ModelViewSet):
    queryset = HRTicket.objects.all()
    serializer_class = HRTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'HR']:
            return HRTicket.objects.all()
        # Employees can only see their own tickets
        return HRTicket.objects.filter(employee__email=user.email)

    def perform_create(self, serializer):
        # Automatically link to the logged-in employee if they are not Admin/HR
        user = self.request.user
        if user.role not in ['ADMIN', 'HR']:
            try:
                employee = Employee.objects.get(email=user.email)
                serializer.save(employee=employee)
            except Employee.DoesNotExist:
                # Handle case where user has no employee profile
                serializer.save()
        else:
            serializer.save()
        log_action(self.request.user, 'CREATE', 'HRTicket', serializer.instance.id)

    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(ticket=ticket, sender=request.user)
            # Update ticket status if HR replies
            if request.user.role in ['ADMIN', 'HR'] and ticket.status == 'OPEN':
                ticket.status = 'IN_PROGRESS'
                ticket.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class KnowledgeCategoryViewSet(viewsets.ModelViewSet):
    queryset = KnowledgeCategory.objects.all()
    serializer_class = KnowledgeCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffReadOnly, IsDepartmentHead, AdminOnlyDelete]

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'CREATE', 'KnowledgeCategory', instance.id)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'UPDATE', 'KnowledgeCategory', instance.id)

class KnowledgeArticleViewSet(viewsets.ModelViewSet):
    queryset = KnowledgeArticle.objects.all()
    serializer_class = KnowledgeArticleSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffReadOnly, IsDepartmentHead, AdminOnlyDelete]
    lookup_field = 'slug'

    def get_queryset(self):
        user = self.request.user
        queryset = KnowledgeArticle.objects.all()
        
        # Role-based visibility
        if user.role not in ['ADMIN', 'HR', 'MANAGER']:
            queryset = queryset.filter(is_published=True)
            
        # Advanced Search & Filters
        search_query = self.request.query_params.get('search')
        category_id = self.request.query_params.get('category')
        department_id = self.request.query_params.get('department')
        
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) | 
                Q(content__icontains=search_query)
            )
            
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        if department_id:
            queryset = queryset.filter(category__department_id=department_id)
            
        return queryset.distinct()

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        log_action(self.request.user, 'CREATE', 'KnowledgeArticle', instance.id)

    def perform_update(self, serializer):
        old_instance = self.get_object()
        new_content = serializer.validated_data.get('content')
        
        if new_content and new_content != old_instance.content:
            # Create a version snapshot of the OLD content
            KnowledgeVersion.objects.create(
                article=old_instance,
                version_number=old_instance.version_number,
                content_snapshot=old_instance.content,
                edited_by=self.request.user
            )
            # Increment version number for the new save
            serializer.save(version_number=old_instance.version_number + 1)
        else:
            serializer.save()
            
        log_action(self.request.user, 'UPDATE', 'KnowledgeArticle', serializer.instance.id)

    @action(detail=True, methods=['get'])
    def history(self, request, slug=None):
        article = self.get_object()
        versions = article.versions.all()
        serializer = KnowledgeVersionSerializer(versions, many=True)
        return Response(serializer.data)

class OnboardingGuideViewSet(viewsets.ModelViewSet):
    queryset = OnboardingGuide.objects.all()
    serializer_class = OnboardingGuideSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]

class OnboardingProgressViewSet(viewsets.ModelViewSet):
    queryset = OnboardingProgress.objects.all()
    serializer_class = OnboardingProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Employees only see their own progress
        return OnboardingProgress.objects.filter(employee__email=self.request.user.email)

    @action(detail=False, methods=['get'])
    def my_guide(self, request):
        try:
            employee = Employee.objects.get(email=request.user.email)
            if not employee.job_role:
                return Response({"detail": "No job role assigned"}, status=404)
            
            guide = OnboardingGuide.objects.filter(job_role=employee.job_role).first()
            if not guide:
                return Response({"detail": "No onboarding guide for your role"}, status=404)
            
            progress, created = OnboardingProgress.objects.get_or_create(
                employee=employee,
                guide=guide
            )
            
            serializer = OnboardingProgressSerializer(progress)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response({"detail": "Employee profile not found"}, status=404)

    @action(detail=True, methods=['patch'])
    def update_progress(self, request, pk=None):
        progress = self.get_object()
        completed_items = request.data.get('completed_items', [])
        
        progress.completed_items = completed_items
        
        # Check if all items in guide.checklist_json are completed
        total_items = len(progress.guide.checklist_json)
        if total_items > 0 and len(completed_items) >= total_items:
            progress.is_completed = True
            progress.completed_at = timezone.now()
        else:
            progress.is_completed = False
            progress.completed_at = None
            
        progress.save()
        log_action(request.user, 'UPDATE', 'OnboardingProgress', progress.id)
        return Response(OnboardingProgressSerializer(progress).data)

import re
import html

class AIFAQViewSet(viewsets.ViewSet):
    """AI-powered FAQ assistant that searches knowledge articles."""
    permission_classes = [permissions.IsAuthenticated]

    FALLBACK_MESSAGE = "No documentation found matching your query. Please contact HR for further assistance."

    STOP_WORDS = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to',
                  'for', 'of', 'and', 'or', 'not', 'it', 'this', 'that', 'with', 'from',
                  'by', 'as', 'be', 'has', 'have', 'had', 'do', 'does', 'did', 'but',
                  'if', 'how', 'what', 'when', 'where', 'who', 'which', 'can', 'will',
                  'my', 'i', 'me', 'we', 'you', 'our', 'your', 'about'}

    def _strip_html(self, text):
        """Remove HTML tags and decode entities."""
        clean = re.sub(r'<[^>]+>', ' ', text)
        return html.unescape(clean).strip()

    def _tokenize(self, query):
        """Extract meaningful keywords from query."""
        words = re.findall(r'\w+', query.lower())
        return [w for w in words if w not in self.STOP_WORDS and len(w) > 2]

    def _extract_snippet(self, content, keywords, max_len=200):
        """Extract a snippet around the first keyword match."""
        plain = self._strip_html(content)
        text_lower = plain.lower()

        for kw in keywords:
            pos = text_lower.find(kw)
            if pos != -1:
                start = max(0, pos - 80)
                end = min(len(plain), pos + max_len - 80)
                snippet = plain[start:end].strip()
                if start > 0:
                    snippet = '...' + snippet
                if end < len(plain):
                    snippet = snippet + '...'
                return snippet

        # No keyword match found, return beginning
        return (plain[:max_len] + '...') if len(plain) > max_len else plain

    def _score_article(self, article, keywords):
        """Score an article by keyword relevance. Title matches weighted 3x."""
        score = 0
        title_lower = article.title.lower()
        content_lower = self._strip_html(article.content).lower()

        for kw in keywords:
            if kw in title_lower:
                score += 3
            if kw in content_lower:
                score += 1
        return score

    @action(detail=False, methods=['post'])
    def ask(self, request):
        query = request.data.get('query', '').strip()
        if not query:
            return Response({'error': 'Query is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(query) > 500:
            return Response({'error': 'Query too long. Max 500 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        keywords = self._tokenize(query)

        # Build role-based queryset
        queryset = KnowledgeArticle.objects.all()
        if user.role not in ['ADMIN', 'HR', 'MANAGER']:
            queryset = queryset.filter(is_published=True)

        # Search using Q filters across all keywords
        if keywords:
            q_filter = Q()
            for kw in keywords:
                q_filter |= Q(title__icontains=kw) | Q(content__icontains=kw)
            queryset = queryset.filter(q_filter).distinct()
        else:
            queryset = queryset.none()

        # Score and rank
        scored = []
        for article in queryset[:50]:  # Cap to 50 for performance
            score = self._score_article(article, keywords)
            if score > 0:
                scored.append((score, article))

        scored.sort(key=lambda x: x[0], reverse=True)
        top_results = scored[:3]

        # Build response
        if not top_results:
            response_data = {
                'answer': self.FALLBACK_MESSAGE,
                'articles': [],
                'has_results': False
            }
        else:
            articles_data = []
            for score, article in top_results:
                articles_data.append({
                    'id': article.id,
                    'title': article.title,
                    'slug': article.slug,
                    'category_name': article.category.name if article.category else None,
                    'snippet': self._extract_snippet(article.content, keywords),
                    'relevance_score': score
                })

            # Summary from top article
            top_snippet = articles_data[0]['snippet']
            answer = f"Based on our documentation, here's what we found:\n\n{top_snippet}"
            if len(articles_data) > 1:
                answer += f"\n\nWe also found {len(articles_data) - 1} more related article(s) below."

            response_data = {
                'answer': answer,
                'articles': articles_data,
                'has_results': True
            }

        # Log the query
        AIQueryLog.objects.create(
            user=user,
            query=query,
            response_summary=response_data['answer'][:500],
            articles_returned=[a['id'] for a in response_data['articles']]
        )

        return Response(response_data)

    @action(detail=False, methods=['get'])
    def suggested(self, request):
        """Return suggested/popular questions."""
        suggestions = [
            "What is the leave policy?",
            "How do I submit an expense claim?",
            "What are the working hours?",
            "How do I reset my password?",
            "What is the dress code policy?",
            "How do I request a salary advance?",
        ]
        return Response({'suggestions': suggestions})
class AttendanceLogViewSet(viewsets.ModelViewSet):
    queryset = AttendanceLog.objects.all().order_by('-date', '-check_in')
    serializer_class = AttendanceLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['employee', 'date', 'employee_code']
