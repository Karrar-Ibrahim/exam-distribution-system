"""
خدمة التوزيع — النظام التسلسلي العادل.

قواعد التوزيع:
  ┌─────────────────────────────────────────────────────────────────┐
  │  الخانة الأولى  → دكتوراه (أعلى لقب علمي أولاً)              │
  │                   fallback: أي شهادة إن لم يوجد دكتوراه       │
  │                                                                 │
  │  الخانة الثانية → ماجستير (أعلى لقب علمي أولاً)              │
  │                   fallback: أي شهادة إن لم يوجد ماجستير       │
  │                                                                 │
  │  الخانات 3+    → ماجستير أولاً ثم دكتوراه ثم أي شهادة        │
  │                                                                 │
  │  جميع الخانات: أي نوع (1 أو 2)، مرتَّبة حسب اللقب:           │
  │     أستاذ → أستاذ مساعد → مدرس → مدرس مساعد                  │
  └─────────────────────────────────────────────────────────────────┘

  الاختيار تسلسلي (لا عشوائية):
    • الأقل توزيعاً يُختار أولاً
    • عند التساوي: الشهادة الأعلى أولاً، ثم اللقب الأعلى، ثم الاسم أبجدياً

  قيد الراحة (لا مراقبة متتالية):
    • المراقبون الذين ظهروا في آخر دورة توزيع (آخر batch) يأخذون راحة
      ولا يُختارون في الدورة التالية — يُخفَّف القيد عند الضرورة

  تدرّج تخفيف القيود داخل كل خانة:
    المستوى 1: استبعاد (القاعة + الجلسة الحالية + الراحة)
    المستوى 2: استبعاد (القاعة + الجلسة الحالية)   — رفع قيد الراحة
    المستوى 3: استبعاد (القاعة فقط)
    آخر ملجأ : أي مراقب غير محظور يدوياً ولم يُعيَّن لهذه القاعة
"""

from __future__ import annotations

from datetime import datetime

from django.db.models import Count

from classrooms.models import Classroom
from teachers.models import Teacher, TeacherExclusion
from distributions.models import DistributionBatch, DistributionAssignment


# ── أولوية الشهادة (الأصغر = الأولوية الأعلى) ────────────────────────────────
DEGREE_PRIORITY: dict[str, int] = {
    "دكتوراه":   0,
    "ماجستير":   1,
    "بكالوريوس": 2,
}

# ── أولوية اللقب العلمي (الأصغر = الأعلى) ────────────────────────────────────
TITLE_PRIORITY: dict[str, int] = {
    "استاذ":        0,
    "استاذ مساعد":  1,
    "مدرس":         2,
    "مدرس مساعد":   3,
}


