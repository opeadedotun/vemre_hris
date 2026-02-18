# Generated manually to add missing file_path field

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ("api", "0008_create_branch_table"),
    ]

    operations = [
        migrations.AddField(
            model_name="attendanceupload",
            name="file_path",
            field=models.FileField(upload_to='attendance_uploads/', null=True, blank=True),
        ),
    ]
