"""
خدمة التوزيع — النظام التسلسلي العادل.

قواعد التوزيع:
  ┌──────────────────────────────────────────────────────────────────────┐
  │  خانة مدير القاعة (الخانة الأولى — slot 0)                          │
  │    1. دكتوراه + استاذ                                               │
  │    2. دكتوراه + استاذ مساعد                                         │
  │    3. دكتوراه + مدرس                                                │
  │    4. ماجستير + استاذ                                               │
  │    5. ماجستير + استاذ مساعد                                         │
  │    fallback: أي متاح                                                │
  │                                                                      │
  │  الخانات الباقية (مراقبون — slot 1+)                                │
  │    1. مدرس مساعد (جميعهم)                                           │
  │    2. مدرس (جميعهم — عند استنفاذ مدرس مساعد)                        │
  │       يشمل مدرس دكتور ويمكن أن يكون اثنين مدرس دكتور بالقاعة      │
  │    fallback: أي متاح                                                │
  └──────────────────────────────────────────────────────────────────────┘

  العدالة عبر الأولويات:
    • الترتيب: (عدد المراقبات ← رقم الأولوية ← الاسم أبجدياً)
    • مراقب بصفر مراقبات من أولوية 5 يُختار قبل مراقب بمراقبة واحدة
      من أولوية 1 ← هذا يضمن مشاركة الجميع
    • عند التساوي في العدد: الأولوية الأعلى تفوز

  قواعد صارمة:
    • لا تكرار أبداً في نفس اليوم (الاسم في قاعة واحدة فقط)
    • لا تكرار في اليوم التالي إلا عند الضرورة القصوى
    • الجميع يأخذون راحة بالتساوي بدون استثناء

  استراتيجية الاختيار — ثلاث مراحل:
    المرحلة 1: كل الأولويات — بدون مستراحين (عدالة عبر كل الأولويات)
    المرحلة 2: كل الأولويات — مع السماح بالمستراحين
    المرحلة 3: أي متاح — رفع كل القيود (نادر)
"""

from __future__ import annotations

from datetime import datetime

from django.db.models import Count

from classrooms.models import Classroom
from teachers.models import Teacher, TeacherExclusion
from distributions.models import DistributionBatch, DistributionAssignment


# ── أولويات خانة مدير القاعة (slot 0) ───────────────────────────────────────
DIRECTOR_PRIORITIES: list[tuple[str | None, list[str] | None]] = [
    ("دكتوراه", ["استاذ"]),           # 0 — دكتوراه استاذ
    ("دكتوراه", ["استاذ مساعد"]),     # 1 — دكتوراه استاذ مساعد
    ("دكتوراه", ["مدرس"]),            # 2 — دكتوراه مدرس
    ("ماجستير", ["استاذ"]),           # 3 — ماجستير استاذ
    ("ماجستير", ["استاذ مساعد"]),     # 4 — ماجستير استاذ مساعد
]

