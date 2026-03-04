from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, DepartmentViewSet, EmployeeViewSet,
    KPITemplateViewSet, KPITemplateItemViewSet,
    EmployeeKPIViewSet,
    PerformanceSummaryViewSet, AppraisalViewSet, AuditLogViewSet,
    JobRoleViewSet, AttendanceUploadViewSet, AttendanceLogViewSet, AttendanceSummaryViewSet,
    SalaryStructureViewSet, PayrollRunViewSet, PayrollRecordViewSet, BranchViewSet,
    AttendanceMonthlySummaryViewSet, ExpenseCategoryViewSet, ExpenseViewSet,
    LeaveTypeViewSet, LeaveRequestViewSet, ResignationViewSet,
    EmployeeDocumentViewSet, HRTicketViewSet, KnowledgeCategoryViewSet, KnowledgeArticleViewSet,
    OnboardingGuideViewSet, OnboardingProgressViewSet, AIFAQViewSet
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
router.register(r'attendance-logs', AttendanceLogViewSet)
router.register(r'attendance-summaries', AttendanceSummaryViewSet)
router.register(r'attendance-monthly-summaries', AttendanceMonthlySummaryViewSet)
router.register(r'salary-structures', SalaryStructureViewSet)
router.register(r'payroll-runs', PayrollRunViewSet)
router.register(r'payroll-records', PayrollRecordViewSet)
router.register(r'branches', BranchViewSet)
router.register(r'expense-categories', ExpenseCategoryViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'leave-types', LeaveTypeViewSet)
router.register(r'leave-requests', LeaveRequestViewSet)
router.register(r'resignations', ResignationViewSet)
router.register(r'employee-documents', EmployeeDocumentViewSet)
router.register(r'hr-tickets', HRTicketViewSet)
router.register(r'knowledge-categories', KnowledgeCategoryViewSet)
router.register(r'knowledge-articles', KnowledgeArticleViewSet)
router.register(r'onboarding-guides', OnboardingGuideViewSet)
router.register(r'onboarding-progress', OnboardingProgressViewSet)
router.register(r'ai-faq', AIFAQViewSet, basename='ai-faq')

urlpatterns = [
    path('', include(router.urls)),
]
