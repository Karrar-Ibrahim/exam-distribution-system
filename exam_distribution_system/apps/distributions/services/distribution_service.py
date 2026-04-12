"""
خدمة التوزيع — النظام التسلسلي العادل.

قواعد التوزيع:
  ┌──────────────────────────────────────────────────────────────────────┐
  │  خانة مدير القاعة (الخانة الأولى)                                   │
  │    1. ماجستير + (استاذ | استاذ مساعد)   ← المديرون الأصليون        │
  │    2. دكتوراه + (استاذ | استاذ مساعد)   ← عند نفاد ماجستير المدراء │
  │    3. دكتوراه + مدرس                    ← عند نفاد الألقاب العليا   │
  │    4. أي متاح                           ← آخر ملجأ                  │
  │                                                                      │
  │  الخانات الباقية (مراقبون عاديون)                                   │
  │    1. ماجستير + مدرس                   ← الأولوية الأولى            │
  │    2. ماجستير + مدرس مساعد             ← الأولوية الثانية           │
  │    3. أي متاح                           ← عند النفاد                 │
  │                                                                      │
  │  قاعدة التكرار (عدم المراقبة بعد مراقبة):                           │
  │    • جميع المراقبين يأخذون راحة إلزامية بعد كل دورة                 │
  │    • استثناء: ماجستير + مدرس مساعد → لا راحة، يُكررون عند الحاجة  │
  └──────────────────────────────────────────────────────────────────────┘

  الاختيار تسلسلي (لا عشوائية):
    • الأقل توزيعاً يُختار أولاً  ← العدالة
    • عند التساوي: الشهادة الأعلى → اللقب الأعلى → الاسم أبجدياً

  تدرّج تخفيف القيود داخل كل خانة:
    المستوى 1: استبعاد (القاعة + الجلسة الحالية + الراحة)
    المستوى 2: استبعاد (القاعة + الجلسة الحالية)   — رفع قيد الراحة
    المستوى 3: استبعاد (القاعة فقط)
    المستوى 4: أي أحد من هذه الفئة   — بلا قيود
    آخر ملجأ : أي مراقب غير محظور لم يُعيَّن لهذه القاعة
"""

from __future__ import annotations

from datetime import datetime

from django.db.models import Count

from classrooms.models import Classroom
from teachers.models import Teacher, TeacherExclusion
from distributions.models import DistributionBatch, DistributionAssignment


# ── أولوية الشهادة (الأصغر = الأعلى أولوية) ──────────────────────────────────
DEGREE_PRIORITY: dict[str, int] = {
    "دكتوراه":   0,
    "ماجستير":   1,
    "بكالوريوس": 2,
}

# ── أولوية اللقب العلمي (الأصغر = الأعلى أولوية) ────────────────────────────
TITLE_PRIORITY: dict[str, int] = {
    "استاذ":        0,
    "استاذ مساعد":  1,
    "مدرس":         2,
    "مدرس مساعد":   3,
}

# ── الألقاب العليا (مدراء القاعات) ───────────────────────────────────────────
DIRECTOR_TITLES: list[str] = ["استاذ", "استاذ مساعد"]

