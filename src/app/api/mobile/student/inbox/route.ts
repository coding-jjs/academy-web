/**
 * `GET /api/mobile/student/inbox`. 학생 쪽지함.
 *
 * 웹과 같이 `/student/`가 아닌 deepLink는 숨긴다.
 *
 * 관련: `features/messages/inbox-data.ts`.
 */

import { getStudentInboxData } from "@/features/messages/inbox-data";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function GET(request: Request) {
    const auth = await requireMobileRole(request, "STUDENT");
    if (!auth.ok) return auth.response;

    const data = await getStudentInboxData(auth.user.id);
    return Response.json(data);
}
