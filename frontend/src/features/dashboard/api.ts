import api from "@/lib/axios";
import { API_ROUTES } from "@/config/api-routes";
import type { DashboardData } from "@/types";

export async function getDashboard(): Promise<DashboardData> {
  const response = await api.get<DashboardData>(API_ROUTES.DISTRIBUTIONS.DASHBOARD);
  return response.data;
}
