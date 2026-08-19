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

import type { Metadata } from "next"; // 사이트 제목 타입. 역할 셸 타입은 아니다.
import "./globals.css"; // 전역 스타일만. 이 파일에서 클래스를 조립하지 않는다.

export const metadata: Metadata = { // 사이트 제목·설명. 역할 셸은 그룹 layout.
    title: "A학원 · 학원 운영 플랫폼", // 브라우저 탭. 역할 홈 제목이 아니다.
    description: "원장, 선생님, 학부모, 학생을 연결하는 A학원 운영 플랫폼", // 공개 메타. requireRole과 무관.
}; // 블록 끝.

/** 역할 내비 없이 html/body만 감싼다. */
export default function RootLayout({ // 모든 URL의 문서 껍데기. 가드는 그룹 layout.
    children, // 페이지·그룹 layout이 여기에 들어온다.
}: Readonly<{ // Next가 넘기는 children만. 세션을 받지 않는다.
    children: React.ReactNode; // 역할 셸은 하위 layout이 씌운다.
}>) { // RootLayout props 끝.
    return ( // 역할 셸·가드 없이 html/body만. /login /notices는 공개.
        <html lang="ko">{/* 문서 언어만. proxy matcher도 / 를 커버하지 않는다. */}
            <body>{children}</body>{/* 내비 없이 children만. AdminShell은 그룹 layout. */}
        </html> // html 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
