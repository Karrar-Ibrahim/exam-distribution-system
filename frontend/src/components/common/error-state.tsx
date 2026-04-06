import React from "react";
import { AlertTriangle, RefreshCw, WifiOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorVariant = "default" | "network" | "permission" | "notfound";

interface ErrorStateProps {
  title?: string;
  description?: string;
  variant?: ErrorVariant;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

const VARIANTS: Record<
  ErrorVariant,
  { icon: React.ElementType; title: string; description: string; iconColor: string; bg: string }
> = {
  default: {
    icon: AlertTriangle,
    title: "حدث خطأ",
    description: "تعذّر تحميل البيانات. يرجى المحاولة مجدداً.",
    iconColor: "text-destructive",
    bg: "bg-destructive/10",
  },
  network: {
    icon: WifiOff,
    title: "تعذّر الاتصال",
    description: "تحقّق من اتصالك بالإنترنت أو بالخادم.",
    iconColor: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  permission: {
    icon: ShieldAlert,
    title: "غير مصرح",
    description: "ليس لديك صلاحية الوصول إلى هذه البيانات.",
    iconColor: "text-muted-foreground",
    bg: "bg-muted",
  },
  notfound: {
    icon: AlertTriangle,
    title: "لم يُعثر على البيانات",
    description: "العنصر المطلوب غير موجود أو تم حذفه.",
    iconColor: "text-muted-foreground",
    bg: "bg-muted",
  },
};

export function ErrorState({
  title,
  description,
  variant = "default",
  onRetry,
  retryLabel = "إعادة المحاولة",
  className,
}: ErrorStateProps) {
  const v = VARIANTS[variant];
  const Icon = v.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12 text-center",
        className
      )}
    >
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-full", v.bg)}>
        <Icon className={cn("h-7 w-7", v.iconColor)} />
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="text-sm font-semibold text-foreground">{title ?? v.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description ?? v.description}
        </p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2 mt-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

/** Inline error — used inside a table row or card */
export function InlineError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
      <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
      <p className="flex-1 text-sm text-destructive">
        {message ?? "حدث خطأ أثناء تحميل البيانات."}
      </p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} className="h-7 gap-1 text-xs shrink-0">
          <RefreshCw className="h-3 w-3" />
          إعادة
        </Button>
      )}
    </div>
  );
}
