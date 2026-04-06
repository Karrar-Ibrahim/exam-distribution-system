from django.urls import path
from .views import (
    ClassroomListCreateView,
    ClassroomRetrieveUpdateDestroyView,
    ClassroomDivisionOptionsView,
)

urlpatterns = [
    path("", ClassroomListCreateView.as_view(), name="classroom-list-create"),
    path(
        "division-options/",
        ClassroomDivisionOptionsView.as_view(),
        name="classroom-division-options",
    ),
    path(
        "<int:pk>/",
        ClassroomRetrieveUpdateDestroyView.as_view(),
        name="classroom-detail",
    ),
]
