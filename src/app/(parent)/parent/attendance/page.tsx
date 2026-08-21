/**
 * `/parent/attendance` 자녀 수업·결석 신청.
 *
 * 연 사람: PARENT. layout 가드 + page `requireRole("PARENT")`.
 * 흐름: requireRole → `getParentAttendanceChildren`(parent-data) →
 * resolveChild → `ParentAttendanceScreen`.
 *
 * 출석 행을 만들지 않는다. 신청은 Screen의 `requestAbsence`.
 */

import { getParentAttendanceChildren } from "@/features/attendance/parent-data";
import { resolveChild } from "@/features/families/resolve-child";
import { requireRole } from "@/lib/auth-guard";
import { cookies } from "next/headers";
import { readParentChildCookie } from "@/features/families/parent-child-cooke";
import ParentAttendanceScreen from "./ParentAttendanceScreen";

/** 자녀 세션과 결석 신청 가능 목록을 Screen에 넘긴다. */
export default async function ParentAttendencePage({
    searchParams,
}: {
    searchParams: Promise<{ childId?: string }>;
}) {
    const session = await requireRole("PARENT");
    const params = await searchParams;
    const cookieStore = await cookies();
    const children = await getParentAttendanceChildren(session.user.id);
    const activeChildId = resolveChild(
        children.map((child) => child.id),
        params.childId ?? readParentChildCookie(cookieStore),
    );
    return (
        <ParentAttendanceScreen
            childList={children}
            activeChildId={activeChildId}
        />
    );
}
