/**
 * `(employee)` URL 그룹 레이아웃. `/employee/*`를 감싼다.
 *
 * `requireRole("STAFF")` 후 `AdminShell role="employee"`를 씌운다.
 * 내비는 교사와 다르다(청구·수납이 있고 출석/성적/리포트 메뉴가 없다).
 *
 * 직원 page가 교사 Screen을 재사용하는 곳은 상담·학생뿐이다.
 * - `/employee/counseling` → `StaffCounselingScreen` + 게스트 문의 포함
 * - `/employee/students` → `StaffStudentsScreen`
 * 대시보드는 `StaffDashboardScreen`을 쓰지 않는다(바로가기 홈).
 * 쪽지는 features `MessagesScreen`을 공유하고, 청구는 준비 중 카피다.
 */

import type { ReactNode } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { requireRole } from "@/lib/auth-guard";

/** 직원만 통과시키고 employee 내비의 AdminShell을 붙인다. */
export default async function EmployeeLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requireRole("STAFF");
    return <AdminShell role="employee">{children}</AdminShell>;
}
