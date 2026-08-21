/**
 * `/parent` 학부모 루트.
 *
 * layout이 `requireRole("PARENT")` + MemberShell을 이미 씌운다.
 * 본문은 `/parent/dashboard`로만 redirect한다.
 */

import { redirect } from "next/navigation";

/** 자녀 홈으로 보낸다. */
export default function ParentPage() {
    redirect("/parent/dashboard");
}
