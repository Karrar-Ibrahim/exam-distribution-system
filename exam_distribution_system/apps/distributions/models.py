from django.db import models
from core.models import TimeStampedModel
from classrooms.models import Classroom
from teachers.models import Teacher


class DistributionBatch(TimeStampedModel):
    """
    دفعة توزيع (range).
    كل عملية توزيع تُنشئ سجلاً واحداً هنا ثم سجلات assignments مرتبطة به.
    """

    date = models.CharField(max_length=50)
    time = models.CharField(max_length=50)
    lang = models.CharField(max_length=10, default="ar")
    created_by_user_id = models.IntegerField(
        null=True, blank=True, db_column="iduser"
    )

    class Meta:
        db_table = "range"
        ordering = ["-id"]

    def __str__(self) -> str:
        return f"Batch #{self.id} - {self.date} ({self.time})"


class DistributionAssignment(TimeStampedModel):
    """
    تعيين مراقب لقاعة (tech_divide).
    يحتفظ بـ snapshot fields حتى لو تغيّرت بيانات المراقب أو القاعة لاحقاً.
    """

    batch = models.ForeignKey(
        DistributionBatch,
        on_delete=models.CASCADE,
        related_name="assignments",
        db_column="idrange",
    )
    classroom = models.ForeignKey(
        Classroom,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="distribution_assignments",
        db_column="idroom",
    )
    room_label = models.CharField(max_length=50, db_column="numroom")
    date = models.CharField(max_length=50)
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="distribution_assignments",
        db_column="tech_id",
    )
    teacher_name = models.CharField(max_length=255, db_column="tech_name")
    degree = models.CharField(max_length=100, blank=True, default="")
    time = models.CharField(max_length=50)
    active = models.BooleanField(default=True)
    count = models.PositiveIntegerField(default=0)
    type = models.PositiveSmallIntegerField(default=1)

    class Meta:
        db_table = "tech_divide"
        ordering = ["-id"]

    def __str__(self) -> str:
        return f"{self.teacher_name} -> {self.room_label} ({self.date})"