class DistributionService:
    """يُنفّذ عملية التوزيع الكاملة وفق النظام التسلسلي العادل."""

    def __init__(
        self,
        date: str,
        time: str,
        classroom_ids: list[int],
        lang: str = "ar",
        user_id: int | None = None,
        periodic_distribution: bool = False,   # محجوز للتوافق — لا يُستخدم
        require_phd_first_slot: bool = True,   # دكتوراه مطلوب في الخانة الأولى
    ):
        self.raw_date = date
        self.time = time
        self.classroom_ids = classroom_ids
        self.lang = lang
        self.user_id = user_id
        self.require_phd_first_slot = require_phd_first_slot

    # ════════════════════════════════════════════════════════════════════
    #  النقطة الرئيسية
    # ════════════════════════════════════════════════════════════════════

    def execute(self) -> DistributionBatch:
        """ينفّذ التوزيع الكامل ويعيد الـ batch الجديد."""
        normalized_date = self._normalize_date(self.raw_date)

        # 1. احفظ المراقبين المستحقين للراحة قبل إنشاء الـ batch الجديد
        resting_ids: set[int] = self._get_resting_ids()

        # 2. إنشاء batch
        batch = DistributionBatch.objects.create(
            date=normalized_date,
            time=self.time,
            lang=self.lang,
            created_by_user_id=self.user_id,
        )

        # 3. جلب القاعات
        classrooms = self._get_classrooms()
        if not classrooms:
            return batch

        # 4. المراقبون المستثنَون يدوياً في هذا التاريخ (لا تُخفَّف أبداً)
        date_excluded_ids: set[int] = set(
            TeacherExclusion.objects.filter(date=normalized_date)
            .values_list("teacher_id", flat=True)
        )

        # 5. جلب عدد مرات توزيع كل مراقب (query واحد يُعاد استخدامه)
        assignment_counts: dict[int, int] = dict(
            DistributionAssignment.objects
            .values("teacher_id")
            .annotate(c=Count("id"))
            .values_list("teacher_id", "c")
        )

        # 6. مجموعة المراقبين المستخدَمين في هذه الجلسة الحالية (تتراكم عبر القاعات)
        used_in_session: set[int] = set()

        # 7. توزيع على كل قاعة
        for classroom in classrooms:
            self._assign_teachers_for_room(
                batch=batch,
                classroom=classroom,
                date=normalized_date,
                used_in_session=used_in_session,       # يُعدَّل في المكان
                resting_ids=resting_ids,
                date_excluded_ids=date_excluded_ids,
                assignment_counts=assignment_counts,
                require_phd_first_slot=self.require_phd_first_slot,
            )

        # 8. تحديث حالة active
        self._update_active_flags(normalized_date)

        return batch

    # ════════════════════════════════════════════════════════════════════
    #  توزيع قاعة واحدة
    # ════════════════════════════════════════════════════════════════════

    def _assign_teachers_for_room(
        self,
        batch: DistributionBatch,
        classroom: Classroom,
        date: str,
        used_in_session: set[int],
        resting_ids: set[int],
        date_excluded_ids: set[int],
        assignment_counts: dict[int, int],
        require_phd_first_slot: bool = True,   # محجوز للتوافق
    ) -> None:
        """
        يوزّع المراقبين على قاعة واحدة وفق القواعد الجديدة:

          الخانة 0 → دكتوراه (أعلى لقب أولاً)  fallback: أي شهادة
          الخانة 1 → ماجستير (أعلى لقب أولاً)  fallback: أي شهادة
          الخانات 2+ → ماجستير ثم دكتوراه ثم أي شهادة

          جميع الخانات: أي نوع (1 أو 2)
          الترتيب داخل كل مجموعة: أقل توزيعاً → أعلى شهادة → أعلى لقب → الاسم
        """
        needed = classroom.num_invigilators
        if needed <= 0:
            return

        assigned_ids: list[int] = []

        for slot_index in range(needed):
            room_ids = set(assigned_ids)
            teacher: Teacher | None = None

            if slot_index == 0:
                # ── الخانة الأولى: دكتوراه أولاً ────────────────────────────
                teacher = self._pick_teacher(
                    require_degree="دكتوراه",
                    room_ids=room_ids,
                    used_in_session=used_in_session,
                    resting_ids=resting_ids,
                    date_excluded_ids=date_excluded_ids,
                    assignment_counts=assignment_counts,
                )
                if not teacher:
                    # fallback: أي شهادة
                    teacher = self._pick_teacher(
                        require_degree=None,
                        room_ids=room_ids,
                        used_in_session=used_in_session,
                        resting_ids=resting_ids,
                        date_excluded_ids=date_excluded_ids,
                        assignment_counts=assignment_counts,
                    )

            elif slot_index == 1:
                # ── الخانة الثانية: ماجستير أولاً ───────────────────────────
                teacher = self._pick_teacher(
                    require_degree="ماجستير",
                    room_ids=room_ids,
                    used_in_session=used_in_session,
                    resting_ids=resting_ids,
                    date_excluded_ids=date_excluded_ids,
                    assignment_counts=assignment_counts,
                )
                if not teacher:
                    # fallback: أي شهادة
                    teacher = self._pick_teacher(
                        require_degree=None,
                        room_ids=room_ids,
                        used_in_session=used_in_session,
                        resting_ids=resting_ids,
                        date_excluded_ids=date_excluded_ids,
                        assignment_counts=assignment_counts,
                    )

            else:
                # ── الخانات الثالثة وما بعدها: ماجستير → دكتوراه → أي ────────
                teacher = self._pick_teacher(
                    require_degree="ماجستير",
                    room_ids=room_ids,
                    used_in_session=used_in_session,
                    resting_ids=resting_ids,
                    date_excluded_ids=date_excluded_ids,
                    assignment_counts=assignment_counts,
                )
                if not teacher:
                    teacher = self._pick_teacher(
                        require_degree="دكتوراه",
                        room_ids=room_ids,
                        used_in_session=used_in_session,
                        resting_ids=resting_ids,
                        date_excluded_ids=date_excluded_ids,
                        assignment_counts=assignment_counts,
                    )
                if not teacher:
                    teacher = self._pick_teacher(
                        require_degree=None,
                        room_ids=room_ids,
                        used_in_session=used_in_session,
                        resting_ids=resting_ids,
                        date_excluded_ids=date_excluded_ids,
                        assignment_counts=assignment_counts,
                    )

            # ── آخر ملجأ: أي مراقب غير محظور لم يُعيَّن لهذه القاعة ─────────
            if not teacher:
                teacher = self._last_resort(
                    room_ids=room_ids,
                    date_excluded_ids=date_excluded_ids,
                    assignment_counts=assignment_counts,
                )

            if not teacher:
                # لا يوجد أي مراقب متاح إطلاقاً — تخطّ الخانة
                continue

            DistributionAssignment.objects.create(
                batch=batch,
                classroom=classroom,
                room_label=classroom.room_number,
                date=date,
                teacher=teacher,
                teacher_name=self.get_teacher_display_name(teacher),
                degree=teacher.degree,
                time=self.time,
                active=True,
                count=needed,
                type=teacher.type,
            )
            assigned_ids.append(teacher.id)
            used_in_session.add(teacher.id)          # تراكم فوري عبر القاعات

    # ════════════════════════════════════════════════════════════════════
    #  اختيار مراقب — التسلسل مع تدرّج تخفيف القيود
    # ════════════════════════════════════════════════════════════════════

    def _pick_teacher(
        self,
        require_degree: str | None,
        room_ids: set[int],
        used_in_session: set[int],
        resting_ids: set[int],
        date_excluded_ids: set[int],
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """
        يختار المراقب تسلسلياً (الأقل توزيعاً أولاً) بأربعة مستويات من التخفيف:

        1. استبعاد (القاعة + الجلسة الحالية + الراحة)
        2. استبعاد (القاعة + الجلسة الحالية)   [رفع قيد الراحة]
        3. استبعاد (القاعة فقط)
        4. أي متاح من هذه الشهادة (لا قيود إضافية)

        جميع الأنواع (1 و 2) مسموح بها في كل الخانات.
        """
        # الـ QuerySet الأساسي: أي نوع مع استبعاد الحظر اليدوي والاستثناء الدائم دائماً
        base_qs = (
            Teacher.objects
            .filter(is_excluded=False)
            .exclude(id__in=date_excluded_ids)
        )
        if require_degree:
            base_qs = base_qs.filter(degree=require_degree)

        # ── المستوى 1: أقوى القيود ──────────────────────────────────────────
        excluded = room_ids | used_in_session | resting_ids
        teacher = self._ordered_pick(base_qs.exclude(id__in=excluded), assignment_counts)
        if teacher:
            return teacher

        # ── المستوى 2: رفع قيد الراحة ──────────────────────────────────────
        excluded = room_ids | used_in_session
        teacher = self._ordered_pick(base_qs.exclude(id__in=excluded), assignment_counts)
        if teacher:
            return teacher

        # ── المستوى 3: رفع قيد الجلسة ──────────────────────────────────────
        teacher = self._ordered_pick(base_qs.exclude(id__in=room_ids), assignment_counts)
        if teacher:
            return teacher

        # ── المستوى 4: أي أحد من هذه الشهادة (لا قيود إضافية) ─────────────
        teacher = self._ordered_pick(base_qs, assignment_counts)
        return teacher

    def _last_resort(
        self,
        room_ids: set[int],
        date_excluded_ids: set[int],
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """
        آخر ملجأ: أي مراقب غير محظور يدوياً ولم يُعيَّن لهذه القاعة.
        يحترم date_excluded_ids دائماً — يتجاهل باقي القيود.
        """
        qs = (
            Teacher.objects
            .filter(is_excluded=False)
            .exclude(id__in=room_ids | date_excluded_ids)
        )
        return self._ordered_pick(qs, assignment_counts)

    # ════════════════════════════════════════════════════════════════════
    #  الاختيار التسلسلي (بدل العشوائي)
    # ════════════════════════════════════════════════════════════════════

    @staticmethod
    def _ordered_pick(
        qs,
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """
        يختار المراقب الأمثل من الـ QuerySet وفق:
          1. أقل عدد توزيعات (assignment_counts)   ← العدالة أولاً
          2. أعلى شهادة علمية (دكتوراه > ماجستير > بكالوريوس)
          3. أعلى لقب علمي (أستاذ → أستاذ مساعد → مدرس → مدرس مساعد)
          4. الاسم أبجدياً (لضمان ثبات الترتيب عند التساوي)

        يجلب (id, degree, title, name) من قاعدة البيانات ويرتّب في الذاكرة
        لتجنّب annotation متكرر في الـ DB.
        """
        rows = list(qs.values_list("id", "degree", "title", "name"))
        if not rows:
            return None

        rows.sort(key=lambda r: (
            assignment_counts.get(r[0], 0),    # الأقل توزيعاً أولاً
            DEGREE_PRIORITY.get(r[1], 99),     # الأعلى شهادةً أولاً
            TITLE_PRIORITY.get(r[2], 99),      # الأعلى لقباً أولاً
            r[3],                              # الاسم أبجدياً
        ))

        chosen_id = rows[0][0]
        return Teacher.objects.get(id=chosen_id)

    # ════════════════════════════════════════════════════════════════════
    #  Helpers
    # ════════════════════════════════════════════════════════════════════

    @staticmethod
    def get_teacher_display_name(teacher: Teacher) -> str:
        return teacher.formatted_name

    def _get_classrooms(self) -> list[Classroom]:
        qs = Classroom.objects.all()
        if self.classroom_ids:
            qs = qs.filter(id__in=self.classroom_ids)
        return list(qs.order_by("room_number"))

    @staticmethod
    def _get_resting_ids() -> set[int]:
        """
        يُعيد أسماء المراقبين الذين ظهروا في آخر دورة توزيع (آخر batch).
        هؤلاء يأخذون راحة إلزامية في الدورة التالية (يُخفَّف عند الضرورة).
        يُستدعى قبل إنشاء الـ batch الجديد لتجنّب احتساب النفس.
        """
        last_batch = (
            DistributionBatch.objects
            .order_by("-id")
            .values("id")
            .first()
        )
        if not last_batch:
            return set()
        return set(
            DistributionAssignment.objects
            .filter(batch_id=last_batch["id"])
            .values_list("teacher_id", flat=True)
            .distinct()
        )

    @staticmethod
    def _normalize_date(date_str: str) -> str:
        for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y"):
            try:
                return datetime.strptime(date_str.strip(), fmt).strftime("%Y-%m-%d")
            except ValueError:
                continue
        return date_str.strip()

    @staticmethod
    def _update_active_flags(current_date: str) -> None:
        DistributionAssignment.objects.all().update(active=False)
        DistributionAssignment.objects.filter(date=current_date).update(active=True)
