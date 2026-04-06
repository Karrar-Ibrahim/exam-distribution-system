from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserActivityLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("action", models.CharField(
                    choices=[
                        ("login",      "تسجيل دخول"),
                        ("logout",     "تسجيل خروج"),
                        ("create",     "إضافة"),
                        ("update",     "تعديل"),
                        ("delete",     "حذف"),
                        ("export",     "تصدير"),
                        ("distribute", "توزيع"),
                    ],
                    max_length=20,
                    verbose_name="الإجراء",
                )),
                ("module",      models.CharField(max_length=100, verbose_name="الوحدة")),
                ("description", models.TextField(blank=True, default="", verbose_name="الوصف")),
                ("ip_address",  models.GenericIPAddressField(blank=True, null=True, verbose_name="عنوان IP")),
                ("user_agent",  models.CharField(blank=True, default="", max_length=500, verbose_name="المتصفح")),
                ("extra_data",  models.JSONField(blank=True, null=True, verbose_name="بيانات إضافية")),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="activity_logs",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="المستخدم",
                    ),
                ),
            ],
            options={
                "verbose_name":        "سجل النشاط",
                "verbose_name_plural": "سجلات النشاط",
                "db_table":  "user_activity_logs",
                "ordering":  ["-created_at"],
            },
        ),
    ]
