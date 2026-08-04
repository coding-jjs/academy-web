import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A학원 · 학원 운영 플랫폼",
  description: "원장, 교사, 학부모, 학생을 연결하는 A학원 운영 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
