import api from "@/lib/axios";
import { API_ROUTES } from "@/config/api-routes";
import type {
  SystemUser,
  SystemUserFormData,
  ModulePermission,
  ActivityLog,
  ActivityLogParams,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(params: PaginationParams = {}): Promise<PaginatedResponse<SystemUser>> {
  const response = await api.get<PaginatedResponse<SystemUser>>(API_ROUTES.USERS.LIST, { params });
  return response.data;
}

export async function createUser(data: SystemUserFormData): Promise<SystemUser> {
  const response = await api.post<SystemUser>(API_ROUTES.USERS.LIST, data);
  return response.data;
}

export async function updateUser(id: number, data: Partial<SystemUserFormData>): Promise<SystemUser> {
  const response = await api.patch<SystemUser>(API_ROUTES.USERS.DETAIL(id), data);
  return response.data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(API_ROUTES.USERS.DETAIL(id));
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function getUserPermissions(userId: number): Promise<ModulePermission[]> {
  const response = await api.get<ModulePermission[]>(API_ROUTES.USERS.PERMISSIONS(userId));
  return response.data;
}

export async function updateUserPermissions(
  userId: number,
  permissions: ModulePermission[]
): Promise<ModulePermission[]> {
  const response = await api.post<ModulePermission[]>(
    API_ROUTES.USERS.PERMISSIONS(userId),
    permissions
  );
  return response.data;
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

export async function getActivityLogs(
  params: ActivityLogParams = {}
): Promise<PaginatedResponse<ActivityLog>> {
  const response = await api.get<PaginatedResponse<ActivityLog>>(API_ROUTES.USERS.LOGS, { params });
  return response.data;
}
