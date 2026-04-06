import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        "pb-5 border-b border-border/60",
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2.5">
          {/* Accent dot */}
          <span className="h-5 w-1 rounded-full bg-primary shrink-0" />
          <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground ps-3.5">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">{children}</div>
      )}
    </div>
  );
}
