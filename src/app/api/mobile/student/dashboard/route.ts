/**
 * `GET /api/mobile/student/dashboard`. 학생 앱 홈.
 *
 * 웹 `/student/dashboard`와 같다. 원생 카드가 없으면 `linked: false`.
 * 쓰기는 없다. 출석 체크인은 교사 화면 몫이다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모 자녀 목록을 섞지 않는다. 본인 `Student.userId`만.
 *
 * 관련: `features/dashboard/student-data.ts`, `lib/mobile-auth.ts`.
 */

import { getStudentDashboardData } from "@/features/dashboard/student-data";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function GET(request: Request) {
    const auth = await requireMobileRole(request, "STUDENT");
    if (!auth.ok) return auth.response;

    const data = await getStudentDashboardData(auth.user.id, auth.user.name);
    return Response.json(data);
}
