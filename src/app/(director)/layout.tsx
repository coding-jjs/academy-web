/**
 * `(director)` URL 그룹 레이아웃. `/director/*`를 감싼다.
 *
 * `requireRole("DIRECTOR")` 후 `AdminShell role="director"`를 씌운다.
 * 하위 page가 권한을 반복하지 않게 여기서 한 번 막는다
 * (일부 page는 가드를 한 번 더 호출한다).
 *
 * 교사·직원 화면을 재사용하지 않는다. 원장 전용 Screen·features만 쓴다.
 * 청구(`/director/billing`)는 준비 중 카피만 있고 수납 정산은 없다.
 */

import type { ReactNode } from "react"; // children 타입. 세션은 requireRole이 돌려준다.
import AdminShell from "@/components/layout/AdminShell"; // 원장 내비. MemberShell이 아니다.
import { requireRole } from "@/lib/auth-guard"; // proxy 1차 후 DB 계정 재검사.

/** 원장만 통과시키고 관리자 내비를 붙인다. */
export default async function DirectorLayout({ // `/director/*` 껍데기. page→data→Screen은 하위.
    children, // 원장 page. 청구는 준비 중 카피만.
}: { // layout props.
    children: ReactNode; // AdminShell 안에 넣는다.
}) { // DirectorLayout props 끝.
    await requireRole("DIRECTOR"); // 원장만. 하위 page가 권한을 반복하지 않게 여기서 한 번.
    return <AdminShell role="director">{children}</AdminShell>; // 원장 AdminShell. 청구는 준비 중 카피만.
} // 블록 끝.
