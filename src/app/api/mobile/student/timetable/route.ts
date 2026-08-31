/**
 * `GET /api/mobile/student/timetable`. 본인 주간 시간표.
 *
 * 회차에 오늘 출석 상태가 붙는다. 출석 쓰기는 없다.
 *
 * 관련: `features/timetable/data.ts`.
 */

import { getStudentTimetableData } from "@/features/timetable/data";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function GET(request: Request) {
    const auth = await requireMobileRole(request, "STUDENT");
    if (!auth.ok) return auth.response;

    const data = await getStudentTimetableData(auth.user.id, auth.user.name);
    return Response.json(data);
}
