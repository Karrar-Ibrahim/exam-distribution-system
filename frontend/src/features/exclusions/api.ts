import api from "@/lib/axios";
import { API_ROUTES } from "@/config/api-routes";
import type {
  TeacherExclusion,
  TeacherExclusionFormData,
  PaginatedResponse,
  ExclusionParams,
} from "@/types";

export async function getExclusions(
  params: ExclusionParams = {}
): Promise<PaginatedResponse<TeacherExclusion>> {
  const response = await api.get<PaginatedResponse<TeacherExclusion>>(
    API_ROUTES.TEACHERS.EXCLUSIONS,
    { params }
  );
  return response.data;
}

export async function createExclusion(
  data: TeacherExclusionFormData
): Promise<TeacherExclusion> {
  const response = await api.post<TeacherExclusion>(
    API_ROUTES.TEACHERS.EXCLUSIONS,
    data
  );
  return response.data;
}

export async function deleteExclusion(id: number): Promise<void> {
  await api.delete(API_ROUTES.TEACHERS.EXCLUSION_DETAIL(id));
}
