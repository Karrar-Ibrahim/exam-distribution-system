"""
services.py - منطق العمل الخاص بتطبيق teachers.

الهدف: فصل المنطق الثقيل عن الـ views وجعله قابلًا لإعادة الاستخدام.
"""

from .models import Teacher


def delete_teacher(teacher: Teacher) -> None:
    """
    يحذف مدرّسًا وسجلات التوزيع المرتبطة به.

    ملاحظة: عند تطوير تطبيق distributions في المرحلة الثالثة،
    يرجى إضافة حذف سجلات tech_divide هنا مباشرةً.
    حاليًا يحذف المدرّس فقط (on_delete=CASCADE على الـ FK سيتكفّل بالباقي).
    """
    # مثال جاهز للمرحلة القادمة:
    # from distributions.models import TeacherDivide
    # TeacherDivide.objects.filter(teacher=teacher).delete()
    teacher.delete()
