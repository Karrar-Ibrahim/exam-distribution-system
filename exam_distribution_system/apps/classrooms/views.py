from rest_framework import generics, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from core.pagination import CustomPagination
from .models import Classroom
from .permissions import BaseClassroomPermission
from .serializers import (
    ClassroomReadSerializer,
    ClassroomWriteSerializer,
    ClassroomOptionSerializer,
)


class ClassroomListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/classrooms/  - قائمة القاعات مع بحث وفلترة وتصفح
    POST /api/classrooms/  - إنشاء قاعة جديدة
    """

    permission_classes = [IsAuthenticated, BaseClassroomPermission]
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["lang"]
    search_fields = ["room_number"]

    def get_queryset(self):
        return Classroom.objects.all().order_by("room_number")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ClassroomWriteSerializer
        return ClassroomReadSerializer

    def perform_create(self, serializer):
        serializer.save(created_by_user_id=self.request.user.id)

    def create(self, request, *args, **kwargs):
        write_serializer = ClassroomWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        instance = write_serializer.save(created_by_user_id=request.user.id)
        read_serializer = ClassroomReadSerializer(instance)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class ClassroomRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/classrooms/{id}/  - تفاصيل قاعة
    PATCH  /api/classrooms/{id}/  - تعديل قاعة
    DELETE /api/classrooms/{id}/  - حذف قاعة
    """

    permission_classes = [IsAuthenticated, BaseClassroomPermission]
    queryset = Classroom.objects.all()
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return ClassroomWriteSerializer
        return ClassroomReadSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        write_serializer = ClassroomWriteSerializer(
            instance, data=request.data, partial=partial
        )
        write_serializer.is_valid(raise_exception=True)
        updated = write_serializer.save()
        read_serializer = ClassroomReadSerializer(updated)
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {"success": True, "message": "تم حذف القاعة بنجاح."},
            status=status.HTTP_200_OK,
        )


class ClassroomDivisionOptionsView(APIView):
    """
    GET /api/classrooms/division-options/
    يرجع القاعات مرتبة تصاعديًا حسب room_number بدون pagination
    لتُستخدم في قوائم الاختيار بشاشة التوزيع.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        classrooms = Classroom.objects.all().order_by("room_number")
        serializer = ClassroomOptionSerializer(classrooms, many=True)
        return Response({"data": serializer.data, "count": classrooms.count()})
