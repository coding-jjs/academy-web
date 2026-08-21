/**
 * 원생 `ENROLLED` ↔ `PAUSED` ↔ `WITHDRAWN` 전이.
 * 퇴원 시 이탈 케이스를 닫고, 유예가 끝나면 연결된 User·수강·학부모 링크를 확정 정리한다.
 *
 * 호출:
 * - `features/students/director-actions.ts` → `transitionStudentStatus` (원장이 상태 변경)
 * - `account-access.getUsableAccount` → `finalizeExpiredWithdrawalsForUser`
 *   (로그인·페이지 가드 시점에 유예 만료를 확정)
 *
 * 서버 전용 쓰기. 호출부가 연 트랜잭션(`tx`)에 붙여 학생 update와 audit가 한 커밋이 되게 한다.
 * 확정 함수만 `prisma.$transaction`을 직접 연다 (로그인 경로에는 바깥 tx가 없음).
 *
 * 의도적으로 하지 않는 일:
 * - Student/User 행을 DELETE하지 않는다. 출석·청구 이력을 그대로 남긴다.
 * - 수강은 delete가 아니라 `CANCELLED` + `endedAt` — 과거 출석 회차 FK를 지탱한다.
 * - 원장·교사·직원 User는 건드리지 않는다. 원생 퇴원이 직원 로그인을 끄면 안 된다.
 * - 유예 중에는 로그인을 막지 않는다. 당일까지 학부모/학생이 조회할 수 있게 한다.
 *
 * 관련: `date-kst.ts` (유예 끝), `account-access.ts`, `audit.ts`, `churn-detect.ts`.
 */

import type { Prisma, StudentStatus } from "@/generate/prisma/client";
import { OPEN_CHURN_STATUSES } from "@/features/churn/types";
import {
    writeAuditLog,
    type AuditRequestMetadata,
} from "@/lib/audit";
import { isPastWithdrawalGrace } from "@/lib/date-kst";
import { prisma } from "@/lib/db";

/**
 * 원생 상태를 바꾸고 부수 효과를 적용한다. 같으면 no-op (`changed: false`).
 *
 * WITHDRAWN: `withdrawnAt=now`, 열린 이탈 케이스를 WITHDRAWN으로 닫음 (큐에 남기지 않음).
 * 그 외(재원/휴원): `withdrawnAt=null`로 유예 시계를 지우고,
 * 연결된 User가 GUEST/STUDENT이면 STUDENT+ACTIVE로 살린다 (로그인 복구).
 */
export async function transitionStudentStatus(
    tx: Prisma.TransactionClient,
    input: {
        studentId: string;
        status: StudentStatus;
        actorUserId: string;
        metadata: AuditRequestMetadata;
        now: Date;
    },
) {
    const student = await tx.student.findUnique({
        where: { id: input.studentId },
        select: {
            id: true,
            name: true,
            userId: true,
            status: true,
        },
    });

    if (!student) {
        throw new Error("학생을 찾을 수 없습니다.");
    }

    if (student.status === input.status) {
        return { student, changed: false };
    }

    await tx.student.update({
        where: { id: student.id },
        data: {
            status: input.status,
            withdrawnAt: input.status === "WITHDRAWN" ? input.now : null,
        },
    });

    if (input.status === "WITHDRAWN") {
        await tx.churnCase.updateMany({
            where: {
                studentId: student.id,
                status: { in: [...OPEN_CHURN_STATUSES] },
            },
            data: {
                status: "WITHDRAWN",
                resolvedAt: input.now,
            },
        });
    } else if (student.userId) {
        await tx.user.updateMany({
            where: {
                id: student.userId,
                role: { in: ["GUEST", "STUDENT"] },
            },
            data: { role: "STUDENT", status: "ACTIVE" },
        });
    }

    await writeAuditLog(tx, {
        actorUserId: input.actorUserId,
        action:
            input.status === "WITHDRAWN"
                ? "STUDENT_WITHDRAWN"
                : student.status === "WITHDRAWN"
                  ? "STUDENT_REENROLLED"
                  : "STUDENT_STATUS_CHANGED",
        targetType: "STUDENT",
        targetId: student.id,
        details: {
            previousStatus: student.status,
            nextStatus: input.status,
            linkedUserId: student.userId,
        },
        metadata: input.metadata,
    });

    return { student, changed: true };
}

