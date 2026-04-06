"""
خدمة لوحة المعلومات (Dashboard).
"""

from teachers.models import Teacher
from classrooms.models import Classroom
from exams.models import Exam
from distributions.selectors import get_batches_with_stats


class DashboardService:
    """يُجمّع بيانات لوحة المعلومات."""

    @staticmethod
    def get_dashboard_data() -> dict:
        total_teachers = Teacher.objects.count()
        total_classrooms = Classroom.objects.count()
        total_exams = Exam.objects.count()
        batches = get_batches_with_stats()[:10]  # آخر 10 دفعات

        return {
            "total_teachers": total_teachers,
            "total_classrooms": total_classrooms,
            "total_exams": total_exams,
            "batches": batches,
        }
