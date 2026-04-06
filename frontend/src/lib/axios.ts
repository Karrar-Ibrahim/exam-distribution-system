import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
  clearAuthData,
  getUserData,
} from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30_000,
});

// ── Request: attach bearer token ─────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: silent token refresh on 401 ────────────────────────────
let isRefreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function drainQueue(error: unknown, token: string | null = null) {
  queue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token!)
  );
  queue = [];
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) =>
        queue.push({ resolve, reject })
      ).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry  = true;
    isRefreshing     = true;
    const refreshTok = getRefreshToken();

    if (!refreshTok) {
      clearAuthData();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/refresh/`,
        { refresh: refreshTok }
      );
      const newAccess = data.access as string;
      updateAccessToken(newAccess);
      drainQueue(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (refreshError) {
      drainQueue(refreshError);
      clearAuthData();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
