"""
مساعد تسجيل النشاط.
استخدم log_activity() من أي view في أي تطبيق.
"""
from __future__ import annotations


def log_activity(
    user,
    action: str,
    module: str,
    description: str = "",
    request=None,
    extra_data=None,
) -> None:
    """
    يسجّل عملية في جدول UserActivityLog.

    المعاملات:
      user        — كائن المستخدم أو None
      action      — login | logout | create | update | delete | export | distribute
      module      — اسم الوحدة (مثال: 'users', 'teachers', 'distributions')
      description — نص وصفي يظهر في السجل
      request     — كائن HttpRequest (اختياري) لاستخراج IP و User-Agent
      extra_data  — أي بيانات إضافية (dict اختياري)
    """
    from django.apps import apps
    UserActivityLog = apps.get_model("accounts", "UserActivityLog")

    ip_address = None
    user_agent = ""

    if request is not None:
        ip_address = _get_client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]

    authenticated_user = user if (user and getattr(user, "is_authenticated", False)) else None

    try:
        UserActivityLog.objects.create(
            user=authenticated_user,
            action=action,
            module=module,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            extra_data=extra_data,
        )
    except Exception:
        # لا نسمح لفشل التسجيل أن يوقف الطلب الأصلي
        pass


def _get_client_ip(request) -> str | None:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
