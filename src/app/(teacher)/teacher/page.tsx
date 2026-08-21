/**
 * `/teacher` 교사 루트.
 *
 * layout이 `requireRole("TEACHER")` + AdminShell을 이미 씌운다.
 * 본문은 `/teacher/dashboard`로만 redirect한다.
 */

import { redirect } from "next/navigation"; // UI를 그리지 않는다. 대시보드로만.

/** 교사 대시보드로 보낸다. */
export default function TeacherPage() { // 교사 루트. layout 가드만 탄다.
    redirect("/teacher/dashboard"); // 교사 루트는 대시보드로만. StaffDashboardScreen은 그 page.
} // 블록 끝.
