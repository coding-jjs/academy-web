/**
 * `/director` 원장 루트.
 *
 * layout이 `requireRole("DIRECTOR")` + AdminShell을 이미 씌운다.
 * 본문은 `/director/dashboard`로만 redirect한다. Screen·data를 읽지 않는다.
 */

import { redirect } from "next/navigation"; // UI를 그리지 않는다. 대시보드로만.

/** 대시보드로 보낸다. */
export default function DirectorPage() { // 원장 루트. layout 가드만 탄다.
    redirect("/director/dashboard"); // 원장 루트는 대시보드로만. Screen·data는 읽지 않는다.
} // 블록 끝.
