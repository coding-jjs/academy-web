/**
 * `(teacher)` URL 그룹 레이아웃. `/teacher/*`를 감싼다.
 *
 * `requireRole("TEACHER")` 후 `AdminShell role="teacher"`를 씌운다.
 * 하위 page가 역할 가드를 반복하지 않게 여기서 한 번 막는다.
 *
 * `StaffDashboardScreen`·출석·성적·리포트는 교사 라우트 전용이다.
 * 직원이 같은 Screen을 쓰는 것은 상담·학생 page뿐이고, 이 layout을 타지 않는다.
 */

import type { ReactNode } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { requireRole } from "@/lib/auth-guard";

/** 교사만 통과시키고 teacher 내비의 AdminShell을 붙인다. */
export default async function TeacherLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requireRole("TEACHER");
    return <AdminShell role="teacher">{children}</AdminShell>;
}
