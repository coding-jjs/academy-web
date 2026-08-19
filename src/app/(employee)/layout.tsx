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

import type { ReactNode } from "react"; // children 타입. 세션은 requireRole이 돌려준다.
import AdminShell from "@/components/layout/AdminShell"; // employee 내비. 출석/성적/리포트 메뉴 없음.
import { requireRole } from "@/lib/auth-guard"; // proxy 1차 후 DB 계정 재검사. DB enum은 STAFF.

/** 직원만 통과시키고 employee 내비의 AdminShell을 붙인다. */
export default async function EmployeeLayout({ // `/employee/*` 껍데기. StaffDashboardScreen을 쓰지 않는다.
    children, // 직원 page. 상담은 includeInquiries true.
}: { // layout props.
    children: ReactNode; // AdminShell 안에 넣는다.
}) { // EmployeeLayout props 끝.
    await requireRole("STAFF"); // 직원만. 대시보드는 StaffDashboardScreen을 쓰지 않는다.
    return <AdminShell role="employee">{children}</AdminShell>; // employee 내비(청구 있음, 출석/성적/리포트 없음).
} // 블록 끝.
