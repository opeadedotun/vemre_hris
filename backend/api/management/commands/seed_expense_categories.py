from django.core.management.base import BaseCommand
from api.models import ExpenseCategory


CATEGORIES = [
    ('Transport', 'Taxi, fuel, and travel-related expenses'),
    ('Meals and Entertainment', 'Business meals and client entertainment'),
    ('Office Supplies', 'Stationery, printing, and consumables'),
    ('Communication', 'Airtime, internet, and phone bills'),
    ('Accommodation', 'Hotel and lodging during work trips'),
    ('Medical', 'Work-related medical and first-aid expenses'),
    ('Training and Development', 'Workshops, courses, and certifications'),
    ('Utilities', 'Electricity, water, and facility bills'),
    ('Marketing', 'Advertising, promotional, and branding materials'),
    ('Other', 'Miscellaneous work-related expenses'),
]


class Command(BaseCommand):
    help = 'Seed default expense categories'

    def handle(self, *args, **kwargs):
        created = 0
        for name, desc in CATEGORIES:
            _, was_created = ExpenseCategory.objects.get_or_create(
                name=name,
                defaults={'description': desc}
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f'{created} expense categories created.'))
        for c in ExpenseCategory.objects.all():
            self.stdout.write(f'  [{c.id}] {c.name}')
