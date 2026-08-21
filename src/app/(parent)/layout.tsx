/**
 * `(parent)` URL 그룹 레이아웃. `/parent/*`를 감싼다.
 *
 * `requireRole("PARENT")` 후 `MemberShell role="parent"`를 씌운다.
 * 하위 page는 연결된 자녀 데이터만 읽고, AdminShell은 쓰지 않는다.
 * 결제는 준비 중 카피(`/parent/payments`)이며 ParentPaymentsScreen은 page가 연결하지 않는다.
 */

import type { ReactNode } from "react";
import MemberShell from "@/components/layout/MemberShell";
import { requireRole } from "@/lib/auth-guard";

/** 학부모만 통과시키고 멤버 내비를 붙인다. */
export default async function ParentLayout({ children }: { children: ReactNode }) {
    const session = await requireRole("PARENT");
    return (
        <MemberShell role="parent" userName={session.user.name}>
            {children}
        </MemberShell>
    );
}
