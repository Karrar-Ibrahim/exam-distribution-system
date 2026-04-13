"""
خدمة التوزيع — النظام التسلسلي العادل.

قواعد التوزيع:
  ┌──────────────────────────────────────────────────────────────────────┐
  │  خانة مدير القاعة (الخانة الأولى — slot 0)                          │
  │    1. ماجستير + استاذ                                               │
  │    2. ماجستير + استاذ مساعد                                         │
  │    3. دكتوراه + مدرس                                                │
  │    4. دكتوراه + استاذ مساعد                                         │
  │    5. دكتوراه + استاذ                                               │
  │    fallback: أي متاح                                                │
  │                                                                      │
  │  الخانات الباقية (مراقبون — slot 1+)                                │
  │    1. ماجستير + مدرس مساعد                                          │
  │    2. ماجستير + مدرس                                                │
  │    3. دكتوراه + مدرس                                                │
  │    fallback: أي متاح                                                │
  └──────────────────────────────────────────────────────────────────────┘

  قواعد صارمة:
    • لا تكرار أبداً في نفس اليوم (الاسم في قاعة واحدة فقط)
    • لا تكرار في اليوم التالي إلا عند الضرورة القصوى

  استراتيجية الاختيار — ثلاث مراحل:
    المرحلة 1: كل الأولويات بدون مراقبين مستراحين
    المرحلة 2: كل الأولويات مع السماح بالمستراحين (عند النفاد)
    المرحلة 3: رفع قيد الجلسة (نادر — عدد المراقبين لا يكفي)

  عدالة التوزيع:
    • الأقل توزيعاً يُختار أولاً دائماً
    • عند التساوي: الاسم أبجدياً

  راحة: ماجستير + مدرس مساعد لا يأخذون راحة إلزامية (قابلون للتكرار)
"""

from __future__ import annotations

from datetime import datetime

from django.db.models import Count

from classrooms.models import Classroom
from teachers.models import Teacher, TeacherExclusion
from distributions.models import DistributionBatch, DistributionAssignment


# ── أولويات خانة مدير القاعة (slot 0) ───────────────────────────────────────
DIRECTOR_PRIORITIES: list[tuple[str | None, list[str] | None]] = [
    ("ماجستير", ["استاذ"]),           # 1. ماجستير استاذ
    ("ماجستير", ["استاذ مساعد"]),     # 2. ماجستير استاذ مساعد
    ("دكتوراه", ["مدرس"]),            # 3. دكتوراه مدرس
    ("دكتوراه", ["استاذ مساعد"]),     # 4. دكتوراه استاذ مساعد
    ("دكتوراه", ["استاذ"]),           # 5. دكتوراه استاذ
    (None,       None),               # 6. أي متاح
]

# ── أولويات خانة المراقب العادي (slot 1+) ────────────────────────────────────
INVIGILATOR_PRIORITIES: list[tuple[str | None, list[str] | None]] = [
    ("ماجستير", ["مدرس مساعد"]),      # 1. ماجستير مدرس مساعد
    ("ماجستير", ["مدرس"]),            # 2. ماجستير مدرس
    ("دكتوراه", ["مدرس"]),            # 3. دكتوراه مدرس
    (None,       None),               # 4. أي متاح
]

# ── الفئة القابلة للتكرار (لا راحة إلزامية) ─────────────────────────────────
REPEATABLE_DEGREE: str = "ماجستير"
REPEATABLE_TITLE:  str = "مدرس مساعد"


