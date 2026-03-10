from django.core.management.base import BaseCommand, CommandError
from django.apps import apps
from django.contrib.auth import get_user_model
from api.models import Department, JobRole, Employee

class Command(BaseCommand):
    help = 'Merge superadmin into opeyemi and restore HR Manager employee profile.'

    def handle(self, *args, **options):
        User = get_user_model()
        opeyemi = User.objects.filter(username='opeyemi').first()
        if not opeyemi:
            raise CommandError("User 'opeyemi' not found. Please create it first.")

        superadmin = User.objects.filter(username='superadmin').first()

        # Ensure opeyemi is the active superadmin
        opeyemi.role = 'ADMIN'
        opeyemi.is_superuser = True
        opeyemi.is_staff = True
        opeyemi.is_active = True
        opeyemi.save()

        if superadmin and superadmin != opeyemi:
            # Reassign all FK references from superadmin to opeyemi
            for model in apps.get_models():
                for field in model._meta.fields:
                    if field.is_relation and field.many_to_one and field.related_model == User:
                        model.objects.filter(**{field.name: superadmin}).update(**{field.name: opeyemi})

            # Deactivate superadmin account
            superadmin.is_active = False
            superadmin.set_unusable_password()
            superadmin.save()

        # Restore HR Manager employee profile
        dept, _ = Department.objects.get_or_create(name='Human Resources')
        role, _ = JobRole.objects.get_or_create(
            name='Human Resources Manager',
            defaults={'department': dept}
        )
        if role.department_id != dept.id:
            role.department = dept
            role.save(update_fields=['department'])

        full_name = (opeyemi.first_name + ' ' + opeyemi.last_name).strip() or 'Opeyemi Adedotun'
        employee, created = Employee.objects.update_or_create(
            email=opeyemi.email,
            defaults={
                'full_name': full_name,
                'department': dept,
                'job_role': role,
                'job_title': 'Human Resources Manager',
                'employment_status': 'ACTIVE',
                'is_active': True,
            }
        )

        self.stdout.write(self.style.SUCCESS('Merged superadmin into opeyemi and restored HR Manager profile.'))
