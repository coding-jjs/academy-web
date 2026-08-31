/**
 * `GET /api/mobile/parent/attendance`. 학부모 앱 출결.
 *
 * 웹 `/parent/attendance`와 같은 자녀별 오늘·주간 회차·월간 집계.
 * 결석 신청 쓰기는 `POST .../attendance/absence`.
 *
 * 의도적으로 하지 않는 일:
 * - 출석 상태를 바꾸지 않는다. 교사가 기록한다.
 *
 * 관련: `features/attendance/parent-data.ts`.
 */

import { getParentAttendanceChildren } from "@/features/attendance/parent-data";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function GET(request: Request) {
    const auth = await requireMobileRole(request, "PARENT");
    if (!auth.ok) return auth.response;

    const children = await getParentAttendanceChildren(auth.user.id);
    return Response.json({ children });
}
