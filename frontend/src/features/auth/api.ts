import api from "@/lib/axios";
import { API_ROUTES } from "@/config/api-routes";
import type { LoginInput, LoginResponse } from "@/types";

export async function loginUser(data: LoginInput): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(API_ROUTES.AUTH.LOGIN, data);
  return response.data;
}

export async function logoutUser(): Promise<void> {
  await api.post(API_ROUTES.AUTH.LOGOUT);
}
