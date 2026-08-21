/**
 * `/director` 원장 루트.
 *
 * layout이 `requireRole("DIRECTOR")` + AdminShell을 이미 씌운다.
 * 본문은 `/director/dashboard`로만 redirect한다. Screen·data를 읽지 않는다.
 */

import { redirect } from "next/navigation";

/** 대시보드로 보낸다. */
export default function DirectorPage() {
    redirect("/director/dashboard");
}
