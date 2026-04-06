"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light",  label: "فاتح",  icon: Sun     },
  { value: "dark",   label: "داكن",  icon: Moon    },
  { value: "system", label: "تلقائي", icon: Monitor },
] as const;

const APP_INFO = [
  { label: "الإصدار",          value: "1.0.0"              },
  { label: "الواجهة",          value: "Next.js 14 + shadcn" },
  { label: "بروتوكول المصادقة", value: "JWT (Bearer)"       },
  { label: "اتجاه الكتابة",    value: "RTL — عربي"          },
];

export function SettingsView() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="الإعدادات"
        description="تخصيص إعدادات النظام والواجهة"
      />

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">السمة</CardTitle>
          <CardDescription>اختر مظهر الواجهة المناسب لك</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map(({ value, label, icon: Icon }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border-2 p-4 text-sm font-medium transition-all",
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40 hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    active ? "bg-primary/15" : "bg-muted"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span>{label}</span>
                  {active && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* App info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">معلومات النظام</CardTitle>
          <CardDescription>بيانات تقنية حول التطبيق</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-0 divide-y divide-border">
            {APP_INFO.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <dt className="text-sm text-muted-foreground">{item.label}</dt>
                <dd className="text-sm font-medium text-foreground">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">حالة النظام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">الاتصال بالخادم</span>
            <Badge variant="success" className="gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              متصل
            </Badge>
          </div>
          <Separator className="my-3" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">رابط الـ API</span>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-foreground">
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
