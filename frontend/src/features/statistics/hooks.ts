import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTeacherStats, exportTeacherStats } from "./api";
import type { TeacherStatsParams } from "@/types";

export const TEACHER_STATS_KEY = ["teacher-stats"] as const;

export function useTeacherStats(params: TeacherStatsParams = {}) {
  return useQuery({
    queryKey: [...TEACHER_STATS_KEY, params],
    queryFn: () => getTeacherStats(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useExportTeacherStats() {
  return useMutation({
    mutationFn: (params: { search?: string; date?: string }) =>
      exportTeacherStats(params),
    onSuccess: () => toast.success("تم تحميل الملف بنجاح"),
    onError: () => toast.error("فشل في تحميل الملف"),
  });
}
