import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher, importTeachers, downloadImportTemplate, toggleTeacherExclusion, exportTeachers } from "./api";
import type { TeacherFormData, ImportResult, PaginationParams } from "@/types";

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

export function useImportTeachers() {
  const qc = useQueryClient();
  return useMutation<ImportResult, Error, File>({
    mutationFn: (file: File) => importTeachers(file),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: TEACHERS_KEY });
      if (result.imported > 0) {
        toast.success(`تم استيراد ${result.imported} مراقب بنجاح`);
      }
    },
    onError: () => toast.error("فشل في رفع الملف"),
  });
}

export function useDownloadTemplate() {
  return useMutation({
    mutationFn: () => downloadImportTemplate(),
    onSuccess: () => toast.success("جارٍ تنزيل ملف القالب..."),
    onError: () => toast.error("فشل في تنزيل القالب"),
  });
}

export function useToggleTeacherExclusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      is_excluded,
      exclusion_reason,
    }: {
      id: number;
      is_excluded: boolean;
      exclusion_reason?: string;
    }) => toggleTeacherExclusion(id, is_excluded, exclusion_reason),
    onSuccess: (_data, { is_excluded }) => {
      qc.invalidateQueries({ queryKey: TEACHERS_KEY });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(is_excluded ? "تم استثناء المراقب دائماً" : "تم إلغاء استثناء المراقب");
    },
    onError: () => toast.error("فشل في تغيير حالة الاستثناء"),
  });
}

export function useExportTeachers() {
  return useMutation({
    mutationFn: (type: "active" | "excluded") => exportTeachers(type),
    onSuccess: () => toast.success("جارٍ تنزيل الملف..."),
    onError: () => toast.error("فشل في تنزيل الملف"),
  });
}

export function useBulkDeleteTeachers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => deleteTeacher(id)));
    },
    onSuccess: (_data, ids) => {
      qc.invalidateQueries({ queryKey: TEACHERS_KEY });
      toast.success(`تم حذف ${ids.length} مراقب بنجاح`);
    },
    onError: () => toast.error("فشل في حذف العناصر المحدَّدة"),
  });
}
