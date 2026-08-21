"use server";

/**
 * 원장 이탈 케어: 담당 배정, 개선 확정, 재상담, 임계값 저장, 감지 실행.
 *
 * 호출: `(director)/director/churn/DirectorChurnScreen`.
 * 감지 로직(신호 4종, ENROLLED 스캔)은 `@/lib/churn-detect`에 두고,
 * 이 파일은 권한 확인 후 화면이 호출하는 명령만 노출한다.
 *
 * 워크플로: DETECTED → (배정) COUNSELING → (담당자 검토요청) PENDING_REVIEW
 * → 원장 confirmChurnImproved / returnChurnToCounseling.
 *
 * 의도적으로 하지 않는 일:
 * - 교사가 IMPROVED로 바로 확정하지 않는다. 원장만 confirm.
 * - WITHDRAWN 전이는 이 파일에 없다. `student-lifecycle`이 퇴원 시 닫는다.
 *
 * 관련: `data.ts`, `teacher-actions.ts`.
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { detectChurnCases } from "@/lib/churn-detect";
import { prisma } from "@/lib/db";

export type ChurnActionResult =
    | { ok: true; message: string }
    | { ok: false; message: string };

/** 원장만. 교사·직원은 이탈 큐를 배정·확정하지 못한다. */
async function requireDirector() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "DIRECTOR") {
        return null;
    }
    return session;
}

/** 원장·교사·직원 이탈 화면을 같이 갱신한다. */
function revalidateChurnPaths() {
    revalidatePath("/director/churn");
    revalidatePath("/director/dashboard");
    revalidatePath("/teacher/counseling");
    revalidatePath("/teacher/dashboard");
    revalidatePath("/employee/counseling");
    revalidatePath("/employee/dashboard");
}

/** 열린 케이스를 담당 반 교사·직원에게 맡기고 COUNSELING으로 둔다. */
export async function assignChurnCounseling(input: {
    churnCaseId: string;
    teacherUserId: string;
}): Promise<ChurnActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    const churnCaseId = String(input.churnCaseId ?? "").trim();
    const teacherUserId = String(input.teacherUserId ?? "").trim();
    if (!churnCaseId) {
        return { ok: false, message: "이탈 케이스 ID가 없습니다." };
    }
    if (!teacherUserId) {
        return { ok: false, message: "담당자를 선택해 주세요." };
    }

    const row = await prisma.churnCase.findUnique({
        where: { id: churnCaseId },
        select: { id: true, status: true, studentId: true },
    });

    if (!row) {
        return { ok: false, message: "이탈 케이스를 찾을 수 없습니다." };
    }
    if (
        row.status !== "DETECTED" &&
        row.status !== "COUNSELING" &&
        row.status !== "PENDING_REVIEW"
    ) {
        return {
            ok: false,
            message: "열린 케이스만 담당자에게 배정할 수 있습니다.",
        };
    }

    const assignee = await prisma.user.findFirst({
        where: {
            id: teacherUserId,
            role: { in: ["TEACHER", "STAFF"] },
            status: "ACTIVE",
        },
        select: { id: true, name: true, role: true },
    });

    if (!assignee) {
        return { ok: false, message: "담당할 선생님·직원을 찾을 수 없습니다." };
    }

    const teachesStudent = await prisma.classEnrollment.findFirst({
        where: {
            studentId: row.studentId,
            status: "ACTIVE",
            endedAt: null,
            class: { teacherUserId: assignee.id },
        },
        select: { id: true },
    });

    if (!teachesStudent) {
        return {
            ok: false,
            message: "이 학생의 담당 반 선생님·직원만 배정할 수 있습니다.",
        };
    }

    await prisma.churnCase.update({
        where: { id: row.id },
        data: {
            status: "COUNSELING",
            assignedUserId: assignee.id,
            resolvedAt: null,
        },
    });

    revalidateChurnPaths();
    const roleLabel = assignee.role === "STAFF" ? "직원" : "선생님";
    return {
        ok: true,
        message: `${assignee.name} ${roleLabel}에게 상담을 배정했습니다.`,
    };
}

