/**
 * `/parent/grades` 자녀 성적·오답 열람.
 *
 * 연 사람: PARENT. layout 가드 + page `requireRole("PARENT")`.
 * 흐름: requireRole → `getParentGradesChildren`(viewer-data) → resolveChild →
 * `ParentGradesScreen`.
 *
 * 쓰기는 없다. 입력은 교사/원장 성적 화면 몫이다.
 */

import { requireRole } from "@/lib/auth-guard";
import { resolveChild } from "@/features/families/resolve-child";
import ParentGradesScreen from "@/app/(parent)/parent/grades/ParentGradesScreen";
import { getParentGradesChildren } from "@/features/grades/viewer-data";
import { readParentChildCookie } from "@/features/families/parent-child-cooke";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/** 읽기 전용 자녀 성적 묶음을 Screen에 넘긴다. */
export default async function ParentGradesPage({
    searchParams,
}: {
    searchParams: Promise<{ childId?: string }>;
}) {
    const session = await requireRole("PARENT");
    const params = await searchParams;
    const cookieStore = await cookies();
    const children = await getParentGradesChildren(session.user.id);
    const activeChildId = resolveChild(
        children.map((child) => child.id),
        params.childId ?? readParentChildCookie(cookieStore),
    );

    return (
        <ParentGradesScreen
            childList={children}
            activeChildId={activeChildId}
        />
    );
}
