from rest_framework import serializers
from .models import DistributionBatch, DistributionAssignment


# ─── Create ──────────────────────────────────────────────────────────
class DistributionCreateSerializer(serializers.Serializer):
    """بيانات إنشاء توزيع جديد."""

    date = serializers.CharField()
    time = serializers.CharField()
    classroom_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=[]
    )
    lang = serializers.CharField(default="ar")
    periodic_distribution = serializers.BooleanField(default=False)

    def validate_date(self, value: str) -> str:
        if not value or not value.strip():
            raise serializers.ValidationError("التاريخ مطلوب.")
        return value.strip()

    def validate_time(self, value: str) -> str:
        if not value or not value.strip():
            raise serializers.ValidationError("الوقت مطلوب.")
        return value.strip()


# ─── Assignment Read ─────────────────────────────────────────────────
class DistributionAssignmentSerializer(serializers.ModelSerializer):
    teacher_formatted_name = serializers.SerializerMethodField()

    class Meta:
        model = DistributionAssignment
        fields = [
            "id",
            "batch_id",
            "classroom_id",
            "room_label",
            "date",
            "teacher_id",
            "teacher_name",
            "teacher_formatted_name",
            "degree",
            "time",
            "active",
            "count",
            "type",
        ]
        read_only_fields = fields

    def get_teacher_formatted_name(self, obj) -> str:
        if obj.teacher:
            return obj.teacher.formatted_name
        return obj.teacher_name


# ─── Batch Read ──────────────────────────────────────────────────────
class DistributionBatchSerializer(serializers.ModelSerializer):
    classrooms_count = serializers.IntegerField(read_only=True, default=0)
    teachers_count = serializers.IntegerField(read_only=True, default=0)
    assignments = DistributionAssignmentSerializer(many=True, read_only=True)

    class Meta:
        model = DistributionBatch
        fields = [
            "id",
            "date",
            "time",
            "lang",
            "classrooms_count",
            "teachers_count",
            "assignments",
            "created_by_user_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


# ─── Teacher Stats ────────────────────────────────────────────────────
class TeacherAssignmentDetailSerializer(serializers.Serializer):
    """تفاصيل تعيين مراقب واحد لأغراض الإحصائيات."""
    id = serializers.IntegerField()
    date = serializers.CharField()
    room_label = serializers.CharField()
    time = serializers.CharField()
    batch_id = serializers.IntegerField()


class TeacherStatSerializer(serializers.Serializer):
    """إحصائيات مراقب واحد مع قائمة تعييناته."""
    teacher_id = serializers.IntegerField(source="id")
    name = serializers.CharField()
    formatted_name = serializers.CharField()
    title = serializers.CharField()
    degree = serializers.CharField()
    type = serializers.IntegerField()
    total_count = serializers.IntegerField()
    last_assignment_date = serializers.SerializerMethodField()
    assignments = serializers.SerializerMethodField()

    def get_last_assignment_date(self, obj) -> str | None:
        assignments = getattr(obj, "filtered_assignments", [])
        if assignments:
            return assignments[0].date
        return None

    def get_assignments(self, obj) -> list:
        assignments = getattr(obj, "filtered_assignments", [])
        return TeacherAssignmentDetailSerializer(assignments, many=True).data


# ─── Dashboard ───────────────────────────────────────────────────────
class DashboardSerializer(serializers.Serializer):
    total_teachers = serializers.IntegerField()
    total_classrooms = serializers.IntegerField()
    total_exams = serializers.IntegerField()
    batches = DistributionBatchSerializer(many=True)
