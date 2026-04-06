from rest_framework import viewsets, status, generics, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from django_filters.rest_framework import DjangoFilterBackend

from core.pagination import CustomPagination
from core.activity import log_activity
from .models import User, ModulePermission, UserActivityLog
from .serializers import (
    UserReadSerializer,
    UserWriteSerializer,
    ModulePermissionSerializer,
    ActivityLogSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import HasUsersModulePermission


# ─── Auth Views ───────────────────────────────────────────────────────────────

class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = (AllowAny,)
    serializer_class   = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            email = request.data.get('email', '')
            try:
                user = User.objects.get(email__iexact=email)
                log_activity(
                    user=user,
                    action='login',
                    module='auth',
                    description=f'تسجيل دخول: {user.email}',
                    request=request,
                )
            except User.DoesNotExist:
                pass
        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get("refresh")
        token = RefreshToken(refresh_token)
        token.blacklist()
        log_activity(
            user=request.user,
            action='logout',
            module='auth',
            description=f'تسجيل خروج: {request.user.email}',
            request=request,
        )
        return Response({"success": True, "message": "تم تسجيل الخروج."}, status=status.HTTP_205_RESET_CONTENT)
    except Exception:
        return Response({"success": False, "message": "Bad request."}, status=status.HTTP_400_BAD_REQUEST)


# ─── User Management ──────────────────────────────────────────────────────────

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasUsersModulePermission]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['name', 'email']
    http_method_names  = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = User.objects.order_by('-created_at')
        if self.request.user.role != 'super':
            qs = qs.exclude(role='super')
        return qs

    def get_serializer_class(self):
        if self.action in ('create', 'partial_update'):
            return UserWriteSerializer
        return UserReadSerializer

    def create(self, request, *args, **kwargs):
        ser = UserWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        instance = ser.save(created_by_user_id=request.user.id)
        log_activity(
            user=request.user,
            action='create',
            module='users',
            description=f'إضافة مستخدم جديد: {instance.name} ({instance.email})',
            request=request,
        )
        return Response(UserReadSerializer(instance).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        ser = UserWriteSerializer(instance, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        updated = ser.save()
        log_activity(
            user=request.user,
            action='update',
            module='users',
            description=f'تعديل مستخدم: {updated.name} ({updated.email})',
            request=request,
        )
        return Response(UserReadSerializer(updated).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk:
            return Response(
                {"error": "لا يمكنك حذف حسابك الخاص."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if instance.role == 'super' and request.user.role != 'super':
            return Response(
                {"error": "لا يمكنك حذف مدير النظام."},
                status=status.HTTP_403_FORBIDDEN,
            )
        name  = instance.name
        email = instance.email
        instance.delete()
        log_activity(
            user=request.user,
            action='delete',
            module='users',
            description=f'حذف مستخدم: {name} ({email})',
            request=request,
        )
        return Response({"success": True, "message": "تم حذف المستخدم بنجاح."}, status=status.HTTP_200_OK)


# ─── Module Permissions ───────────────────────────────────────────────────────

class UserPermissionsView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, HasUsersModulePermission]
    serializer_class   = ModulePermissionSerializer

    DEFAULT_MODULES = [
        'Dashboards',
        'classroom',
        'exams',
        'teaching_management',
        'teachers_divide',
        'users',
        'setting',
    ]

    def _get_target_user(self):
        user_id = self.kwargs.get('id')
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    def get_queryset(self):
        return ModulePermission.objects.filter(user_id=self.kwargs.get('id'))

    def list(self, request, *args, **kwargs):
        target_user = self._get_target_user()
        if not target_user:
            return Response({"error": "المستخدم غير موجود."}, status=status.HTTP_404_NOT_FOUND)

        existing = {p.name: p for p in self.get_queryset()}
        results  = []
        for module_name in self.DEFAULT_MODULES:
            if module_name in existing:
                results.append(self.get_serializer(existing[module_name]).data)
            else:
                results.append({
                    'id': None, 'name': module_name,
                    'can_show': False, 'can_add': False,
                    'can_edit': False, 'can_delete': False, 'can_posted': False,
                })
        return Response(results)

    def create(self, request, *args, **kwargs):
        target_user = self._get_target_user()
        if not target_user:
            return Response({"error": "المستخدم غير موجود."}, status=status.HTTP_404_NOT_FOUND)

        data         = request.data if isinstance(request.data, list) else [request.data]
        updated_list = []
        for item in data:
            name = item.get('name')
            if not name:
                continue
            perm, _ = ModulePermission.objects.update_or_create(
                user=target_user,
                name=name,
                defaults={
                    'can_show':          item.get('can_show', False),
                    'can_add':           item.get('can_add', False),
                    'can_edit':          item.get('can_edit', False),
                    'can_delete':        item.get('can_delete', False),
                    'can_posted':        item.get('can_posted', False),
                    'updated_by_user_id': request.user.id,
                },
            )
            updated_list.append(perm)

        log_activity(
            user=request.user,
            action='update',
            module='users',
            description=f'تعديل صلاحيات المستخدم: {target_user.name} ({target_user.email})',
            request=request,
        )
        return Response(self.get_serializer(updated_list, many=True).data, status=status.HTTP_200_OK)


# ─── Activity Logs ────────────────────────────────────────────────────────────

class ActivityLogListView(generics.ListAPIView):
    """GET /api/auth/logs/ — سجلات النشاط مع فلترة متقدمة."""

    permission_classes = [IsAuthenticated, HasUsersModulePermission]
    serializer_class   = ActivityLogSerializer
    pagination_class   = CustomPagination
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['description', 'user__name', 'user__email', 'module']

    def get_queryset(self):
        qs        = UserActivityLog.objects.select_related('user')
        params    = self.request.query_params

        user_id   = params.get('user_id', '').strip()
        action    = params.get('action', '').strip()
        module    = params.get('module', '').strip()
        date_from = params.get('date_from', '').strip()
        date_to   = params.get('date_to', '').strip()

        if user_id:
            qs = qs.filter(user_id=user_id)
        if action:
            qs = qs.filter(action=action)
        if module:
            qs = qs.filter(module=module)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        return qs
