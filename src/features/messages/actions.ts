"use server";

import { revalidatePath } from "next/cache";
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/permission-guard";
import { getStaffScope } from "@/lib/staff-scope";
import {
    resolveRecipientUserIds,
    type MessageAudience as Audience,
} from "@/features/messages/recipients";
import type {
    MessageAudience,
} from "@/generate/prisma/client";

export type MessageActionResult =
    | { ok: true; message?: string; messageId?: string; recipientCount?: number }
    | { ok: false; message: string };

function revalidateMessagePaths() {
    revalidatePath("/director/messages");
    revalidatePath("/staff/messages");
    revalidatePath("/parent/inbox");
    revalidatePath("/parent/student-inbox");
    revalidatePath("/student/inbox");
    revalidatePath("/parent/dashboard");
    revalidatePath("/student/dashboard");
}

async function requireDirector() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "DIRECTOR") return null;
    return session;
}

async function requireStaffWithSendPermission() {
    const session = await auth();
    if (
        !session?.user?.id ||
        (session.user.role !== "TEACHER" && session.user.role !== "STAFF")
    ) {
        return null;
    }
    const allowed = await userHasPermission(session.user.id, "sendMessage");
    if (!allowed) return null;
    return session;
}

/** 원장 즉시 발송 */
export async function directorSendMessage(input: {
    title: string;
    content: string;
    audience: Audience;
    targetStudentId?: string;
    targetClassId?: string;
}): Promise<MessageActionResult> {
    const session = await requireDirector();
    if (!session) return { ok: false, message: "원장 권한이 필요합니다." };

    const title = String(input.title ?? "").trim();
    const content = String(input.content ?? "").trim();
    const audience = input.audience;
    if (!title) return { ok: false, message: "제목을 입력해 주세요." };
    if (!content) return { ok: false, message: "본문을 입력해 주세요." };
    if (!["ALL", "STAFF", "PARENT", "STUDENT"].includes(audience)) {
        return { ok: false, message: "수신 대상이 올바르지 않습니다." };
    }

    const targetStudentId = input.targetStudentId?.trim() || null;
    const targetClassId = input.targetClassId?.trim() || null;

    const resolved = await resolveRecipientUserIds({
        actorUserId: session.user.id,
        audience,
        targetStudentId,
        targetClassId,
        scope: null,
    });
    if (!resolved.ok) return resolved;
    if (resolved.userIds.length === 0) {
        return { ok: false, message: "수신 대상이 없습니다." };
    }

    const now = new Date();
    const metadata = await getAuditRequestMetadata();
    const created = await prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
            data: {
                senderUserId: session.user.id,
                authorUserId: session.user.id,
                title,
                content,
                deepLink: null,
                status: "SENT",
                audience: audience as MessageAudience,
                targetStudentId,
                targetClassId,
                sentAt: now,
                approvedAt: now,
                approverUserId: session.user.id,
                recipients: {
                    create: resolved.userIds.map((recipientUserId) => ({
                        recipientUserId,
                    })),
                },
            },
            select: { id: true },
        });

        await writeAuditLog(tx, {
            actorUserId: session.user.id,
            action: "MESSAGE_SENT",
            targetType: "MESSAGE",
            targetId: message.id,
            details: {
                audience,
                recipientCount: resolved.userIds.length,
            },
            metadata,
        });

        return message;
    });

    revalidateMessagePaths();
    return {
        ok: true,
        message: `${resolved.userIds.length}명에게 발송했습니다.`,
        messageId: created.id,
        recipientCount: resolved.userIds.length,
    };
}

/** 직원 승인 요청 */
export async function submitMessageForApproval(input: {
    title: string;
    content: string;
    audience: "PARENT" | "STUDENT";
    targetStudentId?: string;
    targetClassId?: string;
}): Promise<MessageActionResult> {
    const session = await requireStaffWithSendPermission();
    if (!session) {
        return {
            ok: false,
            message: "쪽지 발송 권한이 없습니다. 원장에게 권한 부여를 요청하세요.",
        };
    }

    const title = String(input.title ?? "").trim();
    const content = String(input.content ?? "").trim();
    const audience = input.audience;
    if (!title) return { ok: false, message: "제목을 입력해 주세요." };
    if (!content) return { ok: false, message: "본문을 입력해 주세요." };
    if (audience !== "PARENT" && audience !== "STUDENT") {
        return { ok: false, message: "수신 대상이 올바르지 않습니다." };
    }

    const targetStudentId = input.targetStudentId?.trim() || null;
    const targetClassId = input.targetClassId?.trim() || null;
    if (!targetStudentId && !targetClassId) {
        return { ok: false, message: "학생 또는 반을 선택해 주세요." };
    }

    const scope = await getStaffScope(session.user.id);
    const resolved = await resolveRecipientUserIds({
        actorUserId: session.user.id,
        audience,
        targetStudentId,
        targetClassId,
        scope,
    });
    if (!resolved.ok) return resolved;
    if (resolved.userIds.length === 0) {
        return { ok: false, message: "수신 대상이 없습니다." };
    }

    const now = new Date();
    const created = await prisma.message.create({
        data: {
            senderUserId: session.user.id,
            authorUserId: session.user.id,
            title,
            content,
            deepLink: null,
            status: "PENDING_APPROVAL",
            audience: audience as MessageAudience,
            targetStudentId,
            targetClassId,
            submittedAt: now,
            // recipients는 승인 시에만 생성
        },
        select: { id: true },
    });

    revalidateMessagePaths();
    return {
        ok: true,
        message: `승인 요청했습니다. (예상 수신 ${resolved.userIds.length}명)`,
        messageId: created.id,
        recipientCount: resolved.userIds.length,
    };
}

