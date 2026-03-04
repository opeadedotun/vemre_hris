from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobPostingViewSet, ApplicantViewSet, InterviewViewSet, AssessmentViewSet

router = DefaultRouter()
router.register(r'jobs', JobPostingViewSet)
router.register(r'applicants', ApplicantViewSet)
router.register(r'interviews', InterviewViewSet)
router.register(r'assessments', AssessmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
