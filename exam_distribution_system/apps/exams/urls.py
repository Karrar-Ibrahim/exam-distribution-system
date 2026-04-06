from django.urls import path
from .views import (
    ExamListCreateView,
    ExamRetrieveUpdateDestroyView,
)

urlpatterns = [
    path("", ExamListCreateView.as_view(), name="exam-list-create"),
    path("<int:pk>/", ExamRetrieveUpdateDestroyView.as_view(), name="exam-detail"),
]
