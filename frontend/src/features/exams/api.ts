import api from "@/lib/axios";
import { API_ROUTES } from "@/config/api-routes";
import type { Exam, ExamFormData, PaginatedResponse, PaginationParams } from "@/types";

export async function getExams(params: PaginationParams = {}): Promise<PaginatedResponse<Exam>> {
  const response = await api.get<PaginatedResponse<Exam>>(API_ROUTES.EXAMS.LIST, { params });
  return response.data;
}

export async function createExam(data: ExamFormData): Promise<Exam | Exam[]> {
  const response = await api.post(API_ROUTES.EXAMS.LIST, data);
  return response.data;
}

export async function updateExam(id: number, data: Partial<ExamFormData>): Promise<Exam> {
  const response = await api.patch<Exam>(API_ROUTES.EXAMS.DETAIL(id), data);
  return response.data;
}

export async function deleteExam(id: number): Promise<void> {
  await api.delete(API_ROUTES.EXAMS.DETAIL(id));
}
