/**
 * `(teacher)` URL 그룹 레이아웃. `/teacher/*`를 감싼다.
 *
 * `requireRole("TEACHER")` 후 `AdminShell role="teacher"`를 씌운다.
 * 하위 page가 역할 가드를 반복하지 않게 여기서 한 번 막는다.
 *
 * `StaffDashboardScreen`·출석·성적·리포트는 교사 라우트 전용이다.
 * 직원이 같은 Screen을 쓰는 것은 상담·학생 page뿐이고, 이 layout을 타지 않는다.
 */

import type { ReactNode } from "react"; // children 타입. 세션은 requireRole이 돌려준다.
import AdminShell from "@/components/layout/AdminShell"; // teacher 내비. employee와 메뉴가 다르다.
import { requireRole } from "@/lib/auth-guard"; // proxy 1차 후 DB 계정 재검사.

/** 교사만 통과시키고 teacher 내비의 AdminShell을 붙인다. */
export default async function TeacherLayout({ // `/teacher/*` 껍데기. StaffDashboardScreen은 이 그룹만.
    children, // 교사 page. 출석·성적·리포트는 여기만.
}: { // layout props.
    children: ReactNode; // AdminShell 안에 넣는다.
}) { // TeacherLayout props 끝.
    await requireRole("TEACHER"); // 교사만. StaffDashboardScreen은 이 그룹 라우트 전용.
    return <AdminShell role="teacher">{children}</AdminShell>; // teacher 내비. 직원이 같은 Screen을 쓰는 곳은 상담·학생뿐.
} // 블록 끝.
