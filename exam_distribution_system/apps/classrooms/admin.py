from django.contrib import admin
from .models import Classroom


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "room_number",
        "capacity",
        "num_invigilators",
        "lang",
        "created_at",
    )
    search_fields = ("room_number",)
    list_filter = ("lang",)
    ordering = ("room_number",)
