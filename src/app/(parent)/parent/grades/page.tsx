/**
 * `/parent/grades` 자녀 성적·오답 열람.
 *
 * 연 사람: PARENT. layout 가드 + page `requireRole("PARENT")`.
 * 흐름: requireRole → `getParentGradesChildren`(viewer-data) → resolveChild →
 * `ParentGradesScreen`.
 *
 * 쓰기는 없다. 입력은 교사/원장 성적 화면 몫이다.
 */

import { requireRole } from "@/lib/auth-guard"; // 학부모만.
import { resolveChild } from "@/features/families/resolve-child"; // ?childId 우선, 없으면 쿠키.
import ParentGradesScreen from "@/app/(parent)/parent/grades/ParentGradesScreen"; // 열람만. GradesManagementScreen이 아니다.
import { getParentGradesChildren } from "@/features/grades/viewer-data"; // 읽기 전용 자녀 성적. 입력은 교사/원장 몫.
import { readParentChildCookie } from "@/features/families/parent-child-cooke"; // 쿠키 키 읽기.
import { cookies } from "next/headers"; // 마지막 선택 자녀 쿠키.

export const dynamic = "force-dynamic"; // 자녀 성적이 캐시에 안 남게.

/** 읽기 전용 자녀 성적 묶음을 Screen에 넘긴다. */
export default async function ParentGradesPage({ // proxy→layout→page. 쓰기는 교사/원장.
    searchParams, // ?childId. 쿠키보다 우선.
}: { // page props.
    searchParams: Promise<{ childId?: string }>; // App Router searchParams.
}) { // ParentGradesPage props 끝.
    const session = await requireRole("PARENT"); // 학부모만.
    const params = await searchParams; // ?childId. 쿠키보다 우선.
    const cookieStore = await cookies(); // 마지막 선택 자녀 쿠키.
    const children = await getParentGradesChildren(session.user.id); // 읽기 전용 자녀 성적. 입력은 교사/원장 몫.
    const activeChildId = resolveChild( // ?childId 우선, 없으면 쿠키.
        children.map((child) => child.id), // 연결된 자녀 id만.
        params.childId ?? readParentChildCookie(cookieStore), // 쿼리 없으면 쿠키.
    ); // 호출/그룹 끝.

    return ( // Screen에 목록만.
        <ParentGradesScreen // 열람만. GradesManagementScreen이 아니다.
            childList={children} // 자녀 성적 묶음.
            activeChildId={activeChildId} // 선택된 자녀.
        /> // ParentGradesScreen 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
