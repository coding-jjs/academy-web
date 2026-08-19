/**
 * `/parent/dashboard` 학부모 자녀 홈.
 *
 * 연 사람: PARENT. layout 가드 + page `requireRole("PARENT")`.
 * 흐름: requireRole → `getParentDashboardData`(parent-data) →
 * `resolveChild`(`?childId` 또는 child 쿠키) → `ParentDashboardScreen`.
 *
 * 결제 바로가기는 `/parent/payments`로 가지만 그 page는 준비 중 카피다.
 */

import { requireRole } from "@/lib/auth-guard"; // 학부모만. 연결된 자녀만.
import { getParentDashboardData } from "@/features/dashboard/parent-data"; // 연결된 자녀 홈 DTO.
import ParentDashboardScreen from "./ParentDashboardScreen"; // 학부모 Screen. 결제는 준비 중 카피.
import { resolveChild } from "@/features/families/resolve-child"; // ?childId 우선, 없으면 쿠키.
import { cookies } from "next/headers"; // 마지막 선택 자녀 쿠키.
import { readParentChildCookie } from "@/features/families/parent-child-cooke"; // 쿠키 키 읽기. 링크를 만들지 않는다.

export const dynamic = "force-dynamic"; // 자녀 출석·리포트가 캐시에 안 남게.

/**
 * 연결된 자녀와 활성 childId를 홈 Screen에 넘긴다.
 *
 * @param searchParams `childId`가 있으면 쿠키보다 우선한다.
 */
export default async function ParentDashboardPage({ // proxy→layout→page. 결제는 /parent/payments 준비 중.
    searchParams, // ?childId. 쿠키보다 우선.
}: { // page props.
    searchParams: Promise<{ childId?: string }>; // App Router searchParams. 링크를 쓰지 않는다.
}) { // ParentDashboardPage props 끝.
    const session = await requireRole("PARENT"); // 학부모만. 연결된 자녀만.
    const params = await searchParams; // ?childId. 쿠키보다 우선.
    const cookieStore = await cookies(); // 마지막 선택 자녀 쿠키.
    const data = await getParentDashboardData(session.user.id); // 연결된 자녀 홈 DTO.
    const activeChildId = resolveChild( // ?childId 우선, 없으면 쿠키.
        data.childList.map((child) => child.id), // 연결된 자녀 id만. 전 학원이 아니다.
        params.childId ?? readParentChildCookie(cookieStore), // 쿼리 없으면 쿠키.
    ); // 호출/그룹 끝.

    return <ParentDashboardScreen {...data} activeChildId={activeChildId} />; // Screen에 props만. 결제는 준비 중 카피.
} // 블록 끝.
