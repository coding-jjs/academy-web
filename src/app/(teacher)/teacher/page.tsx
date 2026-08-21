/**
 * `/teacher` 교사 루트.
 *
 * layout이 `requireRole("TEACHER")` + AdminShell을 이미 씌운다.
 * 본문은 `/teacher/dashboard`로만 redirect한다.
 */

import { redirect } from "next/navigation";

/** 교사 대시보드로 보낸다. */
export default function TeacherPage() {
    redirect("/teacher/dashboard");
}
