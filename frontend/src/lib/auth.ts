import type { UserData, UserAbility } from "@/types";

const ACCESS_TOKEN_KEY  = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_DATA_KEY     = "userData";
const ABILITIES_KEY     = "userAbilities";

// ── Getters ──────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getUserData(): UserData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_DATA_KEY);
    return raw ? (JSON.parse(raw) as UserData) : null;
  } catch {
    return null;
  }
}

export function getAbilities(): UserAbility[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ABILITIES_KEY);
    return raw ? (JSON.parse(raw) as UserAbility[]) : [];
  } catch {
    return [];
  }
}

// ── Setters ──────────────────────────────────────────────────────────

export function setAuthData(
  accessToken: string,
  refreshToken: string,
  userData: UserData,
  abilities: UserAbility[] = []
): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_KEY,  accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_DATA_KEY,     JSON.stringify(userData));
  localStorage.setItem(ABILITIES_KEY,     JSON.stringify(abilities));

  // Cookie readable by Next.js middleware (1 hour)
  document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=3600; SameSite=Lax`;
}

export function updateAccessToken(accessToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=3600; SameSite=Lax`;
}

// ── Clearers ─────────────────────────────────────────────────────────

export function clearAuthData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem(ABILITIES_KEY);
  // Expire cookie immediately
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

// ── Helpers ───────────────────────────────────────────────────────────

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

/**
 * Checks if the stored abilities allow a given action on a subject.
 * Super users (role==="super") always return true.
 * Ability {action:"manage", subject:"all"} grants full access.
 */
export function checkAbility(
  action: string,
  subject: string,
  user: UserData | null,
  abilities: UserAbility[]
): boolean {
  if (!user) return false;
  if (user.role === "super") return true;
  return abilities.some(
    (a) =>
      (a.action === "manage" && a.subject === "all") ||
      (a.subject === subject && (a.action === action || a.action === "manage"))
  );
}
