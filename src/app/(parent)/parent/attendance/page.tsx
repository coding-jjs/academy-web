/**
 * `/parent/attendance` 자녀 수업·결석 신청.
 *
 * 연 사람: PARENT. layout 가드 + page `requireRole("PARENT")`.
 * 흐름: requireRole → `getParentAttendanceChildren`(parent-data) →
 * resolveChild → `ParentAttendanceScreen`.
 *
 * 출석 행을 만들지 않는다. 신청은 Screen의 `requestAbsence`.
 */

import { getParentAttendanceChildren } from "@/features/attendance/parent-data"; // 자녀 세션·결석 신청 가능 목록. 출석 행은 만들지 않는다.
import { resolveChild } from "@/features/families/resolve-child"; // ?childId 우선, 없으면 쿠키.
import { requireRole } from "@/lib/auth-guard"; // 학부모만.
import { cookies } from "next/headers"; // 마지막 선택 자녀 쿠키.
import { readParentChildCookie } from "@/features/families/parent-child-cooke"; // 쿠키 키 읽기.
import ParentAttendanceScreen from "./ParentAttendanceScreen"; // 출석 저장 UI가 아니다. 교사 AttendanceSessionEditor와 별개.

/** 자녀 세션과 결석 신청 가능 목록을 Screen에 넘긴다. */
export default async function ParentAttendencePage({ // proxy→layout→page. 신청은 requestAbsence.
    searchParams, // ?childId. 쿠키보다 우선.
}: { // page props.
    searchParams: Promise<{ childId?: string }>; // App Router searchParams.
}) { // ParentAttendencePage props 끝.
    const session = await requireRole("PARENT"); // 학부모만.
    const params = await searchParams; // ?childId. 쿠키보다 우선.
    const cookieStore = await cookies(); // 마지막 선택 자녀 쿠키.
    const children = await getParentAttendanceChildren(session.user.id); // 자녀 세션·결석 신청 가능 목록. 출석 행은 만들지 않는다.
    const activeChildId = resolveChild( // ?childId 우선, 없으면 쿠키.
        children.map((child) => child.id), // 연결된 자녀 id만.
        params.childId ?? readParentChildCookie(cookieStore), // 쿼리 없으면 쿠키.
    ); // 호출/그룹 끝.
    return ( // Screen에 목록만. 신청은 requestAbsence.
        <ParentAttendanceScreen // 출석 저장 UI가 아니다. 교사 AttendanceSessionEditor와 별개.
            childList={children} // 자녀 세션 목록.
            activeChildId={activeChildId} // 선택된 자녀. 쿠키/쿼리로 고른다.
        /> // ParentAttendanceScreen 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
