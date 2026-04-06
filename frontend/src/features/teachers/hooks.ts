import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from "./api";
import type { TeacherFormData, PaginationParams } from "@/types";

export const TEACHERS_KEY = ["teachers"] as const;

export function useTeachers(params: PaginationParams = {}) {
  return useQuery({
    queryKey: [...TEACHERS_KEY, params],
    queryFn: () => getTeachers(params),
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TeacherFormData) => createTeacher(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEACHERS_KEY });
      toast.success("تم إضافة المدرّس بنجاح");
    },
    onError: () => toast.error("فشل في إضافة المدرّس"),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TeacherFormData> }) =>
      updateTeacher(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEACHERS_KEY });
      toast.success("تم تحديث بيانات المدرّس");
    },
    onError: () => toast.error("فشل في تحديث المدرّس"),
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTeacher(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEACHERS_KEY });
      toast.success("تم حذف المدرّس بنجاح");
    },
    onError: () => toast.error("فشل في حذف المدرّس"),
  });
}
