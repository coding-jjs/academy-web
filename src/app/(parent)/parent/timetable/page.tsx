/**
 * `/parent/timetable` 자녀 주간 시간표.
 *
 * 연 사람: PARENT. layout 가드 + page `requireRole("PARENT")`.
 * 흐름: requireRole → `getParentTimetableData` → resolveChild →
 * `ParentTimetableScreen`.
 *
 * 일정을 고치지 않는다. Session 행이 진실이다.
 */

import { requireRole } from "@/lib/auth-guard"; // 학부모만.
import { getParentTimetableData } from "@/features/timetable/data"; // 주간 그리드. 일정은 고치지 않는다.
import { resolveChild } from "@/features/families/resolve-child"; // ?childId 우선, 없으면 쿠키.
import ParentTimetableScreen from "./ParentTimetableScreen"; // 읽기 전용. 원장 반 CRUD가 아니다.
import { readParentChildCookie } from "@/features/families/parent-child-cooke"; // 쿠키 키 읽기.
import { cookies } from "next/headers"; // 마지막 선택 자녀 쿠키.

export const dynamic = "force-dynamic"; // 주간 세션이 캐시에 안 남게.

/** 주간 그리드와 활성 자녀를 Screen에 넘긴다. */
export default async function ParentTimetablePage({ // proxy→layout→page. Session 행이 진실.
    searchParams, // ?childId. 쿠키보다 우선.
}: { // page props.
    searchParams: Promise<{ childId?: string }>; // App Router searchParams.
}) { // ParentTimetablePage props 끝.
    const session = await requireRole("PARENT"); // 학부모만.
    const params = await searchParams; // ?childId. 쿠키보다 우선.
    const cookieStore = await cookies(); // 마지막 선택 자녀 쿠키.
    const { childList, weekDays } = await getParentTimetableData( // 주간 그리드. 일정은 고치지 않는다.
        session.user.id, // 연결된 자녀만.
    ); // 호출/그룹 끝.
    const activeChildId = resolveChild( // ?childId 우선, 없으면 쿠키.
        childList.map((child) => child.id), // 연결된 자녀 id만.
        params.childId ?? readParentChildCookie(cookieStore), // 쿼리 없으면 쿠키.
    ); // 호출/그룹 끝.
    return ( // key로 자녀 전환 시 그리드를 리셋.
        <ParentTimetableScreen // 읽기 전용. 원장 반 CRUD가 아니다.
            key={activeChildId} // 자녀 전환 시 그리드 리셋.
            childList={childList} // 자녀 주간 세션.
            weekDays={weekDays} // 요일 축.
            activeChildId={activeChildId} // 선택된 자녀.
        /> // ParentTimetableScreen 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
