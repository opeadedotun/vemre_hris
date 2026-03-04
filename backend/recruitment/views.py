from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import JobPosting, Applicant, Interview, Assessment
from .serializers import (
    JobPostingSerializer, 
    ApplicantSerializer, 
    InterviewSerializer, 
    AssessmentSerializer
)

class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all().order_by('-created_at')
    serializer_class = JobPostingSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return JobPosting.objects.filter(status='OPEN', is_public=True).order_by('-created_at')
        return JobPosting.objects.all().order_by('-created_at')

class ApplicantViewSet(viewsets.ModelViewSet):
    queryset = Applicant.objects.all().order_by('-created_at')
    serializer_class = ApplicantSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        applicant = self.get_object()
        new_status = request.data.get('status')
        if new_status in dict(Applicant.STATUS_CHOICES):
            applicant.status = new_status
            applicant.save()
            return Response({'status': 'status updated'})
        return Response({'error': 'invalid status'}, status=status.HTTP_400_BAD_REQUEST)

class InterviewViewSet(viewsets.ModelViewSet):
    queryset = Interview.objects.all().order_by('-date_time')
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]

class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.all().order_by('-taken_at')
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]
