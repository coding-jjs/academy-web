/**
 * `GET /api/mobile/student/grades`. 본인 성적·오답.
 *
 * 미연결이면 `linked: false`. 학생만 오답 imageUrls를 받는다.
 *
 * 관련: `features/grades/viewer-data.ts`.
 */

import { getStudentGradesData } from "@/features/grades/viewer-data";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function GET(request: Request) {
    const auth = await requireMobileRole(request, "STUDENT");
    if (!auth.ok) return auth.response;

    const data = await getStudentGradesData(auth.user.id, auth.user.name);
    return Response.json(data);
}
