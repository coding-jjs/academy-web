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

import type { ReactNode } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { requireRole } from "@/lib/auth-guard";

/** 원장만 통과시키고 관리자 내비를 붙인다. */
export default async function DirectorLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requireRole("DIRECTOR");
    return <AdminShell role="director">{children}</AdminShell>;
}
