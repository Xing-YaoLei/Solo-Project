import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "家装工地材料进场漏斗报表",
  description: "家装工地材料进场漏斗分析系统 - 复盘会议可直接引用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
