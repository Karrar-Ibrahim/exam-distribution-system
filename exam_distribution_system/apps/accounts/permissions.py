from rest_framework import permissions
from .models import ModulePermission

class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'super')

class BaseModulePermission(permissions.BasePermission):
    module_name = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.user.role == 'super':
            return True
            
        if not self.module_name:
            return False

        try:
            perm = ModulePermission.objects.get(user=request.user, name=self.module_name)
        except ModulePermission.DoesNotExist:
            return False
            
        # View requests
        if request.method in permissions.SAFE_METHODS:
            return perm.can_show
            
        # Add request
        if request.method == 'POST':
            return perm.can_add
            
        # Edit requests
        if request.method in ['PUT', 'PATCH']:
            return perm.can_edit
            
        # Delete request
        if request.method == 'DELETE':
            return perm.can_delete
            
        return False


class HasUsersModulePermission(BaseModulePermission):
    module_name = 'users'