/** 원장 승인 → 발송 */
export async function approveMessage(input: {
    messageId: string;
}): Promise<MessageActionResult> {
    const session = await requireDirector();
    if (!session) return { ok: false, message: "원장 권한이 필요합니다." };

    const messageId = String(input.messageId ?? "").trim();
    if (!messageId) return { ok: false, message: "쪽지 ID가 없습니다." };

    const row = await prisma.message.findUnique({
        where: { id: messageId },
        select: {
            id: true,
            status: true,
            title: true,
            content: true,
            audience: true,
            targetStudentId: true,
            targetClassId: true,
            authorUserId: true,
            senderUserId: true,
        },
    });

    if (!row) return { ok: false, message: "쪽지를 찾을 수 없습니다." };
    if (row.status !== "PENDING_APPROVAL") {
        return { ok: false, message: "승인 대기 상태만 처리할 수 있습니다." };
    }
    if (!row.audience || (row.audience !== "PARENT" && row.audience !== "STUDENT")) {
        return { ok: false, message: "수신 대상 정보가 올바르지 않습니다." };
    }

    const authorId = row.authorUserId ?? row.senderUserId;
    if (!authorId) {
        return { ok: false, message: "작성자 정보가 없습니다." };
    }

    // 승인 시에도 작성자 scope로 재검증
    const scope = await getStaffScope(authorId);
    const resolved = await resolveRecipientUserIds({
        actorUserId: authorId,
        audience: row.audience,
        targetStudentId: row.targetStudentId,
        targetClassId: row.targetClassId,
        scope,
    });
    if (!resolved.ok) return resolved;
    if (resolved.userIds.length === 0) {
        return { ok: false, message: "수신 대상이 없습니다." };
    }

    const now = new Date();
    const metadata = await getAuditRequestMetadata();
    await prisma.$transaction(async (tx) => {
        await tx.messageRecipient.createMany({
            data: resolved.userIds.map((recipientUserId) => ({
                messageId: row.id,
                recipientUserId,
            })),
            skipDuplicates: true,
        });

        const updated = await tx.message.updateMany({
            where: { id: row.id, status: "PENDING_APPROVAL" },
            data: {
                status: "SENT",
                approverUserId: session.user.id,
                approvedAt: now,
                sentAt: now,
                rejectionReason: null,
                // 수신함 보낸사람 = 작성자 유지
                senderUserId: authorId,
            },
        });

        if (updated.count !== 1) {
            throw new Error("이미 다른 요청에서 처리된 쪽지입니다.");
        }

        await writeAuditLog(tx, {
            actorUserId: session.user.id,
            action: "MESSAGE_APPROVED",
            targetType: "MESSAGE",
            targetId: row.id,
            details: { recipientCount: resolved.userIds.length },
            metadata,
        });
    });

    revalidateMessagePaths();
    return {
        ok: true,
        message: `승인·발송 완료 (${resolved.userIds.length}명)`,
        recipientCount: resolved.userIds.length,
    };
}

export async function rejectMessage(input: {
    messageId: string;
    rejectionReason: string;
}): Promise<MessageActionResult> {
    const session = await requireDirector();
    if (!session) return { ok: false, message: "원장 권한이 필요합니다." };

    const messageId = String(input.messageId ?? "").trim();
    const rejectionReason = String(input.rejectionReason ?? "").trim();
    if (!messageId) return { ok: false, message: "쪽지 ID가 없습니다." };
    if (!rejectionReason) {
        return { ok: false, message: "반려 사유를 입력해 주세요." };
    }

    const metadata = await getAuditRequestMetadata();
    const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.message.updateMany({
            where: { id: messageId, status: "PENDING_APPROVAL" },
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
                action: "MESSAGE_REJECTED",
                targetType: "MESSAGE",
                targetId: messageId,
                details: { rejectionReason },
                metadata,
            });
        }

        return result.count;
    });

    if (updated !== 1) {
        return {
            ok: false,
            message: "쪽지가 없거나 이미 다른 요청에서 처리되었습니다.",
        };
    }

    revalidateMessagePaths();
    return { ok: true, message: "반려 처리했습니다." };
}
