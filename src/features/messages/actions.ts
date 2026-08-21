"use server";

/**
 * 쪽지 즉시 발송·승인 요청·승인·반려.
 *
 * 호출: `MessageComposer`가 원장 즉시 발송 / 직원 승인 요청을,
 * `MessageListPanel`이 승인·일괄 승인·반려를 호출한다.
 *
 * 원장은 SENT로 바로 넣고 수신 행을 만든다.
 * 직원 요청은 PENDING_APPROVAL만 만들고, 원장 승인 후에야 SENT·수신 행이 생긴다.
 * 미승인 방송이 학부모/학생 인박스에 나가지 않게 하기 위함이다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모/학생 읽음 처리 → `inbox-actions.ts`.
 * - 수신 User id 계산 → `recipients.ts`.
 *
 * 관련: `recipients.ts`, `target-filter.ts`, `data.ts`.
 */

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
import type { MessageTargetFilter } from "@/features/messages/types";
import { parseTargetFilter } from "@/features/messages/target-filter";
import {
    Prisma,
    type MessageAudience,
} from "@/generate/prisma/client";

/** 쪽지 저장 결과. 성공해도 redirect하지 않고 화면이 메시지를 띄운다. */
export type MessageActionResult =
    | { ok: true; message?: string; messageId?: string; recipientCount?: number }
    | { ok: false; message: string };

