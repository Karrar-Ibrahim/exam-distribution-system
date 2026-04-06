import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  iconColor?: string;
  iconBg?: string;
  loading?: boolean;
  accent?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  iconColor = "text-primary",
  iconBg    = "bg-primary/10",
  loading   = false,
  accent,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        "border-border/60"
      )}
    >
      {/* Top accent line */}
      {accent && (
        <div className={cn("h-0.5 w-full", accent)} />
      )}
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground tabular-nums">
              {typeof value === "number" ? value.toLocaleString("ar-EG") : value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              "shadow-sm ring-1 ring-inset ring-white/10",
              iconBg
            )}
          >
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
