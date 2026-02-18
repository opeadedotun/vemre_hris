# Generated manually to fix missing Branch table

from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ("api", "0007_attendancelog_late_minutes_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Branch",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("location", models.CharField(blank=True, max_length=255, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.AddField(
            model_name="attendanceupload",
            name="branch",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="uploads",
                to="api.branch",
            ),
        ),
        migrations.AddField(
            model_name="attendanceupload",
            name="is_uploaded",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="attendancelog",
            name="branch",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="logs",
                to="api.branch",
            ),
        ),
        migrations.AddField(
            model_name="attendancelog",
            name="late_category",
            field=models.CharField(
                choices=[
                    ("IGNORE", "Ignore (<= 5 min)"),
                    ("LATE_30", "Late 30 Min (6-30 min)"),
                    ("LATE_1HR", "Late 1 Hour (31-60 min)"),
                    ("QUERY", "Query (> 60 min)"),
                ],
                default="IGNORE",
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name="AttendanceMonthlySummary",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("month", models.CharField(max_length=7)),
                ("total_late_30", models.IntegerField(default=0)),
                ("total_late_1hr", models.IntegerField(default=0)),
                ("total_query", models.IntegerField(default=0)),
                ("total_late_days", models.IntegerField(default=0)),
                ("salary_deduction_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("is_processed", models.BooleanField(default=False)),
                ("processed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "employee",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="monthly_attendance_summaries",
                        to="api.employee",
                    ),
                ),
            ],
            options={
                "unique_together": {("employee", "month")},
            },
        ),
        migrations.CreateModel(
            name="DisciplinaryAction",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("action_type", models.CharField(choices=[("WARNING", "Warning"), ("HR_REVIEW", "HR Review"), ("QUERY_LETTER", "Query Letter")], max_length=50)),
                ("reason", models.TextField()),
                ("date_issued", models.DateField(auto_now_add=True)),
                ("month", models.CharField(max_length=7)),
                ("is_resolved", models.BooleanField(default=False)),
                (
                    "employee",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="disciplinary_actions",
                        to="api.employee",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="EmployeeSchedule",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("schedule_type", models.CharField(max_length=100)),
                ("expected_start_time", models.TimeField()),
                ("expected_end_time", models.TimeField()),
                ("work_days_pattern", models.CharField(help_text="e.g., Mon-Fri, 4 On 4 Off", max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "employee",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="schedule",
                        to="api.employee",
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="payrollrecord",
            name="attendance_deduction",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
    ]
