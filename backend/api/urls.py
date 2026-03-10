from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, DepartmentViewSet,
    FixedEmployeeViewSet, KPITemplateViewSet, KPITemplateItemViewSet,
    FixedEmployeeKPIViewSet,
    FixedPerformanceSummaryViewSet, AppraisalViewSet, AuditLogViewSet,
    JobRoleViewSet, AttendanceUploadViewSet, FixedAttendanceLogViewSet, FixedAttendanceSummaryViewSet,
    SalaryStructureViewSet, FixedPayrollRunViewSet, FixedPayrollRecordViewSet, BranchViewSet,
    FixedAttendanceMonthlySummaryViewSet, ExpenseCategoryViewSet, ExpenseViewSet,
    FixedLeaveTypeViewSet, FixedLeaveRequestViewSet, ResignationViewSet,
    FixedEmployeeDocumentViewSet, FixedHRTicketViewSet, KnowledgeCategoryViewSet, KnowledgeArticleViewSet,
    FixedOnboardingGuideViewSet, FixedOnboardingProgressViewSet, AIFAQViewSet,
    ChannelViewSet, FixedMessageViewSet,
    AdminSettingsViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'employees', FixedEmployeeViewSet, basename='employees')
router.register(r'kpi-templates', KPITemplateViewSet)
router.register(r'kpi-template-items', KPITemplateItemViewSet)
router.register(r'employee-kpis', FixedEmployeeKPIViewSet, basename='employee-kpis')
router.register(r'performance-summaries', FixedPerformanceSummaryViewSet, basename='performance-summaries')
router.register(r'appraisals', AppraisalViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'job-roles', JobRoleViewSet)
router.register(r'attendance-uploads', AttendanceUploadViewSet)
router.register(r'attendance-logs', FixedAttendanceLogViewSet, basename='attendance-logs')
router.register(r'attendance-summaries', FixedAttendanceSummaryViewSet, basename='attendance-summaries')
router.register(r'attendance-monthly-summaries', FixedAttendanceMonthlySummaryViewSet, basename='attendance-monthly-summaries')
router.register(r'salary-structures', SalaryStructureViewSet)
router.register(r'payroll-runs', FixedPayrollRunViewSet, basename='payroll-runs')
router.register(r'payroll-records', FixedPayrollRecordViewSet, basename='payroll-records')
router.register(r'branches', BranchViewSet)
router.register(r'expense-categories', ExpenseCategoryViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'leave-types', FixedLeaveTypeViewSet, basename='leave-types')
router.register(r'leave-requests', FixedLeaveRequestViewSet, basename='leave-requests')
router.register(r'resignations', ResignationViewSet)
router.register(r'employee-documents', FixedEmployeeDocumentViewSet, basename='employee-documents')
router.register(r'hr-tickets', FixedHRTicketViewSet, basename='hr-tickets')
router.register(r'knowledge-categories', KnowledgeCategoryViewSet)
router.register(r'knowledge-articles', KnowledgeArticleViewSet)
router.register(r'onboarding-guides', FixedOnboardingGuideViewSet, basename='onboarding-guides')
router.register(r'onboarding-progress', FixedOnboardingProgressViewSet, basename='onboarding-progress')
router.register(r'ai-faq', AIFAQViewSet, basename='ai-faq')
router.register(r'channels', ChannelViewSet, basename='channels')
router.register(r'messages', FixedMessageViewSet, basename='messages')
router.register(r'admin-settings', AdminSettingsViewSet, basename='admin-settings')

urlpatterns = [
    path('', include(router.urls)),
]
