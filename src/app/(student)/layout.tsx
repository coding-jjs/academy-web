/**
 * `(student)` URL 그룹 레이아웃. `/student/*`를 감싼다.
 *
 * `requireRole("STUDENT")` 후 `MemberShell role="student"`를 씌운다.
 * 관리자 내비(AdminShell)는 쓰지 않는다. 본인 프로필에 묶인 수업·성적만
 * 보게 멤버 셸로 감싼다.
 */

import type { ReactNode } from "react"; // children 타입. 세션은 requireRole이 돌려준다.
import MemberShell from "@/components/layout/MemberShell"; // 학생 내비. AdminShell이 아니다.
import { requireRole } from "@/lib/auth-guard"; // proxy 1차 후 DB 계정 재검사.

/** 학생만 통과시키고 멤버 내비를 붙인다. */
export default async function StudentLayout({ children }: { children: ReactNode }) { // `/student/*` 껍데기. 본인 데이터만.
    const session = await requireRole("STUDENT"); // 학생만. 본인 프로필에 묶인 수업·성적만.
    return ( // 멤버 내비. 관리자 AdminShell은 쓰지 않는다.
        <MemberShell role="student" userName={session.user.name}>{/* 본인 수업·성적만 보는 멤버 셸. */}
            {children}{/* 학생 page. Student.userId 범위는 data.ts. */}
        </MemberShell> // MemberShell 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
