/**
 * `/parent` 학부모 루트.
 *
 * layout이 `requireRole("PARENT")` + MemberShell을 이미 씌운다.
 * 본문은 `/parent/dashboard`로만 redirect한다.
 */

import { redirect } from "next/navigation"; // UI를 그리지 않는다. 자녀 홈으로만.

/** 자녀 홈으로 보낸다. */
export default function ParentPage() { // 학부모 루트. layout 가드만 탄다.
    redirect("/parent/dashboard"); // 학부모 루트는 자녀 홈으로만. 결제는 /parent/payments 준비 중.
} // 블록 끝.
