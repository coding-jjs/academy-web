/**
 * `/parent/reports` 발송된 학습 리포트 열람.
 *
 * 연 사람: PARENT. layout 가드 + page `requireRole("PARENT")`.
 * 흐름: requireRole → `getParentReportChildren` → resolveChild →
 * `ParentReportsScreen`.
 *
 * SENT로 학부모에게 나간 것만 보인다. 초안/반려는 숨긴다. 쓰기는 없다.
 */

import { requireRole } from "@/lib/auth-guard";
import ParentReportsScreen from "@/app/(parent)/parent/reports/ParentReportsScreen";
import { getParentReportChildren } from "@/features/reports/parent-data";
import { resolveChild } from "@/features/families/resolve-child";
import { readParentChildCookie } from "@/features/families/parent-child-cooke";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * 자녀별 받은 리포트를 Screen에 넘긴다. `key`로 자녀 전환 시 선택 리포트를 리셋한다.
 */
export default async function ParentReportsPage({
    searchParams,
}: {
    searchParams: Promise<{ childId?: string }>;
}) {
    const session = await requireRole("PARENT");
    const params = await searchParams;
    const cookieStore = await cookies();
    const children = await getParentReportChildren(session.user.id);
    const activeChildId = resolveChild(
        children.map((child) => child.id),
        params.childId ?? readParentChildCookie(cookieStore),
    );

    return (
        <ParentReportsScreen
            key={activeChildId}
            childList={children}
            activeChildId={activeChildId}
        />
    );
}
