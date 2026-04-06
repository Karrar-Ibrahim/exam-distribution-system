from rest_framework import serializers
from .models import Classroom


class ClassroomReadSerializer(serializers.ModelSerializer):
    """Serializer للعرض."""

    class Meta:
        model = Classroom
        fields = [
            "id",
            "room_number",
            "capacity",
            "num_invigilators",
            "lang",
            "created_by_user_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class ClassroomWriteSerializer(serializers.ModelSerializer):
    """Serializer للإنشاء والتعديل."""

    class Meta:
        model = Classroom
        fields = [
            "room_number",
            "capacity",
            "num_invigilators",
            "lang",
        ]

    def validate_room_number(self, value: str) -> str:
        if not value or not value.strip():
            raise serializers.ValidationError("رقم القاعة مطلوب.")
        return value.strip()

    def validate_capacity(self, value: int) -> int:
        if value <= 0:
            raise serializers.ValidationError("السعة يجب أن تكون أكبر من صفر.")
        return value

    def validate_num_invigilators(self, value: int) -> int:
        if value < 0:
            raise serializers.ValidationError("عدد المراقبين لا يمكن أن يكون سالبًا.")
        return value


class ClassroomOptionSerializer(serializers.ModelSerializer):
    """Serializer مبسّط لقوائم الاختيار في شاشة التوزيع."""

    class Meta:
        model = Classroom
        fields = ["id", "room_number", "capacity", "num_invigilators", "lang"]
