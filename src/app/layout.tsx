import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuestionFlow AI",
  description: "把混乱截图编译成可验证的 Excel",
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
