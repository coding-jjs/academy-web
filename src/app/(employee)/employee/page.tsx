/**
 * `/employee` 직원 루트.
 *
 * layout이 `requireRole("STAFF")` + AdminShell(employee)을 이미 씌운다.
 * 본문은 `/employee/dashboard`로만 redirect한다.
 */

import { redirect } from "next/navigation";

/** 직원 업무 홈으로 보낸다. */
export default function EmployeePage() {
    redirect("/employee/dashboard");
}
