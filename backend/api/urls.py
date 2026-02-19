from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, DepartmentViewSet, EmployeeViewSet,
    KPITemplateViewSet, KPITemplateItemViewSet,
    EmployeeKPIViewSet,
    PerformanceSummaryViewSet, AppraisalViewSet, AuditLogViewSet,
    JobRoleViewSet, AttendanceUploadViewSet, AttendanceSummaryViewSet,
    SalaryStructureViewSet, PayrollRunViewSet, PayrollRecordViewSet, BranchViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'kpi-templates', KPITemplateViewSet)
router.register(r'kpi-template-items', KPITemplateItemViewSet)
router.register(r'employee-kpis', EmployeeKPIViewSet)
router.register(r'performance-summaries', PerformanceSummaryViewSet)
router.register(r'appraisals', AppraisalViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'job-roles', JobRoleViewSet)
router.register(r'attendance-uploads', AttendanceUploadViewSet)
router.register(r'attendance-summaries', AttendanceSummaryViewSet)
router.register(r'salary-structures', SalaryStructureViewSet)
router.register(r'payroll-runs', PayrollRunViewSet)
router.register(r'payroll-records', PayrollRecordViewSet)
router.register(r'branches', BranchViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
