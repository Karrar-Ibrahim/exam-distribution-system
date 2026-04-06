from rest_framework import serializers
from classrooms.models import Classroom
from .models import Exam


# ------------------------------------------------------------------ #
#  Read                                                                #
# ------------------------------------------------------------------ #

class ExamReadSerializer(serializers.ModelSerializer):
    """Serializer للعرض - يشمل معلومات القاعة المدمجة."""

    classroom_id = serializers.IntegerField(
        source="classroom.id", read_only=True, allow_null=True
    )
    room_number = serializers.CharField(
        source="classroom.room_number", read_only=True, allow_null=True
    )

    class Meta:
        model = Exam
        fields = [
            "id",
            "exam",
            "date",
            "time",
            "classroom_id",
            "room_number",
            "lang",
            "created_by_user_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


# ------------------------------------------------------------------ #
#  Create                                                              #
# ------------------------------------------------------------------ #

class ExamCreateSerializer(serializers.Serializer):
    """
    Serializer الإنشاء.

    time يقبل:
    - قيمة نصية واحدة   => ينشئ سجلًا واحدًا
    - قائمة نصية        => ينشئ سجلًا منفصلًا لكل قيمة
    """

    exam = serializers.CharField(max_length=255)
    date = serializers.CharField(max_length=50)
    time = serializers.JSONField()          # يقبل str أو list[str]
    classroom = serializers.PrimaryKeyRelatedField(
        queryset=Classroom.objects.all()
    )
    lang = serializers.CharField(max_length=10, default="ar", required=False)

    def validate_exam(self, value: str) -> str:
        if not value or not value.strip():
            raise serializers.ValidationError("اسم الامتحان مطلوب.")
        return value.strip()

    def validate_date(self, value: str) -> str:
        if not value or not value.strip():
            raise serializers.ValidationError("تاريخ الامتحان مطلوب.")
        return value.strip()

    def validate_time(self, value):
        """يتأكد أن time سلسلة نصية أو قائمة من السلاسل النصية."""
        if isinstance(value, str):
            if not value.strip():
                raise serializers.ValidationError("وقت الامتحان مطلوب.")
            return value.strip()

        if isinstance(value, list):
            if not value:
                raise serializers.ValidationError(
                    "قائمة أوقات الامتحان لا يمكن أن تكون فارغة."
                )
            cleaned = []
            for i, t in enumerate(value):
                if not isinstance(t, str) or not t.strip():
                    raise serializers.ValidationError(
                        f"القيمة رقم {i + 1} في قائمة الأوقات غير صالحة."
                    )
                cleaned.append(t.strip())
            return cleaned

        raise serializers.ValidationError(
            "time يجب أن يكون نصًا أو قائمة من النصوص."
        )

    def create(self, validated_data: dict):
        """
        ينشئ سجلًا واحدًا أو أكثر حسب نوع time.
        يُعيد قائمة بالسجلات المُنشأة.
        """
        time_value = validated_data.pop("time")
        times = time_value if isinstance(time_value, list) else [time_value]

        created_by = validated_data.pop("created_by_user_id", None)
        instances = []
        for t in times:
            instance = Exam.objects.create(
                **validated_data,
                time=t,
                created_by_user_id=created_by,
            )
            instances.append(instance)
        return instances


# ------------------------------------------------------------------ #
#  Update                                                              #
# ------------------------------------------------------------------ #

class ExamUpdateSerializer(serializers.ModelSerializer):
    """Serializer التعديل - time هنا نص بسيط (تعديل سجل واحد فقط)."""

    classroom = serializers.PrimaryKeyRelatedField(
        queryset=Classroom.objects.all(), required=False
    )

    class Meta:
        model = Exam
        fields = ["exam", "date", "time", "classroom", "lang"]

    def validate_exam(self, value: str) -> str:
        return value.strip() if value else value

    def validate_date(self, value: str) -> str:
        return value.strip() if value else value

    def validate_time(self, value: str) -> str:
        return value.strip() if value else value
