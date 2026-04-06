from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("teachers", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="TeacherExclusion",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "date",
                    models.CharField(max_length=50, verbose_name="تاريخ الاستثناء"),
                ),
                (
                    "reason",
                    models.CharField(
                        blank=True,
                        default="",
                        max_length=255,
                        verbose_name="السبب",
                    ),
                ),
                (
                    "created_by_user_id",
                    models.IntegerField(
                        blank=True, db_column="iduser", null=True
                    ),
                ),
                (
                    "teacher",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="exclusions",
                        to="teachers.teacher",
                        verbose_name="المراقب",
                    ),
                ),
            ],
            options={
                "db_table": "teacher_exclusions",
                "ordering": ["-date", "teacher__name"],
            },
        ),
        migrations.AddConstraint(
            model_name="teacherexclusion",
            constraint=models.UniqueConstraint(
                fields=["teacher", "date"],
                name="unique_teacher_date_exclusion",
            ),
        ),
    ]
