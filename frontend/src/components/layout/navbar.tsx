"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  LogOut,
  ChevronDown,
  Bell,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { useAuth } from "@/hooks/use-auth";
import { flatNavItems } from "@/config/navigation";
import { getInitials } from "@/lib/utils";

interface NavbarProps {
  onMenuClick?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

function resolveTitle(pathname: string): string {
  const match = flatNavItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
  );
  return match?.title ?? "لوحة التحكم";
}

export function Navbar({ onMenuClick, onToggleSidebar, sidebarCollapsed }: NavbarProps) {
  const pathname  = usePathname();
  const { user, logout } = useAuth();
  const pageTitle = resolveTitle(pathname);
  const roleLabel = user?.role === "super" ? "مدير النظام" : "مشرف";

  return (
    <TooltipProvider delayDuration={100}>
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 backdrop-blur-md px-4 lg:px-5 shadow-sm shadow-border/30">

        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={onMenuClick}
          aria-label="فتح القائمة الجانبية"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop sidebar toggle */}
        {onToggleSidebar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={onToggleSidebar}
                aria-label={sidebarCollapsed ? "فتح الشريط الجانبي" : "إغلاق الشريط الجانبي"}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-5 w-5 rtl:scale-x-[-1]" />
                ) : (
                  <PanelLeftClose className="h-5 w-5 rtl:scale-x-[-1]" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {sidebarCollapsed ? "فتح الشريط الجانبي" : "إغلاق الشريط الجانبي"}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Divider */}
        <div className="hidden lg:block h-5 w-px bg-border/60 mx-1" />

        {/* Breadcrumb / Page title */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span className="text-xs text-muted-foreground/60 hidden sm:inline select-none">
            الرئيسية
          </span>
          <ChevronLeft className="h-3 w-3 text-muted-foreground/40 hidden sm:inline shrink-0" />
          <h1 className="text-sm font-semibold text-foreground truncate">
            {pageTitle}
          </h1>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5">

          {/* Theme toggle */}
          <ThemeSwitcher />

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                aria-label="الإشعارات"
              >
                <Bell className="h-4.5 w-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">الإشعارات</TooltipContent>
          </Tooltip>

          {/* Divider */}
          <div className="mx-1 h-5 w-px bg-border/60" />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-9 items-center gap-2 px-2 rounded-lg focus-visible:ring-0 hover:bg-accent"
              >
                <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-[11px] font-bold">
                    {user ? getInitials(user.fullName) : "م"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs font-semibold leading-tight">
                    {user?.fullName ?? "المستخدم"}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {roleLabel}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground/60 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60 p-2">
              <DropdownMenuLabel className="font-normal pb-2 px-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/15">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                      {user ? getInitials(user.fullName) : "م"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {user?.fullName ?? "المستخدم"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email ?? ""}
                    </p>
                    <Badge
                      variant="secondary"
                      className="mt-1 w-fit text-[10px] h-4 px-1.5"
                    >
                      {roleLabel}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-md"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}
