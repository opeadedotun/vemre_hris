from django.db import models
from django.conf import settings
from api.models import Department

class JobPosting(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
    ]
    JOB_TYPE_CHOICES = [
        ('FULL_TIME', 'Full Time'),
        ('PART_TIME', 'Part Time'),
        ('CONTRACT', 'Contract'),
    ]
    title = models.CharField(max_length=255)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='job_postings')
    location = models.CharField(max_length=255, blank=True, null=True)
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='FULL_TIME')
    description = models.TextField()
    requirements = models.TextField()
    salary_range = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closing_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.department.name} ({self.status})"

class Applicant(models.Model):
    STATUS_CHOICES = [
        ('APPLIED', 'Applied'),
        ('SCREENING', 'Screening'),
        ('TECHNICAL', 'Technical'),
        ('INTERVIEW', 'Interview'),
        ('OFFER', 'Offer'),
        ('REJECTED', 'Rejected'),
    ]
    job_posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='applicants')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    resume = models.FileField(upload_to='resumes/')
    cover_letter = models.TextField(blank=True, null=True)
    linkedin_profile = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPLIED')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.job_posting.title}"

class Interview(models.Model):
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    applicant = models.ForeignKey(Applicant, on_delete=models.CASCADE, related_name='interviews')
    interviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conducted_interviews')
    date_time = models.DateTimeField()
    location_or_link = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Interview for {self.applicant.first_name} by {self.interviewer.username}"

class Assessment(models.Model):
    applicant = models.ForeignKey(Applicant, on_delete=models.CASCADE, related_name='assessments')
    title = models.CharField(max_length=255)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    out_of = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    comments = models.TextField(blank=True, null=True)
    taken_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Assessment: {self.title} for {self.applicant.first_name}"

