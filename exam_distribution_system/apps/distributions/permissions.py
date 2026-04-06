from accounts.permissions import BaseModulePermission


class BaseDistributionPermission(BaseModulePermission):
    """صلاحيات وحدة توزيع المراقبين (teachers_divide)."""

    module_name = "teachers_divide"