# ── أولويات خانة المراقب العادي (slot 1+) ────────────────────────────────────
INVIGILATOR_PRIORITIES: list[tuple[str | None, list[str] | None]] = [
    (None, ["مدرس مساعد"]),           # 0 — مدرس مساعد (جميعهم)
    (None, ["مدرس"]),                 # 1 — مدرس (جميعهم — يشمل مدرس دكتور)
]


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

        # 1. المراقبون المستحقون للراحة — جميع من عمل في آخر يوم توزيع
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

        # 4. المستثنَون يدوياً في هذا التاريخ
        date_excluded_ids: set[int] = set(
            TeacherExclusion.objects.filter(date=normalized_date)
            .values_list("teacher_id", flat=True)
        )

        # 5. عدد مرات التوزيع لكل مراقب (للعدالة)
        assignment_counts: dict[int, int] = dict(
            DistributionAssignment.objects
            .values("teacher_id")
            .annotate(c=Count("id"))
            .values_list("teacher_id", "c")
        )

        # 6. المستخدَمون في هذه الجلسة — يمنع تكرار الاسم في نفس اليوم
        used_in_session: set[int] = set()

        # 7. توزيع على كل قاعة
        for classroom in classrooms:
            self._assign_room(
                batch=batch,
                classroom=classroom,
                date=normalized_date,
                used_in_session=used_in_session,
                resting_ids=resting_ids,
                date_excluded_ids=date_excluded_ids,
                assignment_counts=assignment_counts,
            )

        # 8. تحديث حالة active
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

            teacher = self._pick_teacher(
                priorities=priorities,
                room_ids=room_ids,
                used_in_session=used_in_session,
                resting_ids=resting_ids,
                date_excluded_ids=date_excluded_ids,
                assignment_counts=assignment_counts,
            )

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
            # تحديث العدد فوراً حتى يؤثر على الخانات اللاحقة
            assignment_counts[teacher.id] = assignment_counts.get(teacher.id, 0) + 1

    # ════════════════════════════════════════════════════════════════════
    #  الاختيار العادل عبر كل الأولويات
    # ════════════════════════════════════════════════════════════════════

    def _pick_teacher(
        self,
        priorities: list[tuple[str | None, list[str] | None]],
        room_ids: set[int],
        used_in_session: set[int],
        resting_ids: set[int],
        date_excluded_ids: set[int],
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """
        يجمع المرشحين من كل الأولويات ويرتبهم بـ:
          (عدد المراقبات ← رقم الأولوية ← الاسم)

        مراقب بصفر مراقبات من أولوية 5 يُختار قبل مراقب بمراقبة واحدة من أولوية 1.
        هذا يضمن مشاركة الجميع مع احترام الأولوية عند التساوي.
        """

        # ── المرحلة 1: بدون مستراحين ─────────────────────────────────
        excl = room_ids | used_in_session | resting_ids | date_excluded_ids
        t = self._fair_pick(priorities, excl, assignment_counts)
        if t:
            return t

        # ── المرحلة 2: مع مستراحين ───────────────────────────────────
        excl = room_ids | used_in_session | date_excluded_ids
        t = self._fair_pick(priorities, excl, assignment_counts)
        if t:
            return t

        # ── المرحلة 3: أي متاح (رفع قيد الجلسة — نادر) ──────────────
        excl = room_ids | date_excluded_ids
        t = self._fair_pick(priorities, excl, assignment_counts)
        if t:
            return t

        # ── المرحلة 4: ملجأ أخير — أي مراقب غير مستثنى ───────────────
        qs = (
            Teacher.objects
            .filter(is_excluded=False)
            .exclude(id__in=room_ids | date_excluded_ids)
        )
        return self._ordered_pick(qs, assignment_counts)

    # ════════════════════════════════════════════════════════════════════
    #  الاختيار العادل — يجمع كل الأولويات ويرتب
    # ════════════════════════════════════════════════════════════════════

    def _fair_pick(
        self,
        priorities: list[tuple[str | None, list[str] | None]],
        exclude_ids: set[int],
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """
        يجمع المرشحين من كل الأولويات المحددة (بدون fallback).
        الترتيب: (عدد_المراقبات, رقم_الأولوية, الاسم)
        → العدالة أولاً، ثم الأولوية، ثم الأبجدية.
        """
        seen: dict[int, tuple[int, int, str]] = {}

        for pri_idx, (degree, titles) in enumerate(priorities):
            qs = self._base_qs(degree, titles, exclude_ids)
            rows = list(qs.values_list("id", "name"))
            for tid, tname in rows:
                if tid not in seen:
                    count = assignment_counts.get(tid, 0)
                    seen[tid] = (count, pri_idx, tname)

        if not seen:
            return None

        # الترتيب: أقل عدد → أعلى أولوية → أبجدياً
        best_id = min(seen, key=lambda tid: seen[tid])
        return Teacher.objects.get(id=best_id)

    # ════════════════════════════════════════════════════════════════════
    #  بناء QuerySet
    # ════════════════════════════════════════════════════════════════════

    @staticmethod
    def _base_qs(
        require_degree: str | None,
        require_titles: list[str] | None,
        exclude_ids: set[int],
    ):
        qs = (
            Teacher.objects
            .filter(is_excluded=False)
            .exclude(id__in=exclude_ids)
        )
        if require_degree:
            qs = qs.filter(degree=require_degree)
        if require_titles:
            qs = qs.filter(title__in=require_titles)
        return qs

    # ════════════════════════════════════════════════════════════════════
    #  الاختيار التسلسلي (للملجأ الأخير فقط)
    # ════════════════════════════════════════════════════════════════════

    @staticmethod
    def _ordered_pick(
        qs,
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """ملجأ أخير: يختار الأقل توزيعاً ثم أبجدياً."""
        rows = list(qs.values_list("id", "name"))
        if not rows:
            return None
        rows.sort(key=lambda r: (assignment_counts.get(r[0], 0), r[1]))
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
        """المراقبون من آخر يوم توزيع كامل — يأخذون راحة.

        يجلب جميع المراقبين من كل الـ batches في آخر يوم توزيع
        (صباحي + مسائي) وليس فقط آخر batch واحد.
        """
        last_batch = (
            DistributionBatch.objects
            .order_by("-id")
            .values("date")
            .first()
        )
        if not last_batch:
            return set()

        last_date = last_batch["date"]

        last_date_batch_ids = list(
            DistributionBatch.objects
            .filter(date=last_date)
            .values_list("id", flat=True)
        )

        return set(
            DistributionAssignment.objects
            .filter(batch_id__in=last_date_batch_ids)
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
