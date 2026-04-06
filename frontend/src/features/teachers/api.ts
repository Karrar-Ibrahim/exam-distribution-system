import api from "@/lib/axios";
import { API_ROUTES } from "@/config/api-routes";
import type { Teacher, TeacherFormData, PaginatedResponse, PaginationParams } from "@/types";

export async function getTeachers(params: PaginationParams = {}): Promise<PaginatedResponse<Teacher>> {
  const response = await api.get<PaginatedResponse<Teacher>>(API_ROUTES.TEACHERS.LIST, { params });
  return response.data;
}

export async function createTeacher(data: TeacherFormData): Promise<Teacher> {
  const response = await api.post<Teacher>(API_ROUTES.TEACHERS.LIST, data);
  return response.data;
}

export async function updateTeacher(id: number, data: Partial<TeacherFormData>): Promise<Teacher> {
  const response = await api.patch<Teacher>(API_ROUTES.TEACHERS.DETAIL(id), data);
  return response.data;
}

export async function deleteTeacher(id: number): Promise<void> {
  await api.delete(API_ROUTES.TEACHERS.DETAIL(id));
}
