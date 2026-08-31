/**
 * `POST /api/mobile/parent/attendance/absence`. 학부모 결석 신청.
 *
 * body: `{ studentId, sessionId, reason }`. reason 2~300자.
 * 웹 `requestAbsence`와 같은 `submitParentAbsence`를 탄다.
 *
 * 의도적으로 하지 않는 일:
 * - AttendanceRecord를 만들지 않는다.
 *
 * 관련: `features/attendance/parent-absence.ts`.
 */

import { submitParentAbsence } from "@/features/attendance/parent-absence";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function POST(request: Request) {
    const auth = await requireMobileRole(request, "PARENT");
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);
    const studentId =
        body && typeof body === "object" && "studentId" in body
            ? String(body.studentId)
            : "";
    const sessionId =
        body && typeof body === "object" && "sessionId" in body
            ? String(body.sessionId)
            : "";
    const reason =
        body && typeof body === "object" && "reason" in body
            ? String(body.reason)
            : "";

    const result = await submitParentAbsence({
        parentUserId: auth.user.id,
        studentId,
        sessionId,
        reason,
    });

    if (!result.ok) {
        const status =
            result.code === "INVALID_INPUT"
                ? 400
                : result.code === "NOT_LINKED"
                  ? 403
                  : result.code === "SESSION_NOT_FOUND"
                    ? 404
                    : 500;
        return Response.json(
            { error: result.code, message: result.message },
            { status },
        );
    }

    return Response.json({ ok: true, message: result.message });
}
