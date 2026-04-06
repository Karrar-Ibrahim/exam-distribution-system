from rest_framework import generics, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from core.pagination import CustomPagination
from .models import Exam
from .permissions import BaseExamPermission
from .serializers import (
    ExamReadSerializer,
    ExamCreateSerializer,
    ExamUpdateSerializer,
)


class ExamListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/exams/  - قائمة الامتحانات مع الفلترة والتصفح
    POST /api/exams/  - إنشاء امتحان (أو عدة امتحانات إذا time قائمة)
    """

    permission_classes = [IsAuthenticated, BaseExamPermission]
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["lang"]
    search_fields = ["exam"]

    def get_queryset(self):
        return (
            Exam.objects.select_related("classroom")
            .all()
            .order_by("-id")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ExamCreateSerializer
        return ExamReadSerializer

    def create(self, request, *args, **kwargs):
        write_serializer = ExamCreateSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)

        instances = write_serializer.save(created_by_user_id=request.user.id)

        # إذا أُنشئ سجل واحد فقط أعده مباشرةً، وإلا أعد القائمة
        if len(instances) == 1:
            read_data = ExamReadSerializer(instances[0]).data
        else:
            read_data = ExamReadSerializer(instances, many=True).data

        return Response(read_data, status=status.HTTP_201_CREATED)


class ExamRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/exams/{id}/
    PATCH  /api/exams/{id}/
    DELETE /api/exams/{id}/
    """

    permission_classes = [IsAuthenticated, BaseExamPermission]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Exam.objects.select_related("classroom").all()

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return ExamUpdateSerializer
        return ExamReadSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        write_serializer = ExamUpdateSerializer(
            instance, data=request.data, partial=True
        )
        write_serializer.is_valid(raise_exception=True)
        updated = write_serializer.save()
        # أعد بيانات القراءة الكاملة
        updated_instance = (
            Exam.objects.select_related("classroom").get(pk=updated.pk)
        )
        return Response(ExamReadSerializer(updated_instance).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {"success": True, "message": "تم حذف الامتحان بنجاح."},
            status=status.HTTP_200_OK,
        )
