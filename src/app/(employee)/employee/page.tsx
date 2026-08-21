/**
 * `/employee` 직원 루트.
 *
 * layout이 `requireRole("STAFF")` + AdminShell(employee)을 이미 씌운다.
 * 본문은 `/employee/dashboard`로만 redirect한다.
 */

import { redirect } from "next/navigation"; // UI를 그리지 않는다. 업무 홈으로만.

/** 직원 업무 홈으로 보낸다. */
export default function EmployeePage() { // 직원 루트. layout 가드만 탄다.
    redirect("/employee/dashboard"); // 직원 루트는 업무 홈으로만. StaffDashboardScreen을 쓰지 않는다.
} // 블록 끝.
