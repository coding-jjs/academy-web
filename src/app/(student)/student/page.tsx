/**
 * `/student` 학생 루트.
 *
 * layout이 `requireRole("STUDENT")` + MemberShell을 이미 씌운다.
 * 본문은 `/student/dashboard`로만 redirect한다.
 */

import { redirect } from "next/navigation";

/** 학생 홈으로 보낸다. */
export default function StudentPage() {
    redirect("/student/dashboard");
}
