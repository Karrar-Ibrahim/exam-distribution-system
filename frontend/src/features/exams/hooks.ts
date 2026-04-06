import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getExams, createExam, updateExam, deleteExam } from "./api";
import type { ExamFormData, PaginationParams } from "@/types";

export const EXAMS_KEY = ["exams"] as const;

export function useExams(params: PaginationParams = {}) {
  return useQuery({ queryKey: [...EXAMS_KEY, params], queryFn: () => getExams(params) });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExamFormData) => createExam(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: EXAMS_KEY }); toast.success("تم إضافة الامتحان بنجاح"); },
    onError: () => toast.error("فشل في إضافة الامتحان"),
  });
}

export function useUpdateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ExamFormData> }) => updateExam(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: EXAMS_KEY }); toast.success("تم تحديث الامتحان"); },
    onError: () => toast.error("فشل في تحديث الامتحان"),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteExam(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: EXAMS_KEY }); toast.success("تم حذف الامتحان بنجاح"); },
    onError: () => toast.error("فشل في حذف الامتحان"),
  });
}
