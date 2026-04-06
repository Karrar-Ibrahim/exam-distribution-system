import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Paths that do NOT require authentication */
const PUBLIC_PATHS = ["/login"];

/** Paths that the middleware completely ignores */
const IGNORED_PREFIXES = [
  "/_next",
  "/favicon.ico",
  "/icons",
  "/images",
  "/fonts",
  "/public",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and Next.js internals
  if (IGNORED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token    = request.cookies.get("accessToken")?.value?.trim();
  const hasToken = Boolean(token);

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // ── Unauthenticated user on protected route ───────────────────────
  if (!hasToken && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve the intended destination so we can redirect back after login
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // ── Authenticated user on login page ─────────────────────────────
  if (hasToken && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search   = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico).*)"],
};