# ── الفئة القابلة للتكرار (لا تأخذ راحة بين الدورات) ────────────────────────
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
        periodic_distribution: bool = False,   # محجوز للتوافق — لا يُستخدم
        require_phd_first_slot: bool = True,   # محجوز للتوافق — لا يُستخدم
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
        """ينفّذ التوزيع الكامل ويعيد الـ batch الجديد."""
        normalized_date = self._normalize_date(self.raw_date)

        # 1. المراقبون المستحقون للراحة (من آخر batch) — يُحسب قبل إنشاء الجديد
        resting_ids: set[int] = self._get_resting_ids()

        # 2. ماجستير مدرس مساعد لا يأخذون راحة — احذفهم من القائمة
        repeatable_ids: set[int] = set(
            Teacher.objects
            .filter(degree=REPEATABLE_DEGREE, title=REPEATABLE_TITLE, is_excluded=False)
            .values_list("id", flat=True)
        )
        effective_resting_ids: set[int] = resting_ids - repeatable_ids

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

        # 5. المراقبون المستثنَون يدوياً في هذا التاريخ (لا تُخفَّف أبداً)
        date_excluded_ids: set[int] = set(
            TeacherExclusion.objects.filter(date=normalized_date)
            .values_list("teacher_id", flat=True)
        )

        # 6. عدد مرات توزيع كل مراقب (query واحد يُعاد استخدامه)
        assignment_counts: dict[int, int] = dict(
            DistributionAssignment.objects
            .values("teacher_id")
            .annotate(c=Count("id"))
            .values_list("teacher_id", "c")
        )

        # 7. المراقبون المستخدَمون في هذه الجلسة (تتراكم عبر القاعات)
        used_in_session: set[int] = set()

        # 8. توزيع على كل قاعة
        for classroom in classrooms:
            self._assign_teachers_for_room(
                batch=batch,
                classroom=classroom,
                date=normalized_date,
                used_in_session=used_in_session,
                resting_ids=effective_resting_ids,
                date_excluded_ids=date_excluded_ids,
                assignment_counts=assignment_counts,
            )

        # 9. تحديث حالة active
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
    ) -> None:
        """
        الخانة 0 — مدير القاعة:
          1. ماجستير + (استاذ | استاذ مساعد)
          2. دكتوراه + (استاذ | استاذ مساعد)
          3. دكتوراه + مدرس
          4. أي متاح

        الخانات 1+ — مراقبون:
          1. ماجستير + مدرس
          2. ماجستير + مدرس مساعد
          3. أي متاح

        كل خطوة تمر بأربعة مستويات تخفيف للقيود قبل الانتقال للخطوة التالية.
        """
        needed = classroom.num_invigilators
        if needed <= 0:
            return

        assigned_ids: list[int] = []

        for slot_index in range(needed):
            room_ids = set(assigned_ids)
            teacher: Teacher | None = None

            # اختصار مشترك لتمرير المعاملات
            kw = dict(
                room_ids=room_ids,
                used_in_session=used_in_session,
                resting_ids=resting_ids,
                date_excluded_ids=date_excluded_ids,
                assignment_counts=assignment_counts,
            )

            if slot_index == 0:
                # ── الخانة الأولى: مدير القاعة ───────────────────────────────

                # 1. ماجستير + استاذ | استاذ مساعد (المدراء الأصليون)
                teacher = self._pick_teacher(
                    require_degree="ماجستير",
                    require_titles=DIRECTOR_TITLES,
                    **kw,
                )
                # 2. دكتوراه + استاذ | استاذ مساعد
                if not teacher:
                    teacher = self._pick_teacher(
                        require_degree="دكتوراه",
                        require_titles=DIRECTOR_TITLES,
                        **kw,
                    )
                # 3. دكتوراه + مدرس (عند نفاد الألقاب العليا)
                if not teacher:
                    teacher = self._pick_teacher(
                        require_degree="دكتوراه",
                        require_titles=["مدرس"],
                        **kw,
                    )
                # 4. أي متاح (آخر ملجأ للمدير)
                if not teacher:
                    teacher = self._pick_teacher(
                        require_degree=None,
                        require_titles=None,
                        **kw,
                    )

            else:
                # ── الخانات الباقية: مراقب عادي ──────────────────────────────

                # 1. ماجستير + مدرس
                teacher = self._pick_teacher(
                    require_degree="ماجستير",
                    require_titles=["مدرس"],
                    **kw,
                )
                # 2. ماجستير + مدرس مساعد
                if not teacher:
                    teacher = self._pick_teacher(
                        require_degree="ماجستير",
                        require_titles=["مدرس مساعد"],
                        **kw,
                    )
                # 3. أي متاح (عند نفاد الماجستير)
                if not teacher:
                    teacher = self._pick_teacher(
                        require_degree=None,
                        require_titles=None,
                        **kw,
                    )

            # ── آخر ملجأ مطلق: أي مراقب لم يُعيَّن لهذه القاعة ────────────
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
            used_in_session.add(teacher.id)    # تراكم فوري عبر القاعات

    # ════════════════════════════════════════════════════════════════════
    #  اختيار مراقب — تدرّج تخفيف القيود
    # ════════════════════════════════════════════════════════════════════

    def _pick_teacher(
        self,
        require_degree: str | None,
        require_titles: list[str] | None,
        room_ids: set[int],
        used_in_session: set[int],
        resting_ids: set[int],
        date_excluded_ids: set[int],
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """
        يختار المراقب الأمثل بأربعة مستويات من تخفيف القيود:
          1. استبعاد (القاعة + الجلسة + الراحة)     ← أقوى
          2. استبعاد (القاعة + الجلسة)              ← رفع الراحة
          3. استبعاد (القاعة فقط)                   ← رفع الجلسة
          4. أي أحد من هذه الفئة                    ← بلا قيود
        """
        base_qs = (
            Teacher.objects
            .filter(is_excluded=False)
            .exclude(id__in=date_excluded_ids)
        )
        if require_degree:
            base_qs = base_qs.filter(degree=require_degree)
        if require_titles:
            base_qs = base_qs.filter(title__in=require_titles)

        # المستوى 1
        excl = room_ids | used_in_session | resting_ids
        teacher = self._ordered_pick(base_qs.exclude(id__in=excl), assignment_counts)
        if teacher:
            return teacher

        # المستوى 2: رفع قيد الراحة
        excl = room_ids | used_in_session
        teacher = self._ordered_pick(base_qs.exclude(id__in=excl), assignment_counts)
        if teacher:
            return teacher

        # المستوى 3: رفع قيد الجلسة
        teacher = self._ordered_pick(base_qs.exclude(id__in=room_ids), assignment_counts)
        if teacher:
            return teacher

        # المستوى 4: أي أحد من هذه الفئة
        return self._ordered_pick(base_qs, assignment_counts)

    def _last_resort(
        self,
        room_ids: set[int],
        date_excluded_ids: set[int],
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """
        آخر ملجأ مطلق: أي مراقب غير محظور لم يُعيَّن لهذه القاعة.
        يحترم date_excluded_ids دائماً — يتجاهل باقي القيود.
        """
        qs = (
            Teacher.objects
            .filter(is_excluded=False)
            .exclude(id__in=room_ids | date_excluded_ids)
        )
        return self._ordered_pick(qs, assignment_counts)

    # ════════════════════════════════════════════════════════════════════
    #  الاختيار التسلسلي
    # ════════════════════════════════════════════════════════════════════

    @staticmethod
    def _ordered_pick(
        qs,
        assignment_counts: dict[int, int],
    ) -> Teacher | None:
        """
        يختار المراقب الأمثل وفق:
          1. أقل عدد توزيعات   ← العدالة أولاً
          2. أعلى شهادة علمية  (دكتوراه > ماجستير > بكالوريوس)
          3. أعلى لقب علمي     (استاذ > استاذ مساعد > مدرس > مدرس مساعد)
          4. الاسم أبجدياً     ← ثبات الترتيب عند التساوي التام
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
        """
        المراقبون الذين ظهروا في آخر batch يأخذون راحة إلزامية.
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
