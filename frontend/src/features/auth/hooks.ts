"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginUser } from "./api";
import { setAuthData } from "@/lib/auth";
import type { LoginInput } from "@/types";

export function useLoginMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginInput) => loginUser(data),

    onSuccess: (response) => {
      // Persist tokens, user data AND abilities
      setAuthData(
        response.accessToken,
        response.refresh,
        response.userData,
        response.userAbilities ?? []
      );

      toast.success(`أهلاً وسهلاً، ${response.userData.fullName}`, {
        description: "تم تسجيل الدخول بنجاح",
      });

      router.replace("/dashboard");
    },

    onError: (error: unknown) => {
      const data = (error as {
        response?: { data?: { detail?: string; message?: string; non_field_errors?: string[] } };
      })?.response?.data;

      const msg =
        data?.detail ||
        data?.message ||
        data?.non_field_errors?.[0] ||
        "البريد الإلكتروني أو كلمة المرور غير صحيحة";

      toast.error("فشل تسجيل الدخول", { description: msg });
    },
  });
}