/** PENDING_REVIEW만 IMPROVED로 확정. 상담 메모가 있어야 한다. */
export async function confirmChurnImproved(input: {
    churnCaseId: string;
}): Promise<ChurnActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    const churnCaseId = String(input.churnCaseId ?? "").trim();
    if (!churnCaseId) {
        return { ok: false, message: "이탈 케이스 ID가 없습니다." };
    }

    const row = await prisma.churnCase.findUnique({
        where: { id: churnCaseId },
        select: {
            id: true,
            status: true,
            _count: { select: { counselingMemos: true } },
        },
    });

    if (!row) {
        return { ok: false, message: "이탈 케이스를 찾을 수 없습니다." };
    }
    if (row.status !== "PENDING_REVIEW") {
        return {
            ok: false,
            message: "선생님이 검토를 요청한 케이스만 개선으로 확정할 수 있습니다.",
        };
    }
    if (row._count.counselingMemos === 0) {
        return {
            ok: false,
            message: "상담 기록이 없어 개선으로 확정할 수 없습니다.",
        };
    }

    await prisma.churnCase.update({
        where: { id: row.id },
        data: {
            status: "IMPROVED",
            resolvedAt: new Date(),
        },
    });

    revalidateChurnPaths();
    return { ok: true, message: "개선으로 확정했습니다." };
}

/** 검토 대기를 COUNSELING으로 되돌려 담당자에게 재상담을 맡긴다. */
export async function returnChurnToCounseling(input: {
    churnCaseId: string;
}): Promise<ChurnActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    const churnCaseId = String(input.churnCaseId ?? "").trim();
    if (!churnCaseId) {
        return { ok: false, message: "이탈 케이스 ID가 없습니다." };
    }

    const row = await prisma.churnCase.findUnique({
        where: { id: churnCaseId },
        select: { id: true, status: true },
    });

    if (!row) {
        return { ok: false, message: "이탈 케이스를 찾을 수 없습니다." };
    }
    if (row.status !== "PENDING_REVIEW") {
        return {
            ok: false,
            message: "검토 대기 케이스만 다시 상담으로 보낼 수 있습니다.",
        };
    }

    await prisma.churnCase.update({
        where: { id: row.id },
        data: {
            status: "COUNSELING",
            resolvedAt: null,
        },
    });

    revalidateChurnPaths();
    return { ok: true, message: "선생님에게 재상담을 요청했습니다." };
}

/** id=1 임계값 upsert. 감지기 다음 스캔에 반영된다. */
export async function saveChurnThreshold(input: {
    attendanceDropPercentPoint: number;
    scoreDropPoints: number;
    consecutiveAbsences: number;
    unpaidDays: number;
}): Promise<ChurnActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    const attendanceDropPercentPoint = Number(
        input.attendanceDropPercentPoint,
    );
    const scoreDropPoints = Number(input.scoreDropPoints);
    const consecutiveAbsences = Number(input.consecutiveAbsences);
    const unpaidDays = Number(input.unpaidDays);

    if (
        !Number.isFinite(attendanceDropPercentPoint) ||
        attendanceDropPercentPoint < 0 ||
        attendanceDropPercentPoint > 100
    ) {
        return { ok: false, message: "출석 하락(%p) 값이 올바르지 않습니다." };
    }
    if (!Number.isFinite(scoreDropPoints) || scoreDropPoints < 0) {
        return { ok: false, message: "성적 하락 값이 올바르지 않습니다." };
    }
    if (
        !Number.isInteger(consecutiveAbsences) ||
        consecutiveAbsences < 1 ||
        consecutiveAbsences > 30
    ) {
        return { ok: false, message: "연속 결석 횟수가 올바르지 않습니다." };
    }
    if (
        !Number.isInteger(unpaidDays) ||
        unpaidDays < 1 ||
        unpaidDays > 90
    ) {
        return { ok: false, message: "미납 일수가 올바르지 않습니다." };
    }

    await prisma.churnThresholdConfig.upsert({
        where: { id: 1 },
        create: {
            id: 1,
            attendanceDropPercentPoint,
            scoreDropPoints,
            consecutiveAbsences,
            unpaidDays,
            updatedBy: session.user.id,
        },
        update: {
            attendanceDropPercentPoint,
            scoreDropPoints,
            consecutiveAbsences,
            unpaidDays,
            updatedBy: session.user.id,
        },
    });

    revalidatePath("/director/churn");
    return { ok: true, message: "임계값을 저장했습니다." };
}

/** ENROLLED 전원을 스캔해 신호를 쌓는다. 열린 카드는 summary만. */
export async function runChurnDetection(): Promise<ChurnActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    try {
        const result = await detectChurnCases();
        revalidateChurnPaths();

        return {
            ok: true,
            message: `감지 완료: 학생 ${result.scanned}명 · 신규 ${result.created} · 갱신 ${result.updated} · 신호 ${result.signalCount}`,
        };
    } catch (error) {
        return {
            ok: false,
            message:
                error instanceof Error
                    ? error.message
                    : "이탈 감지 중 오류가 발생했습니다.",
        };
    }
}
