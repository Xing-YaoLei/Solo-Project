import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "景区运营导览路线趋势看板",
  description: "景区运营数据可视化分析平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
