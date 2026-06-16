"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Lock } from "lucide-react";

const STAFF_FORBIDDEN_ROUTES = [
  "/dashboard",
  "/analytics",
  "/imports",
];

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (user.role === "staff") {
      const isForbidden = STAFF_FORBIDDEN_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
      );
      if (isForbidden) {
        router.replace("/follow-ups");
      }
    }
  }, [user, isAuthenticated, pathname, router]);

  if (
    isAuthenticated &&
    user?.role === "staff" &&
    STAFF_FORBIDDEN_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    )
  ) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">访问受限</h2>
        <p className="text-slate-500 mb-6">
          您的账号权限不足，无法访问管理层视图
        </p>
        <button onClick={() => router.push("/follow-ups")} className="btn-primary">
          返回回访明细
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
