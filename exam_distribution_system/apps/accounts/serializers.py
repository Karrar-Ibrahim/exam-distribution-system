from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, ModulePermission, UserActivityLog


# ─── Auth ─────────────────────────────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        abilities = []
        if user.role == 'super':
            abilities.append({"action": "manage", "subject": "all"})
        else:
            perms = ModulePermission.objects.filter(user=user)
            for p in perms:
                if p.can_show:   abilities.append({"action": "read",   "subject": p.name})
                if p.can_add:    abilities.append({"action": "create", "subject": p.name})
                if p.can_edit:   abilities.append({"action": "update", "subject": p.name})
                if p.can_delete: abilities.append({"action": "delete", "subject": p.name})
                if p.can_posted: abilities.append({"action": "post",   "subject": p.name})
            if not abilities:
                abilities.append({"action": "read", "subject": "Auth"})

        data.update({
            "success":      True,
            "message":      "Login successful",
            "accessToken":  data.pop('access'),
            "refresh":      data.pop('refresh'),
            "token_type":   "bearer",
            "expires_in":   3600,
            "userData": {
                "id":       user.id,
                "fullName": user.name,
                "email":    user.email,
                "role":     user.role,
                "username": user.email,
                "lang":     user.lang,
            },
            "userAbilities": abilities,
        })
        return data


# ─── User ─────────────────────────────────────────────────────────────────────

class UserReadSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = [
            'id', 'name', 'email', 'role', 'lang',
            'is_active', 'created_by_user_id', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class UserWriteSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=6, allow_blank=True)

    class Meta:
        model  = User
        fields = ['name', 'email', 'password', 'role', 'lang', 'is_active']

    def validate_email(self, value: str) -> str:
        qs = User.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("هذا البريد الإلكتروني مستخدم بالفعل.")
        return value.lower()

    def validate(self, attrs):
        # كلمة المرور مطلوبة عند الإنشاء
        if not self.instance and not attrs.get('password'):
            raise serializers.ValidationError({"password": "كلمة المرور مطلوبة."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        validated_data.setdefault('role', 'admin')
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None) or None
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


# ─── Module Permissions ───────────────────────────────────────────────────────

class ModulePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ModulePermission
        fields = ['id', 'name', 'can_show', 'can_add', 'can_edit', 'can_delete', 'can_posted']
        read_only_fields = ['id']


# ─── Activity Log ─────────────────────────────────────────────────────────────

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name    = serializers.CharField(source='user.name',  read_only=True, default='')
    user_email   = serializers.CharField(source='user.email', read_only=True, default='')
    action_label = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model  = UserActivityLog
        fields = [
            'id', 'user_id', 'user_name', 'user_email',
            'action', 'action_label', 'module',
            'description', 'ip_address', 'created_at',
        ]
        read_only_fields = fields
