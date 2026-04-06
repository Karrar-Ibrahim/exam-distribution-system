import api from "@/lib/axios";
import { API_ROUTES } from "@/config/api-routes";
import type { TeacherStatsResponse, TeacherStatsParams } from "@/types";

export async function getTeacherStats(
  params: TeacherStatsParams = {}
): Promise<TeacherStatsResponse> {
  const response = await api.get<TeacherStatsResponse>(
    API_ROUTES.DISTRIBUTIONS.TEACHER_STATS,
    { params }
  );
  return response.data;
}

export async function exportTeacherStats(
  params: { search?: string; date?: string } = {}
): Promise<void> {
  const response = await api.get(API_ROUTES.DISTRIBUTIONS.TEACHER_STATS_EXPORT, {
    params,
    responseType: "blob",
  });
  const blob = new Blob([response.data as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "teacher_statistics.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
