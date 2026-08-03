"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/permission-guard";
import {
    classScopeWhere,
    getStaffScope,
    studentScopeWhere,
    type StaffScope,
} from "@/lib/staff-scope";
import type { MessageAudience, MessageStatus } from "@prisma/client";

export type MessageActionResult =
    | { ok: true; message?: string; messageId?: string; recipientCount?: number }
    | { ok: false; message: string };

type Audience = "ALL" | "STAFF" | "PARENT" | "STUDENT";

function revalidateMessagePaths() {
    revalidatePath("/director/messages");
    revalidatePath("/staff/messages");
    revalidatePath("/parent/inbox");
    revalidatePath("/parent/student-inbox");
    revalidatePath("/student/inbox");
    revalidatePath("/parent/dashboard");
    revalidatePath("/student/dashboard");
}

/** 학부모 userId → (학부모 + 연결 학생 계정) 수신자, 발신자 제외·중복 제거 */
export async function expandParentRecipients(
    parentUserIds: string[],
    excludeUserId: string,
): Promise<string[]> {
    const uniqueParents = [...new Set(parentUserIds)].filter(
        (id) => id && id !== excludeUserId,
    );
    if (uniqueParents.length === 0) return [];

    const links = await prisma.parentStudentLink.findMany({
        where: {
            parentUserId: { in: uniqueParents },
            endedAt: null,
        },
        select: {
            parentUserId: true,
            student: { select: { userId: true } },
        },
    });

    const ids = new Set<string>(uniqueParents);
    for (const link of links) {
        const studentUserId = link.student.userId;
        if (studentUserId && studentUserId !== excludeUserId) {
            ids.add(studentUserId);
        }
    }
    return [...ids];
}

async function assertStudentInScope(
    studentId: string,
    scope: StaffScope | null,
): Promise<boolean> {
    const row = await prisma.student.findFirst({
        where: {
            id: studentId,
            ...(scope ? studentScopeWhere(scope) : {}),
        },
        select: { id: true },
    });
    return Boolean(row);
}

async function assertClassInScope(
    classId: string,
    scope: StaffScope | null,
): Promise<boolean> {
    const row = await prisma.class.findFirst({
        where: {
            id: classId,
            active: true,
            ...(scope ? classScopeWhere(scope) : {}),
        },
        select: { id: true },
    });
    return Boolean(row);
}

async function studentIdsForClass(classId: string): Promise<string[]> {
    const rows = await prisma.classEnrollment.findMany({
        where: {
            classId,
            status: "ACTIVE",
            endedAt: null,
        },
        select: { studentId: true },
    });
    return rows.map((r) => r.studentId);
}

export async function resolveRecipientUserIds(input: {
    actorUserId: string;
    audience: Audience;
    targetStudentId?: string | null;
    targetClassId?: string | null;
    /** null = 원장(전체 범위) */
    scope: StaffScope | null;
}): Promise<{ ok: true; userIds: string[] } | { ok: false; message: string }> {
    const {
        actorUserId,
        audience,
        targetStudentId,
        targetClassId,
        scope,
    } = input;

    const isStaffScoped = scope !== null;

    if (isStaffScoped && (audience === "ALL" || audience === "STAFF")) {
        return {
            ok: false,
            message: "직원은 학부모·학생 대상만 요청할 수 있습니다.",
        };
    }

    if (isStaffScoped && !targetStudentId && !targetClassId) {
        return {
            ok: false,
            message: "학생 또는 반을 선택해 주세요.",
        };
    }

    if (targetStudentId) {
        const ok = await assertStudentInScope(targetStudentId, scope);
        if (!ok) {
            return { ok: false, message: "대상 학생에 접근할 수 없습니다." };
        }
    }
    if (targetClassId) {
        const ok = await assertClassInScope(targetClassId, scope);
        if (!ok) {
            return { ok: false, message: "대상 반에 접근할 수 없습니다." };
        }
    }

    let studentIds: string[] = [];
    if (targetStudentId) studentIds = [targetStudentId];
    if (targetClassId) {
        studentIds = await studentIdsForClass(targetClassId);
    }

    if (audience === "ALL") {
        const users = await prisma.user.findMany({
            where: {
                role: {
                    in: ["DIRECTOR", "STAFF", "TEACHER", "PARENT", "STUDENT"],
                },
                status: "ACTIVE",
            },
            select: { id: true },
        });
        return {
            ok: true,
            userIds: users.map((u) => u.id).filter((id) => id !== actorUserId),
        };
    }

    if (audience === "STAFF") {
        const users = await prisma.user.findMany({
            where: {
                role: { in: ["STAFF", "TEACHER"] },
                status: "ACTIVE",
            },
            select: { id: true },
        });
        return {
            ok: true,
            userIds: users.map((u) => u.id).filter((id) => id !== actorUserId),
        };
    }

    if (audience === "STUDENT") {
        if (studentIds.length > 0) {
            const students = await prisma.student.findMany({
                where: { id: { in: studentIds }, userId: { not: null } },
                select: { userId: true },
            });
            const ids = students
                .map((s) => s.userId!)
                .filter((id) => id !== actorUserId);
            return { ok: true, userIds: [...new Set(ids)] };
        }

        // 원장: 전체 학생 계정
        const users = await prisma.user.findMany({
            where: { role: "STUDENT", status: "ACTIVE" },
            select: { id: true },
        });
        return {
            ok: true,
            userIds: users.map((u) => u.id).filter((id) => id !== actorUserId),
        };
    }

    // PARENT
    let parentIds: string[] = [];
    if (studentIds.length > 0) {
        const links = await prisma.parentStudentLink.findMany({
            where: {
                studentId: { in: studentIds },
                endedAt: null,
            },
            select: { parentUserId: true },
        });
        parentIds = links.map((l) => l.parentUserId);
    } else {
        const users = await prisma.user.findMany({
            where: { role: "PARENT", status: "ACTIVE" },
            select: { id: true },
        });
        parentIds = users.map((u) => u.id);
    }

    const userIds = await expandParentRecipients(parentIds, actorUserId);
    return { ok: true, userIds };
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
    const created = await prisma.message.create({
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
    await prisma.$transaction(async (tx) => {
        await tx.messageRecipient.createMany({
            data: resolved.userIds.map((recipientUserId) => ({
                messageId: row.id,
                recipientUserId,
            })),
            skipDuplicates: true,
        });

        await tx.message.update({
            where: { id: row.id },
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

    const row = await prisma.message.findUnique({
        where: { id: messageId },
        select: { id: true, status: true },
    });
    if (!row) return { ok: false, message: "쪽지를 찾을 수 없습니다." };
    if (row.status !== "PENDING_APPROVAL") {
        return { ok: false, message: "승인 대기 상태만 반려할 수 있습니다." };
    }

    await prisma.message.update({
        where: { id: row.id },
        data: {
            status: "REJECTED",
            rejectionReason,
            approverUserId: session.user.id,
            approvedAt: null,
            sentAt: null,
        },
    });

    revalidateMessagePaths();
    return { ok: true, message: "반려 처리했습니다." };
}

export type MessageListItem = {
    id: string;
    title: string;
    content: string;
    status: MessageStatus;
    audience: MessageAudience | null;
    authorName: string;
    rejectionReason: string | null;
    createdAt: string;
    submittedAt: string | null;
    sentAt: string | null;
    recipientCount: number;
};