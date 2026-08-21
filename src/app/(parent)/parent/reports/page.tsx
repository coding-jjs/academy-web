/**
 * `/parent/reports` 발송된 학습 리포트 열람.
 *
 * 연 사람: PARENT. layout 가드 + page `requireRole("PARENT")`.
 * 흐름: requireRole → `getParentReportChildren` → resolveChild →
 * `ParentReportsScreen`.
 *
 * SENT로 학부모에게 나간 것만 보인다. 초안/반려는 숨긴다. 쓰기는 없다.
 */

import { requireRole } from "@/lib/auth-guard"; // 학부모만.
import ParentReportsScreen from "@/app/(parent)/parent/reports/ParentReportsScreen"; // 열람만. 교사 초안·원장 승인 UI가 아니다.
import { getParentReportChildren } from "@/features/reports/parent-data"; // SENT로 나간 리포트만. 초안/반려는 숨긴다.
import { resolveChild } from "@/features/families/resolve-child"; // ?childId 우선, 없으면 쿠키.
import { readParentChildCookie } from "@/features/families/parent-child-cooke"; // 쿠키 키 읽기.
import { cookies } from "next/headers"; // 마지막 선택 자녀 쿠키.

export const dynamic = "force-dynamic"; // 발송 리포트가 캐시에 안 남게.

/**
 * 자녀별 받은 리포트를 Screen에 넘긴다. `key`로 자녀 전환 시 선택 리포트를 리셋한다.
 */
export default async function ParentReportsPage({ // proxy→layout→page. SENT만. 쓰기는 없다.
    searchParams, // ?childId. 쿠키보다 우선.
}: { // page props.
    searchParams: Promise<{ childId?: string }>; // App Router searchParams.
}) { // ParentReportsPage props 끝.
    const session = await requireRole("PARENT"); // 학부모만.
    const params = await searchParams; // ?childId. 쿠키보다 우선.
    const cookieStore = await cookies(); // 마지막 선택 자녀 쿠키.
    const children = await getParentReportChildren(session.user.id); // SENT로 나간 리포트만. 초안/반려는 숨긴다.
    const activeChildId = resolveChild( // ?childId 우선, 없으면 쿠키.
        children.map((child) => child.id), // 연결된 자녀 id만.
        params.childId ?? readParentChildCookie(cookieStore), // 쿼리 없으면 쿠키.
    ); // 호출/그룹 끝.

    return ( // key로 자녀 전환 시 선택 리포트를 리셋.
        <ParentReportsScreen // 열람만. 교사 초안·원장 승인 UI가 아니다.
            key={activeChildId} // 자녀 전환 시 선택 리포트 리셋.
            childList={children} // SENT 리포트만.
            activeChildId={activeChildId} // 선택된 자녀.
        /> // ParentReportsScreen 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
