from django.urls import path
from .views import (
    TeacherListCreateView,
    TeacherRetrieveUpdateDestroyView,
    ExclusionListCreateView,
    ExclusionDestroyView,
)

urlpatterns = [
    path("", TeacherListCreateView.as_view(), name="teacher-list-create"),
    path("<int:pk>/", TeacherRetrieveUpdateDestroyView.as_view(), name="teacher-detail"),
    path("exclusions/", ExclusionListCreateView.as_view(), name="exclusion-list-create"),
    path("exclusions/<int:pk>/", ExclusionDestroyView.as_view(), name="exclusion-destroy"),
]
