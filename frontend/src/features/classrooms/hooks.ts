import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getClassrooms, getClassroomOptions, createClassroom, updateClassroom, deleteClassroom } from "./api";
import type { ClassroomFormData, PaginationParams } from "@/types";

export const CLASSROOMS_KEY = ["classrooms"] as const;

export function useClassrooms(params: PaginationParams = {}) {
  return useQuery({
    queryKey: [...CLASSROOMS_KEY, params],
    queryFn: () => getClassrooms(params),
  });
}

export function useClassroomOptions() {
  return useQuery({
    queryKey: [...CLASSROOMS_KEY, "options"],
    queryFn: getClassroomOptions,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClassroomFormData) => createClassroom(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CLASSROOMS_KEY }); toast.success("تم إضافة القاعة بنجاح"); },
    onError: () => toast.error("فشل في إضافة القاعة"),
  });
}

export function useUpdateClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ClassroomFormData> }) => updateClassroom(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CLASSROOMS_KEY }); toast.success("تم تحديث بيانات القاعة"); },
    onError: () => toast.error("فشل في تحديث القاعة"),
  });
}

export function useDeleteClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteClassroom(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CLASSROOMS_KEY }); toast.success("تم حذف القاعة بنجاح"); },
    onError: () => toast.error("فشل في حذف القاعة"),
  });
}

export function useBulkDeleteClassrooms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => deleteClassroom(id)));
    },
    onSuccess: (_data, ids) => {
      qc.invalidateQueries({ queryKey: CLASSROOMS_KEY });
      toast.success(`تم حذف ${ids.length} قاعة بنجاح`);
    },
    onError: () => toast.error("فشل في حذف العناصر المحدَّدة"),
  });
}
