from api.models import JobRole, OnboardingGuide

def seed_onboarding():
    roles = JobRole.objects.all()
    if not roles.exists():
        print("No roles found to seed onboarding guides for.")
        return

    standard_tasks = [
        {"task": "Collect ID and Passport Photos", "description": "Ensure we have valid identification on file."},
        {"task": "Sign Employment Contract", "description": "Hard copy or digital signature required."},
        {"task": "Setup Workstation & Email", "description": "IT provisioning for the new hire."},
        {"task": "Role Orientation", "description": "Meeting with Department Head to discuss expectations."},
        {"task": "Team Introduction", "description": "Welcome meeting with immediate team members."},
        {"task": "Policy Review", "description": "Read through HR handbook and company SOPs."}
    ]

    count = 0
    for role in roles:
        guide, created = OnboardingGuide.objects.get_or_create(
            job_role=role,
            defaults={
                "title": f"Onboarding Guide for {role.name}",
                "description": f"Standard onboarding process for the {role.name} position at Vemre.",
                "tasks": standard_tasks
            }
        )
        if created:
            count += 1
        else:
            # Update existing guide tasks to ensure they are set
            guide.tasks = standard_tasks
            guide.save()

    print(f"Successfully seeded/updated onboarding guides for {roles.count()} roles ({count} new).")

try:
    seed_onboarding()
except Exception as e:
    print(f"Error seeding: {e}")