class DistributionService:
    """يُنفّذ عملية التوزيع الكاملة وفق النظام التسلسلي العادل."""

    def __init__(
        self,
        date: str,
        time: str,
        classroom_ids: list[int],
        lang: str = "ar",
        user_id: int | None = None,
        periodic_distribution: bool = False,
        require_phd_first_slot: bool = True,
    ):
        self.raw_date = date
        self.time = time
        self.classroom_ids = classroom_ids
        self.lang = lang
        self.user_id = user_id

    # ════════════════════════════════════════════════════════════════════
    #  النقطة الرئيسية
    # ════════════════════════════════════════════════════════════════════

    def execute(self) -> DistributionBatch:
        normalized_date = self._normalize_date(self.raw_date)

        # 1. المراقبون المستحقون للراحة (من آخر batch)
        resting_ids: set[int] = self._get_resting_ids()

        # 2. ماجستير مدرس مساعد لا يأخذون راحة
        repeatable_ids: set[int] = set(
            Teacher.objects
            .filter(degree=REPEATABLE_DEGREE, title=REPEATABLE_TITLE, is_excluded=False)
            .values_list("id", flat=True)
        )
        effective_resting: set[int] = resting_ids - repeatable_ids

        # 3. إنشاء batch
        batch = DistributionBatch.objects.create(
            date=normalized_date,
            time=self.time,
            lang=self.lang,
            created_by_user_id=self.user_id,
        )

        # 4. جلب القاعات
        classrooms = self._get_classrooms()
        if not classrooms:
            return batch

        # 5. المستثنَون يدوياً في هذا التاريخ
        date_excluded_ids: set[int] = set(
            TeacherExclusion.objects.filter(date=normalized_date)
            .values_list("teacher_id", flat=True)
        )

        # 6. عدد مرات التوزيع لكل مراقب
        assignment_counts: dict[int, int] = dict(
            DistributionAssignment.objects
            .values("teacher_id")
            .annotate(c=Count("id"))
            .values_list("teacher_id", "c")
        )

        # 7. المستخدَمون في هذه الجلسة — يمنع تكرار الاسم في نفس اليوم مطلقاً
        used_in_session: set[int] = set()

        # 8. توزيع على كل قاعة
        for classroom in classrooms:
            self._assign_room(
                batch=batch,
                classroom=classroom,
                date=normalized_date,
                used_in_session=used_in_session,
                resting_ids=effective_resting,
                date_excluded_ids=date_excluded_ids,
                assignment_counts=assignment_counts,
            )

        # 9. تحديث حالة active
        self._update_active_flags(normalized_date)

        return batch

    # ════════════════════════════════════════════════════════════════════
    #  توزيع قاعة واحدة
    # ════════════════════════════════════════════════════════════════════

    def _assign_room(
        self,
        batch: DistributionBatch,
        classroom: Classroom,
        date: str,
        used_in_session: set[int],
        resting_ids: set[int],
        date_excluded_ids: set[int],
        assignment_counts: dict[int, int],
    ) -> None:
        needed = classroom.num_invigilators
        if needed <= 0:
            return

        assigned_ids: list[int] = []

        for slot_index in range(needed):
            room_ids = set(assigned_ids)
            priorities = (
                DIRECTOR_PRIORITIES if slot_index == 0
                else INVIGILATOR_PRIORITIES
            )

            teacher = self._pick_from_priorities(
                priorities=priorities,
                room_ids=room_ids,
                used_in_session=used_in_session,
                resting_ids=resting_ids,
                date_excluded_ids=date_excluded_ids,
                assignment_counts=assignment_counts,
            )

            if not teacher:
                teacher = self._last_resort(room_ids, date_excluded_ids, assignment_counts)

            if not teacher:
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
            used_in_session.add(teacher.id)

    # ════════════════════════════════════════════════════════════════════
    #  الاختيار بثلاث مراحل
    # ════════════════════════════════════════════════════════════════════

    def _pick_from_priorities(
        self,
        priorities: list[tuple[str | None, list[str] | None]],
        room_ids: set[int],
        used_in_session: set[int],
        resting_ids: set[int],
        date_excluded_ids: set[int],
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """
        المرحلة 1 — كل الأولويات بدون مستراحين (لا تكرار من اليوم السابق).
        المرحلة 2 — كل الأولويات مع مستراحين (عند نفاد غير المستراحين).
        المرحلة 3 — رفع قيد الجلسة (نادر جداً — عند نفاد الجميع).
        """

        # ── المرحلة 1: بدون مستراحين ─────────────────────────────────────────
        for degree, titles in priorities:
            t = self._pick_fresh(
                degree, titles, room_ids, used_in_session,
                resting_ids, date_excluded_ids, assignment_counts,
            )
            if t:
                return t

        # ── المرحلة 2: مع مستراحين ───────────────────────────────────────────
        for degree, titles in priorities:
            t = self._pick_with_resting(
                degree, titles, room_ids, used_in_session,
                date_excluded_ids, assignment_counts,
            )
            if t:
                return t

        # ── المرحلة 3: رفع قيد الجلسة (نادر) ────────────────────────────────
        for degree, titles in priorities:
            t = self._pick_session_relaxed(
                degree, titles, room_ids, date_excluded_ids, assignment_counts,
            )
            if t:
                return t

        return None

    # ════════════════════════════════════════════════════════════════════
    #  دوال الاختيار لكل مرحلة
    # ════════════════════════════════════════════════════════════════════

    def _pick_fresh(
        self,
        require_degree: str | None,
        require_titles: list[str] | None,
        room_ids: set[int],
        used_in_session: set[int],
        resting_ids: set[int],
        date_excluded_ids: set[int],
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """المرحلة 1: يستبعد القاعة + الجلسة + الراحة."""
        qs = self._base_qs(require_degree, require_titles, date_excluded_ids)
        excl = room_ids | used_in_session | resting_ids
        return self._ordered_pick(qs.exclude(id__in=excl), assignment_counts)

    def _pick_with_resting(
        self,
        require_degree: str | None,
        require_titles: list[str] | None,
        room_ids: set[int],
        used_in_session: set[int],
        date_excluded_ids: set[int],
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """المرحلة 2: يستبعد القاعة + الجلسة فقط (يسمح بالمستراحين)."""
        qs = self._base_qs(require_degree, require_titles, date_excluded_ids)
        excl = room_ids | used_in_session
        return self._ordered_pick(qs.exclude(id__in=excl), assignment_counts)

    def _pick_session_relaxed(
        self,
        require_degree: str | None,
        require_titles: list[str] | None,
        room_ids: set[int],
        date_excluded_ids: set[int],
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """المرحلة 3: يستبعد القاعة فقط (يسمح بتكرار الاسم في قاعتَين)."""
        qs = self._base_qs(require_degree, require_titles, date_excluded_ids)
        t = self._ordered_pick(qs.exclude(id__in=room_ids), assignment_counts)
        if t:
            return t
        return self._ordered_pick(qs, assignment_counts)

    def _last_resort(
        self,
        room_ids: set[int],
        date_excluded_ids: set[int],
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """آخر ملجأ مطلق: أي مراقب لم يُعيَّن لهذه القاعة."""
        qs = (
            Teacher.objects
            .filter(is_excluded=False)
            .exclude(id__in=room_ids | date_excluded_ids)
        )
        return self._ordered_pick(qs, assignment_counts)

    # ════════════════════════════════════════════════════════════════════
    #  بناء QuerySet
    # ════════════════════════════════════════════════════════════════════

    @staticmethod
    def _base_qs(
        require_degree: str | None,
        require_titles: list[str] | None,
        date_excluded_ids: set[int],
    ):
        qs = (
            Teacher.objects
            .filter(is_excluded=False)
            .exclude(id__in=date_excluded_ids)
        )
        if require_degree:
            qs = qs.filter(degree=require_degree)
        if require_titles:
            qs = qs.filter(title__in=require_titles)
        return qs

    # ════════════════════════════════════════════════════════════════════
    #  الاختيار التسلسلي
    # ════════════════════════════════════════════════════════════════════

    @staticmethod
    def _ordered_pick(
        qs,
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """
        يختار الأمثل:
          1. أقل عدد توزيعات   ← العدالة أولاً
          2. الاسم أبجدياً     ← ثبات الترتيب
        """
        rows = list(qs.values_list("id", "name"))
        if not rows:
            return None

        rows.sort(key=lambda r: (
            assignment_counts.get(r[0], 0),
            r[1],
        ))

        return Teacher.objects.get(id=rows[0][0])

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
        """المراقبون من آخر batch — يأخذون راحة."""
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
