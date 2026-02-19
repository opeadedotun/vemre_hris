from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_add_file_path_to_attendanceupload'),
    ]

    operations = [
        # Add new allowance fields to SalaryStructure
        migrations.AddField(
            model_name='salarystructure',
            name='medical_allowance',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='salarystructure',
            name='utility_allowance',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        # Update PayrollRecord - rename allowances to total_allowances and add breakdown fields
        migrations.RenameField(
            model_name='payrollrecord',
            old_name='allowances',
            new_name='total_allowances',
        ),
        migrations.AddField(
            model_name='payrollrecord',
            name='housing_allowance',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='payrollrecord',
            name='transport_allowance',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='payrollrecord',
            name='medical_allowance',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='payrollrecord',
            name='utility_allowance',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='payrollrecord',
            name='other_allowances',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='payrollrecord',
            name='tax_deduction',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
    ]
