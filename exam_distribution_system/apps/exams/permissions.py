from rest_framework import permissions
from accounts.models import ModulePermission


class BaseExamPermission(permissions.BasePermission):
    """Base permission تفحص ModulePermission لوحدة exams."""

    module_name = "exams"

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role == "super":
            return True

        try:
            perm = ModulePermission.objects.get(
                user=request.user, name=self.module_name
            )
        except ModulePermission.DoesNotExist:
            return False

        if request.method in permissions.SAFE_METHODS:
            return perm.can_show
        if request.method == "POST":
            return perm.can_add
        if request.method in ("PUT", "PATCH"):
            return perm.can_edit
        if request.method == "DELETE":
            return perm.can_delete

        return False
