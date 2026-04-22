from django.db import models
from core.models import TimeStampedModel


class Classroom(TimeStampedModel):
    """قاعة الامتحان."""

    room_number = models.CharField(max_length=50, db_column="roomnumber")
    location = models.CharField(max_length=200, blank=True, default="", verbose_name="مكان القاعة")
    capacity = models.PositiveIntegerField()
    num_invigilators = models.PositiveIntegerField(db_column="numlnvigilators")
    lang = models.CharField(max_length=10, default="ar")
    created_by_user_id = models.IntegerField(null=True, blank=True, db_column="iduser")

    class Meta:
        db_table = "classroom"
        ordering = ["room_number"]

    def __str__(self) -> str:
        return f"قاعة {self.room_number} (سعة: {self.capacity})"
