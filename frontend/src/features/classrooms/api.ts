import api from "@/lib/axios";
import { API_ROUTES } from "@/config/api-routes";
import type { Classroom, ClassroomFormData, ClassroomOption, PaginatedResponse, PaginationParams } from "@/types";

export async function getClassrooms(params: PaginationParams = {}): Promise<PaginatedResponse<Classroom>> {
  const response = await api.get<PaginatedResponse<Classroom>>(API_ROUTES.CLASSROOMS.LIST, { params });
  return response.data;
}

export async function getClassroomOptions(): Promise<ClassroomOption[]> {
  const response = await api.get<{ data: ClassroomOption[]; count: number } | ClassroomOption[]>(
    API_ROUTES.CLASSROOMS.OPTIONS
  );
  const raw = response.data as unknown;
  if (Array.isArray(raw)) return raw;
  return (raw as { data: ClassroomOption[] }).data ?? [];
}

export async function createClassroom(data: ClassroomFormData): Promise<Classroom> {
  const response = await api.post<Classroom>(API_ROUTES.CLASSROOMS.LIST, data);
  return response.data;
}

export async function updateClassroom(id: number, data: Partial<ClassroomFormData>): Promise<Classroom> {
  const response = await api.patch<Classroom>(API_ROUTES.CLASSROOMS.DETAIL(id), data);
  return response.data;
}

export async function deleteClassroom(id: number): Promise<void> {
  await api.delete(API_ROUTES.CLASSROOMS.DETAIL(id));
}
