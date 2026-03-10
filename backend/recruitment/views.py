from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import JobPosting, Applicant, Interview, Assessment
from .serializers import JobPostingSerializer, ApplicantSerializer, InterviewSerializer, AssessmentSerializer


class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all().order_by('-created_at')
    serializer_class = JobPostingSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = JobPosting.objects.all().order_by('-created_at')
        if user.is_authenticated and getattr(user, 'role', None) == 'ADMIN':
            return qs
        return qs.filter(status='OPEN', is_public=True).order_by('-created_at')

    def perform_create(self, serializer):
        is_public = serializer.validated_data.get('is_public', False)
        status_value = 'OPEN' if is_public else 'DRAFT'
        serializer.save(status=status_value)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        if getattr(request.user, 'role', None) != 'ADMIN':
            return Response({'detail': 'Only admin can publish jobs.'}, status=status.HTTP_403_FORBIDDEN)
        job = self.get_object()
        job.status = 'OPEN'
        job.is_public = True
        job.save(update_fields=['status', 'is_public', 'updated_at'])
        return Response(self.get_serializer(job).data)


class ApplicantViewSet(viewsets.ModelViewSet):
    queryset = Applicant.objects.all().order_by('-created_at')
    serializer_class = ApplicantSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if getattr(self.request.user, 'role', None) == 'ADMIN':
            return Applicant.objects.select_related('job_posting').all().order_by('-created_at')
        return Applicant.objects.none()

    def perform_create(self, serializer):
        job = serializer.validated_data.get('job_posting')
        if not job or not job.is_public or job.status != 'OPEN':
            return Response({'error': 'This job is not accepting applications.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(status='APPLIED')

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        if getattr(request.user, 'role', None) != 'ADMIN':
            return Response({'error': 'Only admin can change applicant status'}, status=status.HTTP_403_FORBIDDEN)
        applicant = self.get_object()
        new_status = request.data.get('status')
        if new_status in dict(Applicant.STATUS_CHOICES):
            applicant.status = new_status
            applicant.save(update_fields=['status', 'updated_at'])
            return Response(self.get_serializer(applicant).data)
        return Response({'error': 'invalid status'}, status=status.HTTP_400_BAD_REQUEST)


class InterviewViewSet(viewsets.ModelViewSet):
    queryset = Interview.objects.all().order_by('-date_time')
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]


class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.all().order_by('-taken_at')
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

