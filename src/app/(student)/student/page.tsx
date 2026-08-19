/**
 * `/student` 학생 루트.
 *
 * layout이 `requireRole("STUDENT")` + MemberShell을 이미 씌운다.
 * 본문은 `/student/dashboard`로만 redirect한다.
 */

import { redirect } from "next/navigation"; // UI를 그리지 않는다. 학생 홈으로만.

/** 학생 홈으로 보낸다. */
export default function StudentPage() { // 학생 루트. layout 가드만 탄다.
    redirect("/student/dashboard"); // 학생 루트는 홈으로만. 본인 카드 요약.
} // 블록 끝.
