"use client";

import { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function RemindersLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
