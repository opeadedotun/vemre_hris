import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Branch

branches = [
    {'name': 'Ogbomosho', 'location': 'Ogbomosho, Nigeria'},
    {'name': 'Osogbo', 'location': 'Osogbo, Nigeria'},
    {'name': 'Ipata (Ilorin HQ)', 'location': 'Ilorin, Nigeria'},
]

for b_data in branches:
    branch, created = Branch.objects.get_or_create(
        name=b_data['name'],
        defaults={'location': b_data['location']}
    )
    if created:
        print(f"Created branch: {branch.name}")
    else:
        print(f"Branch already exists: {branch.name}")
