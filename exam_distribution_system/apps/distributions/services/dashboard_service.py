"""
خدمة لوحة المعلومات (Dashboard).
"""

from django.db.models import Count

from teachers.models import Teacher
from classrooms.models import Classroom
from exams.models import Exam
from distributions.selectors import get_batches_with_stats

# ترتيب الشهادات من الأعلى إلى الأدنى
_DEGREE_ORDER = ["دكتوراه", "ماجستير", "بكالوريوس"]


class DashboardService:
    """يُجمّع بيانات لوحة المعلومات."""

    @staticmethod
    def get_dashboard_data() -> dict:
        # عدد المراقبين الفعّالين فقط (غير المستثنَين دائماً)
        active_teachers = Teacher.objects.filter(is_excluded=False)
        total_teachers    = active_teachers.count()
        total_excluded    = Teacher.objects.filter(is_excluded=True).count()
        total_classrooms  = Classroom.objects.count()
        total_exams       = Exam.objects.count()
        batches           = get_batches_with_stats()[:10]  # آخر 10 دفعات

        # ── تفصيل هيئة التدريس حسب الشهادة واللقب (فعّالون فقط) ──────────
        rows = (
            active_teachers
            .values("degree", "title")
            .annotate(count=Count("id"))
            .order_by("degree", "title")
        )

        # تجميع النتائج في dict مؤقت
        degree_map: dict[str, dict] = {}
        for row in rows:
            deg   = row["degree"]
            title = row["title"]
            cnt   = row["count"]
            if deg not in degree_map:
                degree_map[deg] = {"total": 0, "titles": []}
            degree_map[deg]["total"] += cnt
            degree_map[deg]["titles"].append({"title": title, "count": cnt})

        # رتّب الألقاب داخل كل شهادة تنازلياً حسب العدد
        for deg in degree_map:
            degree_map[deg]["titles"].sort(key=lambda x: -x["count"])

        # أعِد البيانات بالترتيب المطلوب
        teacher_breakdown = [
            {
                "degree": deg,
                "total":  degree_map[deg]["total"],
                "titles": degree_map[deg]["titles"],
            }
            for deg in _DEGREE_ORDER
            if deg in degree_map
        ]

        return {
            "total_teachers":     total_teachers,
            "total_excluded":     total_excluded,
            "total_classrooms":   total_classrooms,
            "total_exams":        total_exams,
            "batches":            batches,
            "teacher_breakdown":  teacher_breakdown,
        }
