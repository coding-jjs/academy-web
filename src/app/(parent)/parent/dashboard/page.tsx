/**
 * `/parent/dashboard` 학부모 자녀 홈.
 *
 * 연 사람: PARENT. layout 가드 + page `requireRole("PARENT")`.
 * 흐름: requireRole → `getParentDashboardData`(parent-data) →
 * `resolveChild`(`?childId` 또는 child 쿠키) → `ParentDashboardScreen`.
 *
 * 결제 바로가기는 `/parent/payments`로 가지만 그 page는 준비 중 카피다.
 */

import { requireRole } from "@/lib/auth-guard";
import { getParentDashboardData } from "@/features/dashboard/parent-data";
import ParentDashboardScreen from "./ParentDashboardScreen";
import { resolveChild } from "@/features/families/resolve-child";
import { cookies } from "next/headers";
import { readParentChildCookie } from "@/features/families/parent-child-cooke";

export const dynamic = "force-dynamic";

/**
 * 연결된 자녀와 활성 childId를 홈 Screen에 넘긴다.
 *
 * @param searchParams `childId`가 있으면 쿠키보다 우선한다.
 */
export default async function ParentDashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ childId?: string }>;
}) {
    const session = await requireRole("PARENT");
    const params = await searchParams;
    const cookieStore = await cookies();
    const data = await getParentDashboardData(session.user.id);
    const activeChildId = resolveChild(
        data.childList.map((child) => child.id),
        params.childId ?? readParentChildCookie(cookieStore),
    );

    return <ParentDashboardScreen {...data} activeChildId={activeChildId} />;
}
