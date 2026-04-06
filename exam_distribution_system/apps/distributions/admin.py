from django.contrib import admin
from .models import DistributionBatch, DistributionAssignment


@admin.register(DistributionBatch)
class DistributionBatchAdmin(admin.ModelAdmin):
    list_display = ("id", "date", "time", "lang", "created_by_user_id", "created_at")
    search_fields = ("date",)
    list_filter = ("lang", "date")
    ordering = ("-id",)


@admin.register(DistributionAssignment)
class DistributionAssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "batch_id",
        "room_label",
        "teacher_name",
        "degree",
        "date",
        "time",
        "active",
        "type",
    )
    search_fields = ("teacher_name", "room_label")
    list_filter = ("active", "type", "date", "time")
    ordering = ("-id",)
    raw_id_fields = ("batch", "classroom", "teacher")
