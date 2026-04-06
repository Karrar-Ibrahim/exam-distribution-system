import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "./api";

export const DASHBOARD_KEY = ["dashboard"] as const;

export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: getDashboard,
    staleTime: 1000 * 60 * 2, // 2 min
  });
}
