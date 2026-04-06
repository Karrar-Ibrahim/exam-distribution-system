from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse

from core.pagination import CustomPagination
from core.activity import log_activity
from .models import DistributionBatch, DistributionAssignment
from .permissions import BaseDistributionPermission
from .selectors import get_batches_with_stats, get_batch_by_id, get_teacher_stats
from .serializers import (
    DistributionCreateSerializer,
    DistributionBatchSerializer,
    DashboardSerializer,
    TeacherStatSerializer,
)
from .services.distribution_service import DistributionService
from .services.dashboard_service import DashboardService
from .services.export_service import ExportService


class DistributionCreateView(APIView):
    """POST /api/distributions/create/ — إنشاء توزيع جديد."""

    permission_classes = [IsAuthenticated, BaseDistributionPermission]

    def post(self, request):
        serializer = DistributionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        service = DistributionService(
            date=data["date"],
            time=data["time"],
            classroom_ids=data.get("classroom_ids", []),
            lang=data.get("lang", "ar"),
            user_id=request.user.id,
            periodic_distribution=data.get("periodic_distribution", False),
        )

        batch = service.execute()

        log_activity(
            user=request.user,
            action='distribute',
            module='distributions',
            description=f'توزيع جديد بتاريخ {data["date"]} الوقت {data["time"]}',
            request=request,
        )

        # أعد قراءة الـ batch مع annotations
        batch_with_stats = get_batch_by_id(batch.id)
        result = DistributionBatchSerializer(batch_with_stats).data

        return Response(
            {"success": True, "message": "تم التوزيع بنجاح.", "data": result},
            status=status.HTTP_201_CREATED,
        )


class DistributionBatchListView(generics.ListAPIView):
    """
    GET /api/distributions/batches/ — قائمة كل الدفعات.
    لكل batch: عدد القاعات، عدد المراقبين، و assignments.
    """

    permission_classes = [IsAuthenticated, BaseDistributionPermission]
    serializer_class = DistributionBatchSerializer
    pagination_class = CustomPagination

    def get_queryset(self):
        return get_batches_with_stats()


class DistributionBatchDeleteView(APIView):
    """DELETE /api/distributions/batches/{id}/ — حذف دفعة وكل assignments المرتبطة."""

    permission_classes = [IsAuthenticated, BaseDistributionPermission]

    def delete(self, request, pk):
        try:
            batch = DistributionBatch.objects.get(pk=pk)
        except DistributionBatch.DoesNotExist:
            return Response(
                {"success": False, "message": "الدفعة غير موجودة."},
                status=status.HTTP_404_NOT_FOUND,
            )

        batch_date = batch.date
        batch.delete()  # CASCADE يحذف assignments
        log_activity(
            user=request.user,
            action='delete',
            module='distributions',
            description=f'حذف دفعة توزيع بتاريخ {batch_date}',
            request=request,
        )
        return Response(
            {"success": True, "message": "تم حذف الدفعة بنجاح."},
            status=status.HTTP_200_OK,
        )


class DashboardView(APIView):
    """GET /api/distributions/dashboard/ — لوحة المعلومات."""

    permission_classes = [IsAuthenticated, BaseDistributionPermission]

    def get(self, request):
        data = DashboardService.get_dashboard_data()
        serializer = DashboardSerializer(data)
        return Response(serializer.data)


class ExportView(APIView):
    """
    GET /api/distributions/export/
    GET /api/distributions/export/?id=123
    """

    permission_classes = [IsAuthenticated, BaseDistributionPermission]

    def get(self, request):
        batch_id = request.query_params.get("id")
        if batch_id:
            try:
                batch_id = int(batch_id)
            except (ValueError, TypeError):
                return Response(
                    {"success": False, "message": "معرّف الدفعة غير صالح."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        buffer = ExportService.export(batch_id=batch_id)

        filename = "distributions.xlsx"
        if batch_id:
            filename = f"distribution_batch_{batch_id}.xlsx"

        response = HttpResponse(
            buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class TeacherStatsView(APIView):
    """
    GET /api/distributions/teacher-stats/
    إحصائيات المراقبين: عدد مرات المراقبة مع تفاصيل كل تعيين.
    يدعم: search (اسم المراقب) + date (تصفية بالتاريخ).
    """
    permission_classes = [IsAuthenticated, BaseDistributionPermission]

    def get(self, request):
        search = request.query_params.get("search", "").strip()
        date = request.query_params.get("date", "").strip()

        qs = get_teacher_stats(search=search, date=date)

        # إجمالي التعيينات (قبل التصفح)
        total_assignments = DistributionAssignment.objects.count()
        if date:
            total_assignments = DistributionAssignment.objects.filter(date=date).count()

        paginator = CustomPagination()
        page = paginator.paginate_queryset(qs, request)

        serializer = TeacherStatSerializer(page, many=True)
        response = paginator.get_paginated_response(serializer.data)
        response.data["total_assignments"] = total_assignments
        return response


class TeacherStatsExportView(APIView):
    """
    GET /api/distributions/teacher-stats/export/
    تصدير إحصائيات المراقبين إلى Excel.
    يدعم نفس فلاتر TeacherStatsView.
    """
    permission_classes = [IsAuthenticated, BaseDistributionPermission]

    def get(self, request):
        search = request.query_params.get("search", "").strip()
        date = request.query_params.get("date", "").strip()

        qs = get_teacher_stats(search=search, date=date)
        buffer = ExportService.export_teacher_stats(list(qs))

        response = HttpResponse(
            buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="teacher_statistics.xlsx"'
        return response
