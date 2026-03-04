from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Initializes the superadmin user'

    def handle(self, *args, **options):
        username = 'superadmin'
        email = 'admin@vemrehr.com'
        password = 'SecurePassword2026!'

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'role': 'ADMIN',
                'first_name': 'Super',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True
            }
        )

        user.set_password(password)
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.role = 'ADMIN'
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f'Successfully created superadmin "{username}"'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Successfully updated superadmin "{username}" password and status.'))
        
        self.stdout.write(self.style.WARNING(f'Credentials: {username} / {password}'))
