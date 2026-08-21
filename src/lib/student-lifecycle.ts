import type { Prisma, StudentStatus } from "@/generate/prisma/client";
import {
    writeAuditLog,
    type AuditRequestMetadata,
} from "@/lib/audit";
import { OPEN_CHURN_STATUSES } from "@/features/churn/types";
import { isPastWithdrawalGrace } from "@/lib/date-kst";
import { prisma } from "@/lib/db";

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
