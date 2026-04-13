from __future__ import annotations

from django.db.models import Count, QuerySet, Prefetch

from .models import DistributionBatch, DistributionAssignment


def get_batches_with_stats() -> QuerySet:
    """
    يُرجع كل الدفعات مع:
      - عدد القاعات المميزة (classrooms_count)
      - عدد المراقبين المميزين (teachers_count)
      - assignments محمّلة مسبقاً
    """
    return (
        DistributionBatch.objects.prefetch_related(
            Prefetch(
                "assignments",
                queryset=DistributionAssignment.objects.select_related(
                    "classroom", "teacher"
                ).order_by("room_label"),
            )
        )
        .annotate(
            classrooms_count=Count(
                "assignments__classroom", distinct=True
            ),
            teachers_count=Count(
                "assignments__teacher", distinct=True
            ),
        )
        .order_by("-id")
    )


def get_batch_by_id(batch_id: int) -> DistributionBatch | None:
    """يُرجع دفعة واحدة مع assignments أو None."""
    qs = get_batches_with_stats().filter(pk=batch_id)
    return qs.first()


def get_assignments_for_export(batch_id: int | None = None) -> QuerySet:
    """يُرجع assignments للتصدير، مع إمكانية تصفية بدفعة واحدة."""
    qs = DistributionAssignment.objects.select_related(
        "teacher", "classroom", "batch"
    ).order_by("batch__date", "room_label")
    if batch_id:
        qs = qs.filter(batch_id=batch_id)
    return qs


def get_teacher_stats(search: str = "", date: str = ""):
    """
    يُرجع QuerySet للمراقبين مع:
      - total_count: عدد مرات المراقبة (مفلتر بالتاريخ إذا أُعطي)
      - filtered_assignments: قائمة التعيينات المرتبطة (مفلترة بالتاريخ إذا أُعطي)
    """
    from teachers.models import Teacher
    from django.db.models import Count, Q

    # بناء قائمة التعيينات للـ prefetch (مع فلتر التاريخ إن وُجد)
    assignment_prefetch_qs = (
        DistributionAssignment.objects
        .order_by("-date", "-id")
    )
    if date:
        assignment_prefetch_qs = assignment_prefetch_qs.filter(date=date)

    # بناء الـ annotation للعدد
    if date:
        count_annotation = Count(
            "distribution_assignments",
            filter=Q(distribution_assignments__date=date),
            distinct=True,
        )
    else:
        count_annotation = Count("distribution_assignments", distinct=True)

    qs = (
        Teacher.objects
        .filter(is_excluded=False)       # ← لا نعرض المستثنين في الإحصائيات
        .prefetch_related(
            Prefetch(
                "distribution_assignments",
                queryset=assignment_prefetch_qs,
                to_attr="filtered_assignments",
            )
        )
        .annotate(total_count=count_annotation)
        # لا نشترط total_count > 0 حتى يظهر المدرّسون الجدد الذين لم يراقبوا بعد
    )

    if search:
        qs = qs.filter(name__icontains=search)

    return qs.order_by("-total_count", "name")
