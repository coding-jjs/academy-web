"use server";

/**
 * 학부모가 연결된 자녀의 예정 수업에 사유 결석을 신청한다.
 *
 * 호출: `(parent)/parent/attendance/ParentAttendanceScreen.tsx`
 * (`useActionState(requestAbsence)`).
 *
 * AbsenceRequest만 upsert하며 AttendanceRecord는 만들지 않는다.
 * 실제 출결은 담당 교사가 `saveSessionAttendance`로 기록한다.
 *
 * 의도적으로 하지 않는 일:
 * - 지난 수업·CANCELLED 회차에는 신청하지 않는다.
 * - 링크되지 않은 원생 id를 폼에 넣어도 거절한다.
 *
 * 관련: `features/attendance/parent-data.ts`, `features/families/actions.ts`.
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * 결석 신청 폼의 useActionState 상태.
 */
export type AbsenceState = {
    status: "idle" | "error" | "success";
    message: string;
};

/**
 * 미래 SCHEDULED 회차에 대해 AbsenceRequest를 upsert한다.
 *
 * 재신청 시 `cancelledAt`을 null로 되돌려 취소된 신청을 다시 연다.
 * 출석 행은 건드리지 않는다 — 교사가 공결/결석을 직접 찍는다.
 *
 * @param _prev useActionState 직전 상태.
 * @param formData `studentId`, `sessionId`, `reason`(2~300자).
 * @auth PARENT. 활성 ParentStudentLink 필수.
 * @sideEffects absenceRequest upsert, `/parent/attendance` revalidate.
 */
export async function requestAbsence(
    _prev: AbsenceState,
    formData: FormData,
): Promise<AbsenceState> {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "PARENT") {
        return { status: "error", message: "학부모 로그인이 필요합니다." };
    }

    const studentId = String(formData.get("studentId") ?? "").trim();
    const sessionId = String(formData.get("sessionId") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();

    if (!studentId || !sessionId) {
        return { status: "error", message: "수업 일정을 선택해 주세요." };
    }
    if (reason.length < 2 || reason.length > 300) {
        return { status: "error", message: "사유는 2~300자로 입력해 주세요." };
    }

    const link = await prisma.parentStudentLink.findFirst({
        where: {
            parentUserId: session.user.id,
            studentId,
            endedAt: null,
        },
        select: { id: true },
    });
    if (!link) {
        return { status: "error", message: "연결된 자녀가 아닙니다." };
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
            status: "error",
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
                requestedBy: session.user.id,
                reason,
            },
            update: {
                reason,
                requestedBy: session.user.id,
                cancelledAt: null,
            },
        });

        revalidatePath("/parent/attendance");
        return {
            status: "success",
            message:
                "사유 결석이 접수되었습니다. 담당 선생님가 출결 기록 시 확인합니다.",
        };
    } catch {
        return { status: "error", message: "신청에 실패했습니다." };
    }
}
