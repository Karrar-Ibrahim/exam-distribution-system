from django.urls import path
from . import views

urlpatterns = [
    path("create/", views.DistributionCreateView.as_view(), name="distribution-create"),
    path("batches/", views.DistributionBatchListView.as_view(), name="distribution-batches"),
    path("batches/<int:pk>/", views.DistributionBatchDeleteView.as_view(), name="distribution-batch-delete"),
    path("dashboard/", views.DashboardView.as_view(), name="distribution-dashboard"),
    path("export/", views.ExportView.as_view(), name="distribution-export"),
    path("teacher-stats/", views.TeacherStatsView.as_view(), name="distribution-teacher-stats"),
    path("teacher-stats/export/", views.TeacherStatsExportView.as_view(), name="distribution-teacher-stats-export"),
]
