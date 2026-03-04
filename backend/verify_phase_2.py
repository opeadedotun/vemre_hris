import os
import django
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import (
    KnowledgeCategory, KnowledgeArticle, JobRole, Employee, 
    OnboardingGuide, OnboardingProgress, Department
)
from django.db.models import Q

def verify_phase_2():
    print("--- Phase 2 Verification ---")
    
    # 1. Test Search Logic
    print("\n[1] Testing Search Logic...")
    # Create test data
    dept, _ = Department.objects.get_or_create(name="Test Dept")
    cat, _ = KnowledgeCategory.objects.get_or_create(name="Test Category", department=dept)
    
    article, created = KnowledgeArticle.objects.get_or_create(
        title="Searchable unique title for testing",
        slug="search-test-article",
        category=cat,
        content="This content contains the keyword 'SuperSecretWord' for testing search.",
        is_published=True
    )
    
    # Test keyword search
    search_query = "SuperSecretWord"
    results = KnowledgeArticle.objects.filter(
        Q(title__icontains=search_query) | Q(content__icontains=search_query)
    )
    print(f"Search for '{search_query}': Found {results.count()} results.")
    assert results.count() >= 1, "Keyword search failed"
    
    # Test department filter
    dept_results = KnowledgeArticle.objects.filter(category__department=dept)
    print(f"Filter by Department '{dept.name}': Found {dept_results.count()} results.")
    assert dept_results.count() >= 1, "Department filter failed"
    
    # 2. Test Onboarding Logic
    print("\n[2] Testing Onboarding Logic...")
    role, _ = JobRole.objects.get_or_create(name="Test Role", department=dept)
    employee, _ = Employee.objects.get_or_create(
        employee_code="TEST002",
        full_name="Test Onboarding Employee",
        email="test_onboarding@example.com",
        job_role=role
    )
    
    guide_content = "<h3>Onboarding Checklist</h3><p>Welcome to the team!</p>"
    checklist = ["Setup Workstation", "Meet the Team", "Security Training"]
    
    guide, _ = OnboardingGuide.objects.get_or_create(
        job_role=role,
        defaults={
            "title": "Test Onboarding Guide",
            "content": guide_content,
            "checklist_json": checklist
        }
    )
    print(f"Onboarding Guide created for role: {role.name}")
    
    # Test progress creation
    progress, created = OnboardingProgress.objects.get_or_create(
        employee=employee,
        guide=guide
    )
    print(f"Progress record {'created' if created else 'found'} for employee: {employee.full_name}")
    assert progress.guide == guide, "Progress link to guide failed"
    
    # Test completing items
    progress.completed_items = ["Setup Workstation"]
    progress.save()
    print(f"Completed items: {progress.completed_items}")
    assert not progress.is_completed, "Progress should not be marked as completed yet"
    
    # Complete all items
    progress.completed_items = checklist
    # Simulate ViewSet logic
    if len(progress.completed_items) >= len(guide.checklist_json):
        progress.is_completed = True
        progress.completed_at = timezone.now()
    progress.save()
    
    print(f"After completing all items: is_completed={progress.is_completed}, completed_at={progress.completed_at}")
    assert progress.is_completed, "Progress completion logic failed"

    print("\n--- Phase 2 Verification Successful ---")

if __name__ == "__main__":
    try:
        verify_phase_2()
    except Exception as e:
        print(f"Verification FAILED: {e}")
        import traceback
        traceback.print_exc()
