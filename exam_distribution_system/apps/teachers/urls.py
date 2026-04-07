from django.urls import path
from .views import (
    TeacherListCreateView,
    TeacherRetrieveUpdateDestroyView,
    ExclusionListCreateView,
    ExclusionDestroyView,
    TeacherImportView,
    TeacherTemplateDownloadView,
)

urlpatterns = [
    path("", TeacherListCreateView.as_view(), name="teacher-list-create"),
    path("<int:pk>/", TeacherRetrieveUpdateDestroyView.as_view(), name="teacher-detail"),
    path("exclusions/", ExclusionListCreateView.as_view(), name="exclusion-list-create"),
    path("exclusions/<int:pk>/", ExclusionDestroyView.as_view(), name="exclusion-destroy"),
    # Excel import
    path("import/", TeacherImportView.as_view(), name="teacher-import"),
    path("import/template/", TeacherTemplateDownloadView.as_view(), name="teacher-import-template"),
]
