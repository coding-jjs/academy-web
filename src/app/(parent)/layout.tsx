/**
 * `(parent)` URL 그룹 레이아웃. `/parent/*`를 감싼다.
 *
 * `requireRole("PARENT")` 후 `MemberShell role="parent"`를 씌운다.
 * 하위 page는 연결된 자녀 데이터만 읽고, AdminShell은 쓰지 않는다.
 * 결제는 준비 중 카피(`/parent/payments`)이며 ParentPaymentsScreen은 page가 연결하지 않는다.
 */

import type { ReactNode } from "react"; // children 타입. 세션은 requireRole이 돌려준다.
import MemberShell from "@/components/layout/MemberShell"; // 학부모 내비. AdminShell이 아니다.
import { requireRole } from "@/lib/auth-guard"; // proxy 1차 후 DB 계정 재검사.

/** 학부모만 통과시키고 멤버 내비를 붙인다. */
export default async function ParentLayout({ children }: { children: ReactNode }) { // `/parent/*` 껍데기. 결제 Screen은 미연결.
    const session = await requireRole("PARENT"); // 학부모만. 결제는 준비 중 — ParentPaymentsScreen은 연결하지 않는다.
    return ( // 멤버 내비. AdminShell은 쓰지 않는다.
        <MemberShell role="parent" userName={session.user.name}>{/* 연결된 자녀 데이터만 읽는 멤버 셸. */}
            {children}{/* 학부모 page. 자녀 링크 범위는 page·data.ts. */}
        </MemberShell> // MemberShell 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
