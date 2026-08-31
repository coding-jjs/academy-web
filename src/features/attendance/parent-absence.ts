import "server-only";

/**
 * 학부모 결석 신청의 실제 쓰기. 인증은 호출 측이 한다.
 *
 * 호출:
 * - `parent-actions.requestAbsence` (웹 폼, 쿠키 세션)
 * - `app/api/mobile/parent/attendance/absence` (앱 Bearer)
 *
 * AbsenceRequest만 upsert한다. AttendanceRecord는 만들지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - PARENT 역할 검사. 페이지 Action·API 가드가 한다.
 * - 지난 수업·CANCELLED 회차 신청.
 *
 * 관련: `parent-actions.ts`, `parent-data.ts`.
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export type ParentAbsenceResult =
    | { ok: true; message: string }
    | {
          ok: false;
          code:
              | "INVALID_INPUT"
              | "NOT_LINKED"
              | "SESSION_NOT_FOUND"
              | "SAVE_FAILED";
          message: string;
      };

/**
 * 미래 SCHEDULED 회차에 사유 결석을 upsert한다.
 *
 * @param parentUserId 이미 PARENT로 확인된 User.id
 * @auth 이 함수는 역할을 보지 않는다. 링크 where만 본다.
 * @sideEffects absenceRequest upsert, `/parent/attendance` revalidate
 */
export async function submitParentAbsence(input: {
    parentUserId: string;
    studentId: string;
    sessionId: string;
    reason: string;
}): Promise<ParentAbsenceResult> {
    const studentId = input.studentId.trim();
    const sessionId = input.sessionId.trim();
    const reason = input.reason.trim();

    if (!studentId || !sessionId) {
        return {
            ok: false,
            code: "INVALID_INPUT",
            message: "수업 일정을 선택해 주세요.",
        };
    }
    if (reason.length < 2 || reason.length > 300) {
        return {
            ok: false,
            code: "INVALID_INPUT",
            message: "사유는 2~300자로 입력해 주세요.",
        };
    }

    const link = await prisma.parentStudentLink.findFirst({
        where: {
            parentUserId: input.parentUserId,
            studentId,
            endedAt: null,
        },
        select: { id: true },
    });
    if (!link) {
        return {
            ok: false,
            code: "NOT_LINKED",
            message: "연결된 자녀가 아닙니다.",
        };
    }

    const classSession = await prisma.classSession.findFirst({
        where: {
            id: sessionId,
            startsAt: { gte: new Date() },
            status: "SCHEDULED",
            class: {
                enrollments: {
                    some: {
                        studentId,
                        status: "ACTIVE",
                        endedAt: null,
                    },
                },
            },
        },
        select: { id: true },
    });
    if (!classSession) {
        return {
            ok: false,
            code: "SESSION_NOT_FOUND",
            message: "신청 가능한 예정 수업을 찾을 수 없습니다.",
        };
    }

    try {
        await prisma.absenceRequest.upsert({
            where: {
                studentId_sessionId: { studentId, sessionId },
            },
            create: {
                studentId,
                sessionId,
                requestedBy: input.parentUserId,
                reason,
            },
            update: {
                reason,
                requestedBy: input.parentUserId,
                cancelledAt: null,
            },
        });

        revalidatePath("/parent/attendance");
        return {
            ok: true,
            message:
                "사유 결석이 접수되었습니다. 담당 선생님이 출결 기록 시 확인합니다.",
        };
    } catch {
        return {
            ok: false,
            code: "SAVE_FAILED",
            message: "신청에 실패했습니다.",
        };
    }
}
