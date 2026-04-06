import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserPermissions,
  updateUserPermissions,
  getActivityLogs,
} from "./api";
import type {
  SystemUserFormData,
  ModulePermission,
  PaginationParams,
  ActivityLogParams,
} from "@/types";

export const USERS_KEY = ["system-users"] as const;
export const LOGS_KEY  = ["activity-logs"] as const;

// ─── Users ────────────────────────────────────────────────────────────────────

export function useUsers(params: PaginationParams = {}) {
  return useQuery({
    queryKey: [...USERS_KEY, params],
    queryFn: () => getUsers(params),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SystemUserFormData) => createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      qc.invalidateQueries({ queryKey: LOGS_KEY });
      toast.success("تم إضافة المستخدم بنجاح");
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const msg = data?.email?.[0] ?? data?.password?.[0] ?? "فشل في إضافة المستخدم";
      toast.error(msg);
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SystemUserFormData> }) =>
      updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      qc.invalidateQueries({ queryKey: LOGS_KEY });
      toast.success("تم تحديث بيانات المستخدم");
    },
    onError: () => toast.error("فشل في تحديث المستخدم"),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      qc.invalidateQueries({ queryKey: LOGS_KEY });
      toast.success("تم حذف المستخدم بنجاح");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "فشل في حذف المستخدم";
      toast.error(msg);
    },
  });
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export function useUserPermissions(userId: number | null) {
  return useQuery({
    queryKey: ["user-permissions", userId],
    queryFn: () => getUserPermissions(userId!),
    enabled: userId !== null,
  });
}

export function useUpdateUserPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, permissions }: { userId: number; permissions: ModulePermission[] }) =>
      updateUserPermissions(userId, permissions),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ["user-permissions", userId] });
      qc.invalidateQueries({ queryKey: LOGS_KEY });
      toast.success("تم حفظ الصلاحيات بنجاح");
    },
    onError: () => toast.error("فشل في حفظ الصلاحيات"),
  });
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export function useActivityLogs(params: ActivityLogParams = {}) {
  return useQuery({
    queryKey: [...LOGS_KEY, params],
    queryFn: () => getActivityLogs(params),
  });
}