function revalidateMessagePaths() {
    revalidatePath("/director/messages");
    revalidatePath("/teacher/messages");
    revalidatePath("/employee/messages");
    revalidatePath("/parent/inbox");
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

/**
 * 원장이 학부모 또는 학생에게 즉시 발송한다.
 * status=SENT, sentAt/approvedAt를 지금으로 두고 수신 행을 같이 만든다.
 * 직원 승인 큐(`submitMessageForApproval`)와 달리 대기 상태를 거치지 않는다.
 */
export async function directorSendMessage(input: {
    title: string;
    content: string;
    audience: "PARENT" | "STUDENT" | Audience;
    targetStudentId?: string;
    targetClassId?: string;
    targetStudentIds?: string[];
    targetParentUserIds?: string[];
    broadcast?: boolean;
}): Promise<MessageActionResult> {
    const session = await requireDirector();
    if (!session) return { ok: false, message: "원장 권한이 필요합니다." };

    const title = String(input.title ?? "").trim();
    const content = String(input.content ?? "").trim();
    const audience = input.audience;
    if (!title) return { ok: false, message: "제목을 입력해 주세요." };
    if (!content) return { ok: false, message: "본문을 입력해 주세요." };
    if (audience !== "PARENT" && audience !== "STUDENT") {
        return { ok: false, message: "수신 대상이 올바르지 않습니다." };
    }

    const targetStudentIds = [
        ...new Set(
            (input.targetStudentIds ?? [])
                .map((id) => String(id ?? "").trim())
                .filter(Boolean),
        ),
    ];
    const targetParentUserIds = [
        ...new Set(
            (input.targetParentUserIds ?? [])
                .map((id) => String(id ?? "").trim())
                .filter(Boolean),
        ),
    ];
    const targetStudentId = input.targetStudentId?.trim() || null;
    const targetClassId = input.targetClassId?.trim() || null;

    if (
        audience === "STUDENT" &&
        targetStudentIds.length === 0 &&
        !targetStudentId &&
        !targetClassId
    ) {
        return { ok: false, message: "학생을 선택해 주세요." };
    }
    if (
        audience === "PARENT" &&
        targetParentUserIds.length === 0 &&
        !targetStudentId &&
        !targetClassId
    ) {
        return { ok: false, message: "학부모를 선택해 주세요." };
    }

    const resolved = await resolveRecipientUserIds({
        actorUserId: session.user.id,
        audience,
        targetStudentId,
        targetClassId,
        targetStudentIds:
            audience === "STUDENT" && targetStudentIds.length > 0
                ? targetStudentIds
                : null,
        targetParentUserIds:
            audience === "PARENT" && targetParentUserIds.length > 0
                ? targetParentUserIds
                : null,
        scope: null,
    });
    if (!resolved.ok) return resolved;
    if (resolved.userIds.length === 0) {
        return { ok: false, message: "수신 대상이 없습니다." };
    }

    const targetFilter: MessageTargetFilter | null =
        audience === "STUDENT" && targetStudentIds.length > 0
            ? {
                  studentIds: targetStudentIds,
                  ...(input.broadcast ? { broadcast: true } : {}),
              }
            : audience === "PARENT" && targetParentUserIds.length > 0
              ? {
                    parentUserIds: targetParentUserIds,
                    ...(input.broadcast ? { broadcast: true } : {}),
                }
              : null;

    const representativeStudentId =
        targetStudentIds[0] ?? targetStudentId ?? null;
    const now = new Date();
    const metadata = await getAuditRequestMetadata();
    const created = await prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
            data: {
                title,
                content,
                deepLink: null,
                status: "SENT",
                audience: audience as MessageAudience,
                sentAt: now,
                approvedAt: now,
                targetFilter:
                    targetFilter === null
                        ? Prisma.JsonNull
                        : (targetFilter as Prisma.InputJsonValue),
                sender: { connect: { id: session.user.id } },
                author: { connect: { id: session.user.id } },
                approver: { connect: { id: session.user.id } },
                ...(representativeStudentId
                    ? {
                          targetStudent: {
                              connect: { id: representativeStudentId },
                          },
                      }
                    : {}),
                ...(targetClassId
                    ? {
                          targetClass: {
                              connect: { id: targetClassId },
                          },
                      }
                    : {}),
                recipients: {
                    create: resolved.userIds.map((recipientUserId) => ({
                        recipient: { connect: { id: recipientUserId } },
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

/**
 * 직원이 원장 승인 큐에 올린다.
 * PENDING_APPROVAL만 만들고 수신 행은 만들지 않는다 — 승인 전에 인박스에 뜨면 안 된다.
 * 수신자 수는 미리 계산해 "예상 수신 N명" 안내에만 쓴다.
 */
export async function submitMessageForApproval(input: {
    title: string;
    content: string;
    audience: "PARENT" | "STUDENT";
    targetStudentId?: string;
    targetClassId?: string;
    targetStudentIds?: string[];
    targetParentUserIds?: string[];
    broadcast?: boolean;
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

    const targetStudentIds = [
        ...new Set(
            (input.targetStudentIds ?? [])
                .map((id) => String(id ?? "").trim())
                .filter(Boolean),
        ),
    ];
    const targetParentUserIds = [
        ...new Set(
            (input.targetParentUserIds ?? [])
                .map((id) => String(id ?? "").trim())
                .filter(Boolean),
        ),
    ];
    const targetStudentId = input.targetStudentId?.trim() || null;
    const targetClassId = input.targetClassId?.trim() || null;

    if (audience === "STUDENT" && targetStudentIds.length === 0 && !targetStudentId && !targetClassId) {
        return { ok: false, message: "학생을 선택해 주세요." };
    }
    if (audience === "PARENT" && targetParentUserIds.length === 0 && !targetStudentId && !targetClassId) {
        return { ok: false, message: "학부모를 선택해 주세요." };
    }

    const scope = await getStaffScope(session.user.id);
    const resolved = await resolveRecipientUserIds({
        actorUserId: session.user.id,
        audience,
        targetStudentId,
        targetClassId,
        targetStudentIds:
            audience === "STUDENT" && targetStudentIds.length > 0
                ? targetStudentIds
                : null,
        targetParentUserIds:
            audience === "PARENT" && targetParentUserIds.length > 0
                ? targetParentUserIds
                : null,
        scope,
    });
    if (!resolved.ok) return resolved;
    if (resolved.userIds.length === 0) {
        return { ok: false, message: "수신 대상이 없습니다." };
    }

    const targetFilter: MessageTargetFilter | null =
        audience === "STUDENT" && targetStudentIds.length > 0
            ? {
                  studentIds: targetStudentIds,
                  ...(input.broadcast ? { broadcast: true } : {}),
              }
            : audience === "PARENT" && targetParentUserIds.length > 0
              ? {
                    parentUserIds: targetParentUserIds,
                    ...(input.broadcast ? { broadcast: true } : {}),
                }
              : null;

    const now = new Date();
    const representativeStudentId =
        targetStudentIds[0] ?? targetStudentId ?? null;
    const created = await prisma.message.create({
        data: {
            title,
            content,
            deepLink: null,
            status: "PENDING_APPROVAL",
            audience: audience as MessageAudience,
            submittedAt: now,
            targetFilter:
                targetFilter === null
                    ? Prisma.JsonNull
                    : (targetFilter as Prisma.InputJsonValue),
            sender: { connect: { id: session.user.id } },
            author: { connect: { id: session.user.id } },
            ...(representativeStudentId
                ? {
                      targetStudent: {
                          connect: { id: representativeStudentId },
                      },
                  }
                : {}),
            ...(targetClassId
                ? {
                      targetClass: {
                          connect: { id: targetClassId },
                      },
                  }
                : {}),
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

/**
 * 원장이 대기 쪽지 한 건을 승인·발송한다. 실제 전환은 `approveMessageCore`.
 */
export async function approveMessage(input: {
    messageId: string;
}): Promise<MessageActionResult> {
    const session = await requireDirector();
    if (!session) return { ok: false, message: "원장 권한이 필요합니다." };
    const result = await approveMessageCore(session.user.id, input.messageId);
    if (result.ok) revalidateMessagePaths();
    return result;
}

/**
 * 원장이 고른 대기 쪽지를 순서대로 승인한다.
 * 일부만 실패해도 성공 건은 발송된 채로 두고, 메시지를 합쳐 돌려준다.
 */
export async function approveMessages(input: {
    messageIds: string[];
}): Promise<MessageActionResult> {
    const session = await requireDirector();
    if (!session) return { ok: false, message: "원장 권한이 필요합니다." };

    const messageIds = [
        ...new Set(
            (input.messageIds ?? [])
                .map((id) => String(id ?? "").trim())
                .filter(Boolean),
        ),
    ];
    if (messageIds.length === 0) {
        return { ok: false, message: "승인할 쪽지를 선택해 주세요." };
    }

    let successCount = 0;
    let failureCount = 0;
    const failureMessages: string[] = [];

    for (const messageId of messageIds) {
        const result = await approveMessageCore(session.user.id, messageId);
        if (result.ok) {
            successCount += 1;
        } else {
            failureCount += 1;
            if (result.message) {
                failureMessages.push(result.message);
            }
        }
    }

    if (successCount > 0) revalidateMessagePaths();

    if (failureCount === 0) {
        return {
            ok: true,
            message: `${successCount}건 승인·발송 완료`,
        };
    }

    if (successCount === 0) {
        return {
            ok: false,
            message:
                failureMessages[0] ??
                "선택한 쪽지를 승인·발송하지 못했습니다.",
        };
    }

    return {
        ok: true,
        message: `${successCount}건 승인·발송 완료, ${failureCount}건 실패`,
    };
}

async function approveMessageCore(
    approverUserId: string,
    messageIdInput: string,
): Promise<MessageActionResult> {
    const messageId = String(messageIdInput ?? "").trim();
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
            targetFilter: true,
            authorUserId: true,
            senderUserId: true,
        },
    });

    if (!row) return { ok: false, message: "쪽지를 찾을 수 없습니다." };
    if (row.status !== "PENDING_APPROVAL") {
        return { ok: false, message: "승인 대기 상태만 처리할 수 있습니다." };
    }
    if (
        !row.audience ||
        (row.audience !== "PARENT" && row.audience !== "STUDENT")
    ) {
        return { ok: false, message: "수신 대상 정보가 올바르지 않습니다." };
    }

    const authorId = row.authorUserId ?? row.senderUserId;
    if (!authorId) {
        return { ok: false, message: "작성자 정보가 없습니다." };
    }

    const targetFilter = parseTargetFilter(row.targetFilter);

    const scope = await getStaffScope(authorId);
    const resolved = await resolveRecipientUserIds({
        actorUserId: authorId,
        audience: row.audience,
        targetStudentId: row.targetStudentId,
        targetClassId: row.targetClassId,
        targetStudentIds: targetFilter?.studentIds ?? null,
        targetParentUserIds: targetFilter?.parentUserIds ?? null,
        scope,
    });
    if (!resolved.ok) return resolved;
    if (resolved.userIds.length === 0) {
        return { ok: false, message: "수신 대상이 없습니다." };
    }

    const now = new Date();
    const metadata = await getAuditRequestMetadata();
    try {
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
                    approverUserId: approverUserId,
                    approvedAt: now,
                    sentAt: now,
                    rejectionReason: null,
                    senderUserId: authorId,
                },
            });

            if (updated.count !== 1) {
                throw new Error("이미 다른 요청에서 처리된 쪽지입니다.");
            }

            await writeAuditLog(tx, {
                actorUserId: approverUserId,
                action: "MESSAGE_APPROVED",
                targetType: "MESSAGE",
                targetId: row.id,
                details: { recipientCount: resolved.userIds.length },
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

    return {
        ok: true,
        message: `승인·발송 완료 (${resolved.userIds.length}명)`,
        recipientCount: resolved.userIds.length,
    };
}

/**
 * 원장이 대기 쪽지를 반려한다. 수신 행은 만들지 않은 채 REJECTED만 남긴다.
 */
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
