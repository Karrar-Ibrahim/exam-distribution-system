import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getExclusions, createExclusion, deleteExclusion } from "./api";
import type { TeacherExclusionFormData, ExclusionParams } from "@/types";

export const EXCLUSIONS_KEY = ["exclusions"] as const;

export function useExclusions(params: ExclusionParams = {}) {
  return useQuery({
    queryKey: [...EXCLUSIONS_KEY, params],
    queryFn: () => getExclusions(params),
  });
}

export function useCreateExclusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TeacherExclusionFormData) => createExclusion(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EXCLUSIONS_KEY });
      toast.success("تم إضافة الاستثناء بنجاح");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { date?: string[]; non_field_errors?: string[] } } })
          ?.response?.data?.date?.[0] ??
        (err as { response?: { data?: { non_field_errors?: string[] } } })
          ?.response?.data?.non_field_errors?.[0] ??
        "فشل في إضافة الاستثناء";
      toast.error(msg);
    },
  });
}

export function useDeleteExclusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteExclusion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EXCLUSIONS_KEY });
      toast.success("تم حذف الاستثناء بنجاح");
    },
    onError: () => toast.error("فشل في حذف الاستثناء"),
  });
}
