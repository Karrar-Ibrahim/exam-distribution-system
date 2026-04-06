from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ModulePermission

class ModulePermissionInline(admin.TabularInline):
    model = ModulePermission
    extra = 1

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'role', 'lang', 'is_active', 'is_staff', 'created_at')
    list_filter = ('role', 'lang', 'is_active', 'is_staff')
    search_fields = ('email', 'name')
    ordering = ('-created_at',)
    inlines = [ModulePermissionInline]
    
    filter_horizontal = ()
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'lang', 'image', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password', 'role', 'lang')}
        ),
    )

@admin.register(ModulePermission)
class ModulePermissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'can_show', 'can_add', 'can_edit', 'can_delete', 'can_posted')
    list_filter = ('name', 'can_show', 'can_add', 'can_edit', 'can_delete')
    search_fields = ('user__name', 'user__email', 'name')
