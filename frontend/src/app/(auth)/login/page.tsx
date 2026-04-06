import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "تسجيل الدخول إلى نظام توزيع الامتحانات",
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center p-4">

      {/* ── Decorative background ─────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Large blurred orbs */}
        <div className="absolute -top-40 start-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-blue-700/20 blur-[120px]" />
        <div className="absolute bottom-0 end-0 h-[400px] w-[400px] rounded-full bg-indigo-800/20 blur-[100px]" />
        <div className="absolute bottom-1/3 start-0 h-[300px] w-[300px] rounded-full bg-sky-800/15 blur-[80px]" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Card ─────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-md">

        {/* Brand header */}
        <div className="mb-8 text-center space-y-3">
          <div className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-900/40 ring-1 ring-white/10">
            <GraduationCap className="h-10 w-10 text-white" strokeWidth={1.5} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              نظام توزيع الامتحانات
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              مرحباً بك — يرجى تسجيل الدخول للمتابعة
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">تسجيل الدخول</h2>
            <p className="text-xs text-slate-500">
              أدخل بيانات الدخول الخاصة بك
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-600">
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()} — نظام توزيع الامتحانات
        </p>
      </div>
    </div>
  );
}
