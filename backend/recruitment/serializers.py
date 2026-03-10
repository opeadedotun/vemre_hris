from rest_framework import serializers
from .models import JobPosting, Applicant, Interview, Assessment


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
    applied_at = serializers.DateTimeField(source='created_at', read_only=True)
    linkedin_url = serializers.CharField(source='linkedin_profile', allow_blank=True, required=False)
    interviews = InterviewSerializer(many=True, read_only=True)
    assessments = AssessmentSerializer(many=True, read_only=True)

    class Meta:
        model = Applicant
        fields = '__all__'
