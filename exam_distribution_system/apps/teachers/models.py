from django.db import models
from core.models import TimeStampedModel


class Teacher(TimeStampedModel):
    """
    مدرّس / عضو هيئة تدريسية.
    db_table يطابق جدول teaching_management الحالي في Laravel.
    """

    TITLE_CHOICES = [
        ("استاذ", "استاذ"),
        ("استاذ مساعد", "استاذ مساعد"),
        ("مدرس", "مدرس"),
        ("مدرس مساعد", "مدرس مساعد"),
    ]

    DEGREE_CHOICES = [
        ("دكتوراه", "دكتوراه"),
        ("ماجستير", "ماجستير"),
        ("بكالوريوس", "بكالوريوس"),
    ]

    # النوع: 2 = أستاذ / أستاذ مساعد، 1 = مدرّس / مدرّس مساعد
    TYPE_PROFESSOR = 2
    TYPE_LECTURER = 1

    PROFESSOR_TITLES = {"استاذ", "استاذ مساعد"}

    name = models.CharField(max_length=255)
    title = models.CharField(max_length=100, choices=TITLE_CHOICES)
    degree = models.CharField(max_length=100, choices=DEGREE_CHOICES)
    type = models.PositiveSmallIntegerField(default=1)
    lang = models.CharField(max_length=10, default="ar")
    created_by_user_id = models.IntegerField(null=True, blank=True, db_column="iduser")

    class Meta:
        db_table = "teaching_management"
        ordering = ["name"]

    # ------------------------------------------------------------------ #
    #  Logic                                                               #
    # ------------------------------------------------------------------ #

    def _compute_type(self) -> int:
        """يحسب type بناءً على title."""
        return (
            self.TYPE_PROFESSOR
            if self.title in self.PROFESSOR_TITLES
            else self.TYPE_LECTURER
        )

    def save(self, *args, **kwargs):
        self.type = self._compute_type()
        super().save(*args, **kwargs)

    # ------------------------------------------------------------------ #
    #  Properties                                                          #
    # ------------------------------------------------------------------ #

    @property
    def formatted_name(self) -> str:
        """
        يعيد الاسم مع البادئة العربية المختصرة.

        الجدول:
          استاذ            => أ.
          استاذ مساعد     => أ.م.
          مدرس             => م.
          مدرس مساعد      => م.م.

        إذا كانت درجته دكتوراه تُضاف "د." بعد البادئة.
        """
        prefix_map = {
            "استاذ": "أ.",
            "استاذ مساعد": "أ.م.",
            "مدرس": "م.",
            "مدرس مساعد": "م.م.",
        }
        prefix = prefix_map.get(self.title, "")
        if self.degree == "دكتوراه":
            prefix = f"{prefix}د." if prefix else "د."
        return f"{prefix} {self.name}".strip()

    def __str__(self) -> str:
        return self.formatted_name


class TeacherExclusion(TimeStampedModel):
    """
    استثناء مراقب من التوزيع في تاريخ محدد.
    أي مراقب موجود هنا لن يُختار في عملية التوزيع ليوم تاريخه مطابق.
    """

    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name="exclusions",
        verbose_name="المراقب",
    )
    date = models.CharField(max_length=50, verbose_name="تاريخ الاستثناء")
    reason = models.CharField(
        max_length=255, blank=True, default="", verbose_name="السبب"
    )
    created_by_user_id = models.IntegerField(
        null=True, blank=True, db_column="iduser"
    )

    class Meta:
        db_table = "teacher_exclusions"
        ordering = ["-date", "teacher__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["teacher", "date"],
                name="unique_teacher_date_exclusion",
            )
        ]

    def __str__(self) -> str:
        return f"{self.teacher.formatted_name} — {self.date}"
