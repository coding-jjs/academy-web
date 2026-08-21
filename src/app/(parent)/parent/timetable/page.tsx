/**
 * `/parent/timetable` 자녀 주간 시간표.
 *
 * 연 사람: PARENT. layout 가드 + page `requireRole("PARENT")`.
 * 흐름: requireRole → `getParentTimetableData` → resolveChild →
 * `ParentTimetableScreen`.
 *
 * 일정을 고치지 않는다. Session 행이 진실이다.
 */

import { requireRole } from "@/lib/auth-guard";
import { getParentTimetableData } from "@/features/timetable/data";
import { resolveChild } from "@/features/families/resolve-child";
import ParentTimetableScreen from "./ParentTimetableScreen";
import { readParentChildCookie } from "@/features/families/parent-child-cooke";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/** 주간 그리드와 활성 자녀를 Screen에 넘긴다. */
export default async function ParentTimetablePage({
    searchParams,
}: {
    searchParams: Promise<{ childId?: string }>;
}) {
    const session = await requireRole("PARENT");
    const params = await searchParams;
    const cookieStore = await cookies();
    const { childList, weekDays } = await getParentTimetableData(
        session.user.id,
    );
    const activeChildId = resolveChild(
        childList.map((child) => child.id),
        params.childId ?? readParentChildCookie(cookieStore),
    );
    return (
        <ParentTimetableScreen
            key={activeChildId}
            childList={childList}
            weekDays={weekDays}
            activeChildId={activeChildId}
        />
    );
}
