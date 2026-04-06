"use client";

import React from "react";
import { useAuth } from "@/hooks/use-auth";

interface PermissionGuardProps {
  /** Module / subject name from userAbilities */
  module: string;
  /** Default is "read" */
  action?: string;
  /** What to render when access is denied (null by default) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Wraps any UI with a permission check.
 *
 * Usage:
 *   <PermissionGuard module="classroom">
 *     <DeleteButton />
 *   </PermissionGuard>
 */
export function PermissionGuard({
  module,
  action = "read",
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { can, loading } = useAuth();

  // While loading auth state, render nothing to avoid flash
  if (loading) return null;

  return can(action, module) ? <>{children}</> : <>{fallback}</>;
}