/**
 * 퇴원 확정: 연결된 학생 User를 GUEST+WITHDRAWN, 수강을 CANCELLED, 학부모 링크를 종료한다.
 * 유예 검사는 하지 않는다 — 호출부(`finalizeExpiredWithdrawalsForUser`)가 이미 날짜를 봤다.
 *
 * 학부모는 남은 활성 링크가 0일 때만 WITHDRAWN. 다른 자녀가 재원이면 로그인을 유지한다.
 * 수강을 delete하지 않는 이유: 출석·성적 FK와 청구 이력을 그대로 남긴다.
 */
export async function finalizeStudentWithdrawal(
    tx: Prisma.TransactionClient,
    input: {
        studentId: string;
        actorUserId: string;
        metadata: AuditRequestMetadata;
        now: Date;
    },
) {
    const student = await tx.student.findUnique({
        where: { id: input.studentId },
        select: {
            id: true,
            userId: true,
            status: true,
            withdrawnAt: true,
        },
    });

    if (!student || student.status !== "WITHDRAWN") {
        return { student, finalized: false };
    }

    if (student.userId) {
        await tx.user.updateMany({
            where: {
                id: student.userId,
                role: { in: ["STUDENT", "GUEST"] },
            },
            data: { role: "GUEST", status: "WITHDRAWN" },
        });
    }

    await tx.classEnrollment.updateMany({
        where: {
            studentId: student.id,
            status: "ACTIVE",
            endedAt: null,
        },
        data: {
            status: "CANCELLED",
            endedAt: input.now,
        },
    });

    const activeLinks = await tx.parentStudentLink.findMany({
        where: { studentId: student.id, endedAt: null },
        select: { id: true, parentUserId: true },
    });

    if (activeLinks.length > 0) {
        await tx.parentStudentLink.updateMany({
            where: {
                id: { in: activeLinks.map((link) => link.id) },
                endedAt: null,
            },
            data: {
                endedAt: input.now,
                endedBy: input.actorUserId,
                endReason: "학생 퇴원",
            },
        });

        for (const parentUserId of new Set(
            activeLinks.map((link) => link.parentUserId),
        )) {
            const remainingLinks = await tx.parentStudentLink.count({
                where: { parentUserId, endedAt: null },
            });
            if (remainingLinks === 0) {
                await tx.user.updateMany({
                    where: { id: parentUserId, role: "PARENT" },
                    data: { role: "GUEST", status: "WITHDRAWN" },
                });
            }
        }
    }

    await writeAuditLog(tx, {
        actorUserId: input.actorUserId,
        action: "STUDENT_WITHDRAWAL_FINALIZED",
        targetType: "STUDENT",
        targetId: student.id,
        details: { linkedUserId: student.userId },
        metadata: input.metadata,
    });

    return { student, finalized: true };
}

/**
 * 이 User가 학생으로 묶였거나, 아직 안 끊긴 학부모 링크로 퇴원생을 보고 있으면
 * 유예가 끝난 원생만 확정한다. 로그인 가드가 매 요청 호출하므로 배치 잡을 기다리지 않는다.
 *
 * @returns 하나라도 확정했으면 true. jwt 콜백이 User를 다시 읽어 WITHDRAWN을 반영하게 한다.
 * actor는 로그인 중인 userId — 시스템이 자동 확정해도 "누가 들어와서 트리거됐는지"를 남긴다.
 */
export async function finalizeExpiredWithdrawalsForUser(
    userId: string,
    now = new Date(),
    metadata?: AuditRequestMetadata,
) {
    const [studentProfile, parentWithdrawnLinks] = await Promise.all([
        prisma.student.findFirst({
            where: { userId, status: "WITHDRAWN" },
            select: { id: true, withdrawnAt: true },
        }),
        prisma.parentStudentLink.findMany({
            where: {
                parentUserId: userId,
                endedAt: null,
                student: { status: "WITHDRAWN" },
            },
            select: {
                student: { select: { id: true, withdrawnAt: true } },
            },
        }),
    ]);

    const dueStudentIds = new Set<string>();
    if (
        studentProfile &&
        isPastWithdrawalGrace(studentProfile.withdrawnAt, now)
    ) {
        dueStudentIds.add(studentProfile.id);
    }
    for (const link of parentWithdrawnLinks) {
        if (isPastWithdrawalGrace(link.student.withdrawnAt, now)) {
            dueStudentIds.add(link.student.id);
        }
    }

    if (dueStudentIds.size === 0) return false;

    const auditMetadata = metadata ?? {
        ipAddress: null,
        userAgent: null,
    };

    await prisma.$transaction(async (tx) => {
        for (const studentId of dueStudentIds) {
            await finalizeStudentWithdrawal(tx, {
                studentId,
                actorUserId: userId,
                metadata: auditMetadata,
                now,
            });
        }
    });

    return true;
}
