"use server";

/**
 * 원장이 승인 대기 리포트를 학부모 Message(SENT)로 발송하거나 반려한다.
 *
 * 호출: `(director)/director/reports/DirectorReportsScreen`.
 * 승인: Message.status=SENT + AiReport.status=SENT 를 한 트랜잭션으로 맞춘다.
 * 반려: Message를 만들지 않고 REJECTED로 되돌린다. 교사가 다시 DRAFTING할 수 있다.
 *
 * 의도적으로 하지 않는 일:
 * - 초안 작성·AI 재생성 → `staff-actions.ts`.
 * - FAILED 재시도·직접 학부모 알림톡은 하지 않는다.
 *
 * 관련: `expandParentRecipients`, `writeAuditLog`.
 */

import { revalidatePath } from "next/cache";
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { expandParentRecipients } from "@/features/messages/recipients";

type ActionResult =
    | { ok: true; message?: string }
    | { ok: false; message: string };

/** 원장 세션만. 교사·직원은 승인 큐를 돌리지 못한다. */
async function requireDirector() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "DIRECTOR") {
        return null;
    }
    return session;
}

/**
 * PENDING_APPROVAL 리포트를 학부모 받은편지에 SENT 메시지로 넣고 리포트도 SENT로 잠근다.
 * 연결된 학부모가 없으면 발송하지 않아, 승인만 되고 수신자가 없는 상태를 막는다.
 */
export async function approveAndSendReport(input: {
    reportId: string;
}): Promise<ActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    const reportId = String(input.reportId ?? "").trim();
    if (!reportId) {
        return { ok: false, message: "리포트 ID가 없습니다." };
    }

    try {
        const report = await prisma.aiReport.findUnique({
            where: { id: reportId },
            select: {
                id: true,
                status: true,
                content: true,
                studentId: true,
                authorUserId: true,
                student: { select: { name: true } },
            },
        });

        if (!report) {
            return { ok: false, message: "리포트를 찾을 수 없습니다." };
        }

        if (report.status !== "PENDING_APPROVAL") {
            return {
                ok: false,
                message: "승인 대기 상태의 리포트만 발송할 수 있습니다.",
            };
        }

        if (!report.content.trim()) {
            return {
                ok: false,
                message: "본문이 비어 있어 발송할 수 없습니다.",
            };
        }

        const parents = await prisma.parentStudentLink.findMany({
            where: {
                studentId: report.studentId,
                endedAt: null,
            },
            select: { parentUserId: true },
        });

        if (parents.length === 0) {
            return {
                ok: false,
                message:
                    "연결된 학부모가 없어 발송할 수 없습니다. 학부모 연결 후 다시 시도하세요.",
            };
        }

        const parentIds = parents.map((p) => p.parentUserId);
        const recipientIds = await expandParentRecipients(
            parentIds,
            session.user.id,
        );

        if (recipientIds.length === 0) {
            return {
                ok: false,
                message: "연결된 학부모가 없어 발송할 수 없습니다.",
            };
        }

        const now = new Date();
        const metadata = await getAuditRequestMetadata();
        const title = `${report.student.name} 학습 리포트`;
        const authorUserId = report.authorUserId || session.user.id;

        await prisma.$transaction(async (tx) => {
            const fresh = await tx.aiReport.findUnique({
                where: { id: report.id },
                select: { status: true },
            });
            if (!fresh || fresh.status !== "PENDING_APPROVAL") {
                throw new Error(
                    "승인 대기 상태의 리포트만 발송할 수 있습니다.",
                );
            }

            await tx.message.create({
                data: {
                    title,
                    content: report.content,
                    deepLink: "/parent/reports",
                    status: "SENT",
                    audience: "PARENT",
                    approvedAt: now,
                    sentAt: now,
                    sender: { connect: { id: authorUserId } },
                    author: { connect: { id: authorUserId } },
                    approver: { connect: { id: session.user.id } },
                    report: { connect: { id: report.id } },
                    recipients: {
                        create: recipientIds.map((recipientUserId) => ({
                            recipient: { connect: { id: recipientUserId } },
                        })),
                    },
                },
            });

            const updated = await tx.aiReport.updateMany({
                where: { id: report.id, status: "PENDING_APPROVAL" },
                data: {
                    status: "SENT",
                    approverUserId: session.user.id,
                    approvedAt: now,
                    sentAt: now,
                    rejectionReason: null,
                },
            });

            if (updated.count !== 1) {
                throw new Error("이미 다른 요청에서 처리된 리포트입니다.");
            }

            await writeAuditLog(tx, {
                actorUserId: session.user.id,
                action: "REPORT_APPROVED",
                targetType: "AI_REPORT",
                targetId: report.id,
                details: { recipientCount: recipientIds.length },
                metadata,
            });
        });
    } catch (error) {
        return {
            ok: false,
            message:
                error instanceof Error
                    ? error.message
                    : "승인·발송에 실패했습니다.",
        };
    }

    revalidatePath("/director/reports");
    revalidatePath("/teacher/reports");
    revalidatePath("/parent/reports");
    revalidatePath("/parent/inbox");
    revalidatePath("/student/inbox");
    revalidatePath("/director/messages");

    return { ok: true, message: "승인·발송 완료" };
}

/**
 * 승인 대기 리포트를 REJECTED로 되돌린다. Message는 만들지 않는다(초안 워크플로 유지).
 * 반려 사유는 교사 편집기에 보여, 수정 후 다시 승인 요청하게 한다.
 */
export async function rejectReport(input: {
    reportId: string;
    rejectionReason: string;
}): Promise<ActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    const reportId = String(input.reportId ?? "").trim();
    const rejectionReason = String(input.rejectionReason ?? "").trim();

    if (!reportId) {
        return { ok: false, message: "리포트 ID가 없습니다." };
    }
    if (!rejectionReason) {
        return { ok: false, message: "반려 사유를 입력해 주세요." };
    }

    const metadata = await getAuditRequestMetadata();
    const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.aiReport.updateMany({
            where: { id: reportId, status: "PENDING_APPROVAL" },
            data: {
                status: "REJECTED",
                rejectionReason,
                approverUserId: session.user.id,
                approvedAt: null,
                sentAt: null,
            },
        });

        if (result.count === 1) {
            await writeAuditLog(tx, {
                actorUserId: session.user.id,
                action: "REPORT_REJECTED",
                targetType: "AI_REPORT",
                targetId: reportId,
                details: { rejectionReason },
                metadata,
            });
        }

        return result.count;
    });

    if (updated !== 1) {
        return {
            ok: false,
            message: "리포트가 없거나 이미 다른 요청에서 처리되었습니다.",
        };
    }

    revalidatePath("/director/reports");
    revalidatePath("/teacher/reports");

    return { ok: true, message: "반려 처리 완료" };
}
