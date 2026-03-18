from rest_framework import serializers
from .models import JobPosting, Applicant, Interview, Assessment
import os


class JobPostingSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    applicant_count = serializers.IntegerField(source='applicants.count', read_only=True)

    class Meta:
        model = JobPosting
        fields = '__all__'


class InterviewSerializer(serializers.ModelSerializer):
    interviewer_name = serializers.ReadOnlyField(source='interviewer.username')
    applicant_name = serializers.SerializerMethodField()

    class Meta:
        model = Interview
        fields = '__all__'

    def get_applicant_name(self, obj):
        return f"{obj.applicant.first_name} {obj.applicant.last_name}"


class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = '__all__'


class ApplicantSerializer(serializers.ModelSerializer):
    job_title = serializers.ReadOnlyField(source='job_posting.title')
    job_department = serializers.ReadOnlyField(source='job_posting.department.name')
    job_location = serializers.ReadOnlyField(source='job_posting.location')
    job_type = serializers.ReadOnlyField(source='job_posting.job_type')
    job_description = serializers.ReadOnlyField(source='job_posting.description')
    job_requirements = serializers.ReadOnlyField(source='job_posting.requirements')
    job_salary_range = serializers.ReadOnlyField(source='job_posting.salary_range')
    job_status = serializers.ReadOnlyField(source='job_posting.status')
    job_is_public = serializers.ReadOnlyField(source='job_posting.is_public')
    job_created_at = serializers.ReadOnlyField(source='job_posting.created_at')
    job_closing_date = serializers.ReadOnlyField(source='job_posting.closing_date')
    applied_at = serializers.DateTimeField(source='created_at', read_only=True)
    linkedin_url = serializers.CharField(source='linkedin_profile', allow_blank=True, required=False)
    resume_url = serializers.SerializerMethodField()
    resume_filename = serializers.SerializerMethodField()
    resume_size_kb = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    interviews = InterviewSerializer(many=True, read_only=True)
    assessments = AssessmentSerializer(many=True, read_only=True)

    class Meta:
        model = Applicant
        fields = [
            'id', 'job_posting', 'job_title', 'job_department', 'job_location', 'job_type',
            'job_description', 'job_requirements', 'job_salary_range', 'job_status',
            'job_is_public', 'job_created_at', 'job_closing_date',
            'first_name', 'last_name', 'full_name', 'email', 'phone',
            'resume', 'resume_url', 'resume_filename', 'resume_size_kb',
            'cover_letter', 'linkedin_profile', 'linkedin_url',
            'status', 'created_at', 'updated_at', 'applied_at',
            'interviews', 'assessments'
        ]

    def get_resume_url(self, obj):
        if not obj.resume:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.resume.url)
        return obj.resume.url

    def get_resume_filename(self, obj):
        if not obj.resume:
            return None
        return os.path.basename(obj.resume.name)

    def get_resume_size_kb(self, obj):
        if not obj.resume or not hasattr(obj.resume, 'size'):
            return None
        return round(obj.resume.size / 1024, 1)

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
