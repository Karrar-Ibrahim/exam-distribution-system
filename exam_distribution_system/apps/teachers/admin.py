from django.contrib import admin
from .models import Teacher


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "title",
        "degree",
        "type",
        "lang",
        "created_at",
    )
    search_fields = ("name", "title")
    list_filter = ("title", "degree", "type", "lang")
    ordering = ("name",)
    readonly_fields = ("type",)
