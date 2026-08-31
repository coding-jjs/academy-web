/**
 * `GET /api/mobile/parent/dashboard`. 학부모 앱 홈.
 *
 * 웹 `/parent/dashboard`와 같은 묶음: 자녀 목록, 오늘 수업, 미읽음 쪽지, 뉴스 3건.
 * `getParentDashboardData`를 JSON으로만 내보낸다. 쓰기는 없다.
 *
 * `src/proxy.ts` matcher에 `/api/mobile`은 없다. 핸들러가 Bearer + PARENT를 검사한다.
 * 학생 토큰이면 401이 아니라 403.
 *
 * 의도적으로 하지 않는 일:
 * - child 쿠키. 앱이 `childList`에서 고른다.
 * - 결제/청구 요약. 웹 결제도 준비 중이다.
 *
 * 관련: `features/dashboard/parent-data.ts`, `lib/mobile-auth.ts`.
 */

import { getParentDashboardData } from "@/features/dashboard/parent-data";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function GET(request: Request) {
    const auth = await requireMobileRole(request, "PARENT");
    if (!auth.ok) return auth.response;

    const data = await getParentDashboardData(auth.user.id);
    return Response.json(data);
}
