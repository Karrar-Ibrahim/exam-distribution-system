"use client";

import React from "react";
import { X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileSidebarProps {
  open:    boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 w-64 shadow-2xl",
          "transition-transform duration-300 ease-in-out lg:hidden",
          "border-e border-sidebar-border/60",
          open
            ? "translate-x-0"
            : "rtl:translate-x-full ltr:-translate-x-full"
        )}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute end-2 top-3 z-10 h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={onClose}
          aria-label="إغلاق القائمة"
        >
          <X className="h-4 w-4" />
        </Button>

        <Sidebar onNavClick={onClose} collapsed={false} />
      </aside>
    </>
  );
}
