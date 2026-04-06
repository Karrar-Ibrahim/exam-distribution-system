from django.contrib import admin
from .models import Exam


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "exam",
        "date",
        "time",
        "classroom",
        "lang",
        "created_at",
    )
    search_fields = ("exam", "date")
    list_filter = ("lang", "date")
    ordering = ("-id",)
    autocomplete_fields = []  # يمكن إضافة classroom هنا لاحقًا
    raw_id_fields = ("classroom",)
