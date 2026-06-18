"use client";

import { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function TasksLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
