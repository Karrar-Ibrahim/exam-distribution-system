"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { isAuthenticated } from "@/lib/auth";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { collapsed, toggle } = useSidebar();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="جارٍ التحقق من الجلسة..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-30 hidden lg:flex flex-col",
          "border-e border-sidebar-border/60",
          "transition-[width] duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <Sidebar collapsed={collapsed} />
      </aside>

      {/* ── Mobile drawer ───────────────────────────────────── */}
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* ── Main content ────────────────────────────────────── */}
      <div
        className={cn(
          "flex min-h-screen flex-col",
          "transition-[margin] duration-300 ease-in-out",
          collapsed ? "lg:ms-16" : "lg:ms-64"
        )}
      >
        <Navbar
          onMenuClick={() => setMobileOpen(true)}
          onToggleSidebar={toggle}
          sidebarCollapsed={collapsed}
        />
        <main className="flex-1 p-4 lg:p-6 max-w-screen-2xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
