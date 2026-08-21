/**
 * `(student)` URL 그룹 레이아웃. `/student/*`를 감싼다.
 *
 * `requireRole("STUDENT")` 후 `MemberShell role="student"`를 씌운다.
 * 관리자 내비(AdminShell)는 쓰지 않는다. 본인 프로필에 묶인 수업·성적만
 * 보게 멤버 셸로 감싼다.
 */

import type { ReactNode } from "react";
import MemberShell from "@/components/layout/MemberShell";
import { requireRole } from "@/lib/auth-guard";

/** 학생만 통과시키고 멤버 내비를 붙인다. */
export default async function StudentLayout({ children }: { children: ReactNode }) {
    const session = await requireRole("STUDENT");
    return (
        <MemberShell role="student" userName={session.user.name}>
            {children}
        </MemberShell>
    );
}
