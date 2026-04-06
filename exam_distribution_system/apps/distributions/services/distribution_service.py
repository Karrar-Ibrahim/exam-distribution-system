"""
خدمة التوزيع الأساسية.

قواعد التوزيع:
  - الخانة الأولى في كل قاعة: يجب أن يكون دكتوراه (degree=دكتوراه) من أي نوع [1, 2]
    فإن لم يوجد دكتوراه → أي نوع [1, 2]
  - الخانات الباقية: النوع [1] فقط (مدرّس / مدرّس مساعد)
  - يُمنع تكرار المراقب في نفس القاعة
  - تدرّج في تخفيف القيود لضمان اكتمال العدد المطلوب (num_invigilators):
      المستوى 1 – استبعاد (نفس القاعة + اليوم + اليوم السابق)
      المستوى 2 – استبعاد (نفس القاعة + اليوم)
      المستوى 3 – استبعاد (نفس القاعة فقط)
      آخر ملجأ  – أي مراقب غير موجود في نفس القاعة
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta

from django.db.models import Count

from classrooms.models import Classroom
from teachers.models import Teacher, TeacherExclusion
from distributions.models import DistributionBatch, DistributionAssignment


class DistributionService:
    """يُنفّذ عملية التوزيع الكاملة."""

    def __init__(
        self,
        date: str,
        time: str,
        classroom_ids: list[int],
        lang: str = "ar",
        user_id: int | None = None,
        periodic_distribution: bool = False,
    ):
        self.raw_date = date
        self.time = time
        self.classroom_ids = classroom_ids
        self.lang = lang
        self.user_id = user_id
        self.periodic_distribution = periodic_distribution

    # ================================================================
    #  النقطة الرئيسية
    # ================================================================

    def execute(self) -> DistributionBatch:
        """ينفّذ التوزيع الكامل ويعيد الـ batch."""
        normalized_date = self._normalize_date(self.raw_date)

        # 1. إنشاء batch
        batch = DistributionBatch.objects.create(
            date=normalized_date,
            time=self.time,
            lang=self.lang,
            created_by_user_id=self.user_id,
        )

        # 2. جلب القاعات
        classrooms = self._get_classrooms()
        if not classrooms:
            return batch

        # 3. المراقبون المستثنَون في هذا التاريخ تحديداً
        date_excluded_ids: set[int] = set(
            TeacherExclusion.objects.filter(date=normalized_date)
            .values_list("teacher_id", flat=True)
        )

        # 4. المراقبون المستخدمون اليوم (من توزيعات سابقة لنفس اليوم)
        used_today_ids: set[int] = self._get_used_teacher_ids_for_date(normalized_date)

        # 5. المراقبون المستخدمون في اليوم العامل السابق
        prev_day = self._get_previous_working_day(normalized_date)
        used_prev_day_ids: set[int] = self._get_used_teacher_ids_for_date(prev_day)

        # 6. هل يوجد توزيع سابق لنفس اليوم؟
        same_day_exists = DistributionAssignment.objects.filter(
            date=normalized_date
        ).exists()

        # 7. توزيع على كل قاعة
        for classroom in classrooms:
            self._assign_teachers_for_room(
                batch=batch,
                classroom=classroom,
                date=normalized_date,
                used_today_ids=used_today_ids,
                used_prev_day_ids=used_prev_day_ids,
                same_day_exists=same_day_exists,
                date_excluded_ids=date_excluded_ids,
            )

        # 8. تحديث حالة active
        self._update_active_flags(normalized_date)

        return batch

    # ================================================================
    #  توزيع قاعة واحدة
    # ================================================================

    def _assign_teachers_for_room(
        self,
        batch: DistributionBatch,
        classroom: Classroom,
        date: str,
        used_today_ids: set[int],
        used_prev_day_ids: set[int],
        same_day_exists: bool,
        date_excluded_ids: set[int] | None = None,
    ) -> None:
        """
        يوزّع المراقبين على قاعة واحدة.

        الخانة 0 (الأولى):
          - يُفضَّل مراقب بدرجة دكتوراه (أي نوع [1, 2])
          - fallback: أي مراقب من النوعين [1, 2]

        الخانات 1+ (الباقية):
          - النوع [1] فقط (مدرّس / مدرّس مساعد)

        في كل خانة يُطبَّق تدرّج التخفيف تلقائياً داخل _pick_teacher.
        آخر ملجأ: أي مراقب لم يُعيَّن لهذه القاعة بعد.
        """
        needed = classroom.num_invigilators
        if needed <= 0:
            return

        excluded = date_excluded_ids or set()
        assigned_ids: list[int] = []

        for slot_index in range(needed):
            room_ids = set(assigned_ids)  # المُعيَّنون بالفعل لهذه القاعة
            teacher = None

            if slot_index == 0:
                # ── الخانة الأولى: دكتوراه أولاً ──
                teacher = self._pick_teacher(
                    allowed_types=[1, 2],
                    require_doctor=True,
                    room_ids=room_ids,
                    used_today_ids=used_today_ids,
                    used_prev_day_ids=used_prev_day_ids,
                    same_day_exists=same_day_exists,
                    date_excluded_ids=excluded,
                )
                if not teacher:
                    # fallback: أي نوع بدون شرط الدكتوراه
                    teacher = self._pick_teacher(
                        allowed_types=[1, 2],
                        require_doctor=False,
                        room_ids=room_ids,
                        used_today_ids=used_today_ids,
                        used_prev_day_ids=used_prev_day_ids,
                        same_day_exists=same_day_exists,
                        date_excluded_ids=excluded,
                    )
            else:
                # ── الخانات الباقية: نوع 1 فقط ──
                teacher = self._pick_teacher(
                    allowed_types=[1],
                    require_doctor=False,
                    room_ids=room_ids,
                    used_today_ids=used_today_ids,
                    used_prev_day_ids=used_prev_day_ids,
                    same_day_exists=same_day_exists,
                    date_excluded_ids=excluded,
                )

            # ── آخر ملجأ: أي مراقب لم يُعيَّن لهذه القاعة (الاستثناءات تبقى سارية) ──
            if not teacher:
                fallback_qs = Teacher.objects.exclude(id__in=room_ids | excluded)
                teacher = self._random_pick(fallback_qs)

            if not teacher:
                # لا يوجد أي مراقب في قاعدة البيانات
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
            used_today_ids.add(teacher.id)

    # ================================================================
    #  اختيار مراقب
    # ================================================================

    def _pick_teacher(
        self,
        allowed_types: list[int],
        require_doctor: bool,
        room_ids: set[int],
        used_today_ids: set[int],
        used_prev_day_ids: set[int],
        same_day_exists: bool,
        date_excluded_ids: set[int] | None = None,
    ) -> Teacher | None:
        """
        يختار مراقباً بتدرّج في تخفيف القيود:

        ─ عند وجود توزيع سابق لنفس اليوم:
            مستوى 1: استبعاد (القاعة + اليوم)
            مستوى 2: استبعاد (القاعة فقط) — السماح بمن استُخدم اليوم

        ─ عند عدم وجود توزيع سابق:
            • إذا periodic_distribution: اختر الأقل usage_count
            • وإلا (عشوائي):
                مستوى 1: استبعاد (القاعة + اليوم + الأمس)
                مستوى 2: استبعاد (القاعة + اليوم)
                مستوى 3: استبعاد (القاعة فقط)
        """
        excluded = date_excluded_ids or set()
        base_qs = Teacher.objects.filter(type__in=allowed_types).exclude(id__in=excluded)
        if require_doctor:
            base_qs = base_qs.filter(degree="دكتوراه")

        if same_day_exists:
            # مستوى 1: لم يُستخدم اليوم ولم يُعيَّن لهذه القاعة
            candidates = base_qs.exclude(id__in=room_ids | used_today_ids)
            if candidates.exists():
                return self._random_pick(candidates)

            # مستوى 2: فقط استبعاد نفس القاعة
            candidates = base_qs.exclude(id__in=room_ids)
            if candidates.exists():
                return self._random_pick(candidates)

            return None

        # ── لا يوجد توزيع سابق لنفس اليوم ──

        if self.periodic_distribution:
            return self._pick_by_usage_count(
                base_qs=base_qs,
                room_ids=room_ids,
                used_today_ids=used_today_ids,
            )

        # عشوائي مع تدرّج التخفيف

        # مستوى 1: استبعاد (القاعة + اليوم + الأمس)
        candidates = base_qs.exclude(id__in=room_ids | used_today_ids | used_prev_day_ids)
        if candidates.exists():
            return self._random_pick(candidates)

        # مستوى 2: استبعاد (القاعة + اليوم) — الاستغناء عن قيد الأمس
        candidates = base_qs.exclude(id__in=room_ids | used_today_ids)
        if candidates.exists():
            return self._random_pick(candidates)

        # مستوى 3: استبعاد القاعة فقط — السماح بمن استُخدم اليوم
        candidates = base_qs.exclude(id__in=room_ids)
        if candidates.exists():
            return self._random_pick(candidates)

        return None

    @staticmethod
    def _pick_by_usage_count(
        base_qs,
        room_ids: set[int],
        used_today_ids: set[int],
    ) -> Teacher | None:
        """
        يختار المراقب الأقل عدد مرات استخدام (usage_count).
        يُطبّق نفس التدرّج: (القاعة + اليوم) → (القاعة فقط) → أي أحد.
        """
        for exclude in [room_ids | used_today_ids, room_ids, set()]:
            candidates = base_qs.exclude(id__in=exclude) if exclude else base_qs
            if candidates.exists():
                return (
                    candidates
                    .annotate(usage_count=Count("distribution_assignments"))
                    .order_by("usage_count")
                    .first()
                )
        return None

    @staticmethod
    def _random_pick(queryset) -> Teacher | None:
        """يختار مراقباً عشوائياً من مجموعة."""
        ids = list(queryset.values_list("id", flat=True))
        if not ids:
            return None
        chosen_id = random.choice(ids)
        return queryset.get(id=chosen_id)

    # ================================================================
    #  Helpers
    # ================================================================

    @staticmethod
    def get_teacher_display_name(teacher: Teacher) -> str:
        return teacher.formatted_name

    def _get_classrooms(self) -> list[Classroom]:
        qs = Classroom.objects.all()
        if self.classroom_ids:
            qs = qs.filter(id__in=self.classroom_ids)
        return list(qs.order_by("room_number"))

    @staticmethod
    def _get_used_teacher_ids_for_date(date_str: str) -> set[int]:
        return set(
            DistributionAssignment.objects.filter(date=date_str)
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
    def _get_previous_working_day(date_str: str) -> str:
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return date_str
        prev = dt - timedelta(days=1)
        if prev.weekday() == 4:  # الجمعة
            prev -= timedelta(days=1)
        return prev.strftime("%Y-%m-%d")

    @staticmethod
    def _update_active_flags(current_date: str) -> None:
        DistributionAssignment.objects.all().update(active=False)
        DistributionAssignment.objects.filter(date=current_date).update(active=True)
