from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.http import HttpResponse
from django.utils import timezone
from .models import JobPosting, Applicant, Interview, Assessment
from .serializers import JobPostingSerializer, ApplicantSerializer, InterviewSerializer, AssessmentSerializer
from api.utils.email_sender import send_email_with_attachment
from api.utils.pdf_generator import generate_offer_letter_pdf
import os
import re


def extract_email_from_resume(file_path):
    if not file_path or not os.path.exists(file_path):
        return None

    ext = os.path.splitext(file_path)[1].lower()
    text = ''

    try:
        if ext == '.pdf':
            try:
                from pypdf import PdfReader
            except Exception:
                return None
            reader = PdfReader(file_path)
            for page in reader.pages:
                page_text = page.extract_text() or ''
                text += f"\n{page_text}"
        elif ext == '.docx':
            try:
                from docx import Document
            except Exception:
                return None
            doc = Document(file_path)
            for para in doc.paragraphs:
                text += f"\n{para.text}"
    except Exception:
        return None

    if not text:
        return None

    emails = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    return emails[0] if emails else None


def resolve_candidate_email(applicant):
    cv_email = None
    if applicant.resume and hasattr(applicant.resume, 'path'):
        cv_email = extract_email_from_resume(applicant.resume.path)
    if applicant.email:
        return applicant.email, cv_email
    return cv_email, cv_email


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
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if getattr(self.request.user, 'role', None) == 'ADMIN':
            return Applicant.objects.select_related('job_posting', 'job_posting__department').all().order_by('-created_at')
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

            email_sent = None
            email_error = None
            if new_status == 'REJECTED':
                candidate_email, cv_email = resolve_candidate_email(applicant)
                if not candidate_email:
                    email_error = 'No candidate email found in application or CV.'
                else:
                    subject = f"Application Update - {applicant.job_posting.title}"
                    body = (
                        f"Dear {applicant.first_name},\n\n"
                        "Thank you for your interest in joining our team. After careful consideration, "
                        "we will not be moving forward with your application at this time.\n\n"
                        "We appreciate the time you took to apply and encourage you to apply for future "
                        "opportunities with us.\n\n"
                        "Best regards,\nHuman Resources Department"
                    )
                    email_sent = send_email_with_attachment(subject, body, candidate_email)
                    if not email_sent:
                        email_error = 'Failed to send rejection email. Check server logs.'

            data = self.get_serializer(applicant).data
            if email_sent is not None:
                data['rejection_email_sent'] = email_sent
            if email_error:
                data['rejection_email_error'] = email_error
            return Response(data)
        return Response({'error': 'invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def offer_letter(self, request, pk=None):
        if getattr(request.user, 'role', None) != 'ADMIN':
            return Response({'detail': 'Only admin can generate offer letters.'}, status=status.HTTP_403_FORBIDDEN)
        applicant = self.get_object()
        cv_email = None
        if applicant.resume and hasattr(applicant.resume, 'path'):
            cv_email = extract_email_from_resume(applicant.resume.path)
        pdf_content = generate_offer_letter_pdf(applicant, cv_email=cv_email)
        response = HttpResponse(content_type='application/pdf')
        filename = f"Offer_Letter_{applicant.first_name}_{applicant.last_name}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response.write(pdf_content)
        return response

    @action(detail=True, methods=['post'])
    def send_offer_letter(self, request, pk=None):
        if getattr(request.user, 'role', None) != 'ADMIN':
            return Response({'detail': 'Only admin can send offer letters.'}, status=status.HTTP_403_FORBIDDEN)
        applicant = self.get_object()
        candidate_email, cv_email = resolve_candidate_email(applicant)
        if not candidate_email:
            return Response({'error': 'No candidate email found in application or CV.'}, status=status.HTTP_400_BAD_REQUEST)

        pdf_content = generate_offer_letter_pdf(applicant, cv_email=cv_email)
        subject = f"Offer Letter - {applicant.job_posting.title}"
        body = (
            f"Dear {applicant.first_name},\n\n"
            "Congratulations. Please find your offer letter attached. "
            "Kindly review and reply to confirm your acceptance.\n\n"
            "Best regards,\nHuman Resources Department"
        )
        filename = f"Offer_Letter_{applicant.first_name}_{applicant.last_name}.pdf"
        success = send_email_with_attachment(subject, body, candidate_email, pdf_content, filename)

        if success:
            return Response({'message': f"Offer letter sent successfully to {candidate_email}.", 'email': candidate_email})
        return Response({'error': 'Failed to send offer letter. Check server logs.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InterviewViewSet(viewsets.ModelViewSet):
    queryset = Interview.objects.all().order_by('-date_time')
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]


class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.all().order_by('-taken_at')
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]
