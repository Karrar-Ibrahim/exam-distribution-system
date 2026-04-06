from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # ------- المرحلة الأولى: accounts ------- #
    path("api/auth/", include("accounts.urls")),

    # ------- المرحلة الثانية: classrooms / teachers / exams ------- #
    path("api/classrooms/", include("classrooms.urls")),
    path("api/teachers/", include("teachers.urls")),
    path("api/exams/", include("exams.urls")),

    # ------- المرحلة الثالثة: distributions ------- #
    path("api/distributions/", include("distributions.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
