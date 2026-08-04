import type { Prisma, StudentStatus } from "@/generate/prisma/client";
import {
    writeAuditLog,
    type AuditRequestMetadata,
} from "@/lib/audit";

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
        if (student.userId) {
            await tx.user.updateMany({
                where: {
                    id: student.userId,
                    role: "STUDENT",
                },
                data: { role: "GUEST" },
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

        await tx.churnCase.updateMany({
            where: {
                studentId: student.id,
                status: { in: ["DETECTED", "COUNSELING"] },
            },
            data: {
                status: "WITHDRAWN",
                resolvedAt: input.now,
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
                        data: { role: "GUEST" },
                    });
                }
            }
        }
    } else if (student.userId) {
        await tx.user.updateMany({
            where: {
                id: student.userId,
                role: "GUEST",
                status: "ACTIVE",
            },
            data: { role: "STUDENT" },
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
