"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn, getInitials } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogOut, GraduationCap } from "lucide-react";

interface SidebarProps {
  onNavClick?: () => void;
  collapsed?: boolean;
}

export function Sidebar({ onNavClick, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { user, canSee, logout } = useAuth();

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground select-none overflow-hidden">

        {/* ── Brand ─────────────────────────────────────────── */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-sidebar-border/60 transition-all duration-300",
            collapsed ? "justify-center px-0" : "gap-3 px-5"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="text-sm font-bold leading-tight truncate text-sidebar-foreground">
                نظام توزيع المراقبين
              </span>
              <span className="text-[11px] text-sidebar-foreground/40 mt-0.5">
                لوحة الإدارة
              </span>
            </div>
          )}
        </div>

        {/* ── Navigation ────────────────────────────────────── */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-0.5 scrollbar-thin",
            collapsed ? "px-2" : "px-3"
          )}
        >
          {navigation.map((section, si) => {
            const visibleItems = section.items.filter((item) =>
              canSee(item.permission)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={si} className={si > 0 ? "mt-1" : ""}>
                {/* Section title */}
                {section.title && !collapsed && (
                  <p className="mb-1 mt-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                    {section.title}
                  </p>
                )}
                {collapsed && si > 0 && (
                  <div className="my-2 px-1">
                    <Separator className="bg-sidebar-border/40" />
                  </div>
                )}

                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href + "/"));
                  const Icon = item.icon;

                  const linkEl = (
                    <Link
                      href={item.href}
                      onClick={onNavClick}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
                        collapsed
                          ? "justify-center w-10 h-10 mx-auto px-0"
                          : "px-3 py-2.5",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                          : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && !collapsed && (
                        <span className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-primary-foreground/50" />
                      )}
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive
                            ? "text-primary-foreground"
                            : "text-sidebar-foreground/40 group-hover:text-sidebar-accent-foreground"
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-4 min-w-4 px-1 text-[10px]",
                                isActive
                                  ? "bg-primary-foreground/15 text-primary-foreground border-primary-foreground/25"
                                  : "bg-primary/10 text-primary border-primary/20"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                        <TooltipContent
                          side="left"
                          sideOffset={12}
                          className="font-medium text-xs"
                        >
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <div key={item.href}>{linkEl}</div>;
                })}

                {!collapsed && si < navigation.length - 1 && (
                  <div className="mt-2 px-1">
                    <Separator className="bg-sidebar-border/40" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── User footer ───────────────────────────────────── */}
        <div
          className={cn(
            "shrink-0 border-t border-sidebar-border/60 p-3",
            collapsed ? "flex flex-col items-center gap-2" : ""
          )}
        >
          {collapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-default ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {user ? getInitials(user.fullName) : "م"}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={12}>
                  <p className="font-semibold">{user?.fullName ?? "المستخدم"}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role === "super" ? "مدير النظام" : "مشرف"}
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-sidebar-foreground/35 hover:text-destructive hover:bg-destructive/10"
                    onClick={logout}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={12}>
                  تسجيل الخروج
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent/50 transition-colors">
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {user ? getInitials(user.fullName) : "م"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-sidebar-foreground leading-tight truncate">
                  {user?.fullName ?? "المستخدم"}
                </p>
                <p className="text-[11px] text-sidebar-foreground/40 leading-tight mt-0.5 truncate">
                  {user?.role === "super" ? "مدير النظام" : "مشرف"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-sidebar-foreground/35 hover:text-destructive hover:bg-destructive/10"
                onClick={logout}
                title="تسجيل الخروج"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
