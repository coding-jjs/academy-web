/**
 * 공개 홈 `/`.
 *
 * 누구나 연다. `requireRole` 없음. `src/proxy.ts` matcher 밖이라
 * 미로그인도 통과한다. GUEST `/guest`도 여기로 redirect된다.
 *
 * 흐름: `auth()` + `getHomeNotices()` → `HomeScreen`.
 * 세션이 있으면 역할 홈 링크(`getRoleHomePath`)를 viewer로 넘긴다.
 *
 * 의도적으로 하지 않는 일:
 * - 공지 작성 UI를 열지 않는다 → `/notices` + 원장 `canWrite`.
 * - 상담 문의 폼을 두지 않는다 → `/guest/inquiry`.
 */

import type { Metadata } from "next";
import HomeScreen from "@/features/home/HomeScreen";
import { getHomeNotices } from "@/features/notices/data";
import { auth } from "@/lib/auth";
import { getRoleHomePath, roleLabels } from "@/lib/role-routes";

export const metadata: Metadata = {
    title: "A학원 · 배움의 흐름을 함께",
    description:
        "수업, 기록, 상담을 연결해 학생의 성장을 함께 만드는 A학원입니다.",
};

/**
 * 공개 랜딩. 로그인 여부에 따라 역할 홈 링크만 붙인다.
 */
export default async function HomePage() {
    const [session, notices] = await Promise.all([auth(), getHomeNotices()]);
    const user = session?.user?.id ? session.user : null;

    return (
        <HomeScreen
            viewer={
                user
                    ? {
                          name: user.name?.trim() || user.email || "사용자",
                          roleLabel: roleLabels[user.role],
                          dashboardHref: getRoleHomePath(user.role),
                      }
                    : null
            }
            notices={notices}
        />
    );
}
