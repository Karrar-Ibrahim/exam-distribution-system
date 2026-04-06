from django.db import models
from core.models import TimeStampedModel
from classrooms.models import Classroom


class Exam(TimeStampedModel):
    """
    امتحان مرتبط بقاعة.

    date و time محفوظان كنصوص للتوافق مع قاعدة البيانات الحالية.
    db_table يطابق جدول exams في Laravel.
    """

    exam = models.CharField(max_length=255)
    date = models.CharField(max_length=50)
    time = models.CharField(max_length=50)
    classroom = models.ForeignKey(
        Classroom,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exams",
        db_column="idroom",
    )
    lang = models.CharField(max_length=10, default="ar")
    created_by_user_id = models.IntegerField(null=True, blank=True, db_column="iduser")

    class Meta:
        db_table = "exams"
        ordering = ["-id"]

    def __str__(self) -> str:
        return f"{self.exam} - {self.date} ({self.time})"
