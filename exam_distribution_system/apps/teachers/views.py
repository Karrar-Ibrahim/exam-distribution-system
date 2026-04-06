from rest_framework import generics, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Value, IntegerField
from django_filters.rest_framework import DjangoFilterBackend

from core.pagination import CustomPagination
from core.activity import log_activity
from .models import Teacher, TeacherExclusion
from .permissions import BaseTeacherPermission
from .serializers import (
    TeacherReadSerializer, TeacherWriteSerializer,
    TeacherExclusionReadSerializer, TeacherExclusionWriteSerializer,
)
from .services import delete_teacher


def _get_base_queryset():
    """
    Queryset مع annotation لـ distribution_count.
    في المرحلة الثالثة استبدل Value(0) بـ Count('tech_divides') الفعلية.
    """
    # مثال جاهز للمرحلة الثالثة:
    # from django.db.models import Count
    # return Teacher.objects.annotate(distribution_count=Count('tech_divides'))
    return Teacher.objects.annotate(
        distribution_count=Value(0, output_field=IntegerField())
    ).order_by("name")


class TeacherListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/teachers/  - قائمة المدرّسين مع distribution_count
    POST /api/teachers/  - إضافة مدرّس جديد
    """

    permission_classes = [IsAuthenticated, BaseTeacherPermission]
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["lang"]
    search_fields = ["name"]

    def get_queryset(self):
        return _get_base_queryset()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TeacherWriteSerializer
        return TeacherReadSerializer

    def create(self, request, *args, **kwargs):
        write_serializer = TeacherWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save(created_by_user_id=request.user.id)
        log_activity(
            user=request.user,
            action='create',
            module='teaching_management',
            description=f'إضافة مدرّس: {instance.name}',
            request=request,
        )
        # أعد قراءة الـ instance مع الـ annotation
        instance_with_annotation = _get_base_queryset().get(pk=instance.pk)
        read_serializer = TeacherReadSerializer(instance_with_annotation)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class TeacherRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/teachers/{id}/
    PATCH  /api/teachers/{id}/
    DELETE /api/teachers/{id}/
    """

    permission_classes = [IsAuthenticated, BaseTeacherPermission]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return _get_base_queryset()

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return TeacherWriteSerializer
        return TeacherReadSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        write_serializer = TeacherWriteSerializer(
            instance, data=request.data, partial=True
        )
        write_serializer.is_valid(raise_exception=True)
        updated = write_serializer.save()
        log_activity(
            user=request.user,
            action='update',
            module='teaching_management',
            description=f'تعديل مدرّس: {updated.name}',
            request=request,
        )
        # أعد قراءة مع annotation
        updated_with_annotation = _get_base_queryset().get(pk=updated.pk)
        return Response(TeacherReadSerializer(updated_with_annotation).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.name
        delete_teacher(instance)
        log_activity(
            user=request.user,
            action='delete',
            module='teaching_management',
            description=f'حذف مدرّس: {name}',
            request=request,
        )
        return Response(
            {"success": True, "message": "تم حذف المدرّس بنجاح."},
            status=status.HTTP_200_OK,
        )


# ─── Exclusion Views ──────────────────────────────────────────────────────────

class ExclusionListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/teachers/exclusions/  — قائمة الاستثناءات (بحث + فلتر تاريخ)
    POST /api/teachers/exclusions/  — إضافة استثناء جديد
    """
    permission_classes = [IsAuthenticated, BaseTeacherPermission]
    pagination_class = CustomPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["teacher__name"]

    def get_queryset(self):
        qs = TeacherExclusion.objects.select_related("teacher").order_by("-date", "teacher__name")
        date = self.request.query_params.get("date", "").strip()
        if date:
            qs = qs.filter(date=date)
        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TeacherExclusionWriteSerializer
        return TeacherExclusionReadSerializer

    def create(self, request, *args, **kwargs):
        write_ser = TeacherExclusionWriteSerializer(data=request.data)
        write_ser.is_valid(raise_exception=True)
        instance = write_ser.save(created_by_user_id=request.user.id)
        read_ser = TeacherExclusionReadSerializer(
            TeacherExclusion.objects.select_related("teacher").get(pk=instance.pk)
        )
        return Response(read_ser.data, status=status.HTTP_201_CREATED)


class ExclusionDestroyView(generics.DestroyAPIView):
    """DELETE /api/teachers/exclusions/{id}/ — حذف استثناء."""
    permission_classes = [IsAuthenticated, BaseTeacherPermission]
    queryset = TeacherExclusion.objects.all()

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response(
            {"success": True, "message": "تم حذف الاستثناء بنجاح."},
            status=status.HTTP_200_OK,
        )
