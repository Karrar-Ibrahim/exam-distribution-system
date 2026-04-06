from rest_framework import serializers
from .models import Teacher, TeacherExclusion


class TeacherReadSerializer(serializers.ModelSerializer):
    """Serializer للعرض - يشمل formatted_name و distribution_count."""

    formatted_name = serializers.CharField(read_only=True)
    # distribution_count سيُحسب كـ annotation في الـ queryset
    # وسيصل هنا كـ field مُضاف ديناميكيًا
    distribution_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Teacher
        fields = [
            "id",
            "name",
            "formatted_name",
            "title",
            "degree",
            "type",
            "lang",
            "distribution_count",
            "created_by_user_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class TeacherWriteSerializer(serializers.ModelSerializer):
    """Serializer للإنشاء والتعديل."""

    class Meta:
        model = Teacher
        fields = ["name", "title", "degree", "lang"]

    def validate_name(self, value: str) -> str:
        if not value or not value.strip():
            raise serializers.ValidationError("اسم المدرّس مطلوب.")
        return value.strip()

    def validate_title(self, value: str) -> str:
        if not value or not value.strip():
            raise serializers.ValidationError("اللقب العلمي مطلوب.")
        return value.strip()

    def validate_degree(self, value: str) -> str:
        if not value or not value.strip():
            raise serializers.ValidationError("الدرجة العلمية مطلوبة.")
        return value.strip()


# ─── Exclusion ───────────────────────────────────────────────────────────────

class TeacherExclusionReadSerializer(serializers.ModelSerializer):
    """قراءة استثناء مع اسم المراقب."""
    teacher_name = serializers.CharField(source="teacher.formatted_name", read_only=True)
    teacher_title = serializers.CharField(source="teacher.title", read_only=True)
    teacher_degree = serializers.CharField(source="teacher.degree", read_only=True)

    class Meta:
        model = TeacherExclusion
        fields = [
            "id", "teacher_id", "teacher_name", "teacher_title",
            "teacher_degree", "date", "reason", "created_at",
        ]
        read_only_fields = fields


class TeacherExclusionWriteSerializer(serializers.ModelSerializer):
    """إنشاء استثناء جديد."""
    teacher_id = serializers.PrimaryKeyRelatedField(
        source="teacher", queryset=Teacher.objects.all()
    )

    class Meta:
        model = TeacherExclusion
        fields = ["teacher_id", "date", "reason"]

    def validate_date(self, value: str) -> str:
        if not value or not value.strip():
            raise serializers.ValidationError("التاريخ مطلوب.")
        return value.strip()

    def validate(self, attrs):
        teacher = attrs.get("teacher")
        date = attrs.get("date", "").strip()
        if TeacherExclusion.objects.filter(teacher=teacher, date=date).exists():
            raise serializers.ValidationError(
                {"date": "هذا المراقب مستثنى بالفعل في هذا التاريخ."}
            )
        return attrs
