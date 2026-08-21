/**
 * 루트 레이아웃. 모든 URL의 문서 껍데기.
 *
 * `html lang=ko`, 사이트 메타데이터, `globals.css`만 담당한다.
 * 역할 셸(AdminShell / MemberShell)은 `(director)` `(teacher)` 등 그룹
 * layout이 씌운다. 여기서 `requireRole`을 쓰지 않는다 — `/` `/login`
 * `/notices`는 공개다.
 *
 * `src/proxy.ts` matcher도 `/`를 커버하지 않는다.
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "A학원 · 학원 운영 플랫폼",
    description: "원장, 선생님, 학부모, 학생을 연결하는 A학원 운영 플랫폼",
};

/** 역할 내비 없이 html/body만 감싼다. */
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body>{children}</body>
        </html>
    );
}
