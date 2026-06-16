"use client";

import AppLayout from "@/components/AppLayout";
import AuthGuard from "@/components/AuthGuard";
import RoleGuard from "@/components/RoleGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard>
        <AppLayout>{children}</AppLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
