import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Branch, ExpenseCategory

def seed():
    # 1. Seed Branch
    branch_name = "Main Office"
    branch, created = Branch.objects.get_or_create(
        name=branch_name,
        defaults={
            'location': 'Headquarters',
            'latitude': 6.5244,  # Default Lagos coords
            'longitude': 3.3792,
            'radius': 500
        }
    )
    if created:
        print(f"Created branch: {branch_name}")
    else:
        print(f"Branch already exists: {branch_name}")

    # 2. Seed Expense Categories
    categories = [
        "Office Maintenance",
        "Refreshment",
        "Repair & Services",
        "Fuel",
        "Stationery",
        "Transport"
    ]
    
    # First, let's clear existing categories if we want to be exact, 
    # but maybe it's safer to just add them.
    # The user asked to "populate the category dropdown with THE FOLLOWING", 
    # implying these should be the main ones.
    
    current_cats = list(ExpenseCategory.objects.all().values_list('name', flat=True))
    for cat_name in categories:
        if cat_name not in current_cats:
            ExpenseCategory.objects.create(name=cat_name)
            print(f"Created category: {cat_name}")
        else:
            print(f"Category exists: {cat_name}")

if __name__ == "__main__":
    seed()
