import api from "@/lib/axios";
import { API_ROUTES } from "@/config/api-routes";
import type { Teacher, TeacherFormData, ImportResult, PaginatedResponse, PaginationParams } from "@/types";

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

export async function toggleTeacherExclusion(
  id: number,
  is_excluded: boolean,
  exclusion_reason?: string,
): Promise<Teacher> {
  const payload: { is_excluded: boolean; exclusion_reason?: string } = { is_excluded };
  if (exclusion_reason !== undefined) payload.exclusion_reason = exclusion_reason;
  const response = await api.patch<Teacher>(API_ROUTES.TEACHERS.DETAIL(id), payload);
  return response.data;
}

export async function exportTeachers(type: "active" | "excluded"): Promise<void> {
  const response = await api.get(API_ROUTES.TEACHERS.EXPORT(type), { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = type === "excluded" ? "المستثنون_دائماً.xlsx" : "المراقبون_الفعّالون.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function deleteTeacher(id: number): Promise<void> {
  await api.delete(API_ROUTES.TEACHERS.DETAIL(id));
}

/** رفع ملف Excel لاستيراد المراقبين */
export async function importTeachers(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<ImportResult>(API_ROUTES.TEACHERS.IMPORT, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

/** تنزيل ملف Excel القالب */
export async function downloadImportTemplate(): Promise<void> {
  const response = await api.get(API_ROUTES.TEACHERS.IMPORT_TEMPLATE, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = "teachers_import_template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
