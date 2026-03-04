from django.db import migrations

def update_branches_and_departments(apps, schema_editor):
    Department = apps.get_model('api', 'Department')
    Branch = apps.get_model('api', 'Branch')

    # Remove Departments: Finance and Administration
    Department.objects.filter(name__iexact='Finance').delete()
    Department.objects.filter(name__iexact='Administration').delete()

    # Rename Branch: Ipata Market Branch -> Mandate Market Branch
    Branch.objects.filter(name__icontains='Ipata').update(name='Mandate Market Branch')

def reverse_changes(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0017_remove_payrollrecord_housing_allowance_and_more'),
    ]

    operations = [
        migrations.RunPython(update_branches_and_departments, reverse_changes),
    ]
