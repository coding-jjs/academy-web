/**
 * `GET /api/mobile/parent/timetable`. 자녀 주간 시간표.
 *
 * 웹과 같이 `childList` + `weekDays`. CANCELLED 회차는 데이터 함수가 이미 뺀다.
 *
 * 관련: `features/timetable/data.ts`.
 */

import { getParentTimetableData } from "@/features/timetable/data";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function GET(request: Request) {
    const auth = await requireMobileRole(request, "PARENT");
    if (!auth.ok) return auth.response;

    const data = await getParentTimetableData(auth.user.id);
    return Response.json(data);
}
