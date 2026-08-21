import "server-only";

/**
 * 원장 승인 큐·직원 작성 목록과 수신 대상 옵션을 조회한다.
 *
 * 호출: `/director/messages`, `/teacher/messages`, `/employee/messages`.
 * 원장은 대기/발송을 보고, 직원은 본인 작성분만 본다(pending은 비움).
 * 직원 화면이 타 직원 승인 큐를 열지 않게 하기 위함이다.
 *
 * 의도적으로 하지 않는 일:
 * - 발송 → `actions.ts`.
 * - 인박스 조회 → `inbox-data.ts`.
 *
 * 관련: `target-filter.ts`, `types.ts`.
 */

import type { Prisma } from "@/generate/prisma/client";
import { prisma } from "@/lib/db";
import { MESSAGE_AUDIENCE_LABELS } from "@/features/messages/presentation";
import {
    formatTargetNames,
    parseTargetFilter,
} from "@/features/messages/target-filter";
import type {
    MessageListItem,
    MessageRecipientOption,
} from "@/features/messages/types";

const messageListSelect = {
    id: true,
    title: true,
    content: true,
    status: true,
    audience: true,
    rejectionReason: true,
    createdAt: true,
    submittedAt: true,
    sentAt: true,
    targetFilter: true,
    targetStudentId: true,
    targetClassId: true,
    author: { select: { name: true } },
    sender: { select: { name: true } },
    targetStudent: { select: { name: true } },
    targetClass: { select: { name: true } },
    _count: { select: { recipients: true } },
} satisfies Prisma.MessageSelect;

type MessageRecord = Prisma.MessageGetPayload<{
    select: typeof messageListSelect;
}>;

async function buildTargetSummaries(
    messages: MessageRecord[],
): Promise<Map<string, string>> {
    const summaries = new Map<string, string>();
    const studentIds = new Set<string>();
    const parentIds = new Set<string>();

    for (const message of messages) {
        const filter = parseTargetFilter(message.targetFilter);
        if (filter?.broadcast) {
            summaries.set(message.id, "전체 발송");
            continue;
        }
        for (const id of filter?.studentIds ?? []) studentIds.add(id);
        for (const id of filter?.parentUserIds ?? []) parentIds.add(id);
        if (
            !filter?.studentIds?.length &&
            message.targetStudentId &&
            message.audience === "STUDENT"
        ) {
            studentIds.add(message.targetStudentId);
        }
    }

    const [students, parents] = await Promise.all([
        studentIds.size === 0
            ? Promise.resolve([])
            : prisma.student.findMany({
                  where: { id: { in: [...studentIds] } },
                  select: { id: true, name: true },
              }),
        parentIds.size === 0
            ? Promise.resolve([])
            : prisma.user.findMany({
                  where: { id: { in: [...parentIds] } },
                  select: { id: true, name: true },
              }),
    ]);

    const studentNameById = new Map(
        students.map((student) => [student.id, student.name]),
    );
    const parentNameById = new Map(
        parents.map((parent) => [parent.id, parent.name]),
    );

    for (const message of messages) {
        if (summaries.has(message.id)) continue;

        const filter = parseTargetFilter(message.targetFilter);

        if (filter?.studentIds?.length) {
            summaries.set(
                message.id,
                formatTargetNames(
                    filter.studentIds
                        .map((id) => studentNameById.get(id))
                        .filter((name): name is string => Boolean(name)),
                ),
            );
            continue;
        }

        if (filter?.parentUserIds?.length) {
            summaries.set(
                message.id,
                formatTargetNames(
                    filter.parentUserIds
                        .map((id) => parentNameById.get(id))
                        .filter((name): name is string => Boolean(name)),
                ),
            );
            continue;
        }

        if (message.targetClass?.name) {
            summaries.set(message.id, `${message.targetClass.name} 반`);
            continue;
        }

        if (message.targetStudent?.name) {
            summaries.set(message.id, message.targetStudent.name);
            continue;
        }

        summaries.set(
            message.id,
            message.audience
                ? MESSAGE_AUDIENCE_LABELS[message.audience]
                : "대상 미지정",
        );
    }

    return summaries;
}

async function toMessageListItems(
    messages: MessageRecord[],
): Promise<MessageListItem[]> {
    const summaries = await buildTargetSummaries(messages);

    return messages.map((message) => ({
        id: message.id,
        title: message.title,
        content: message.content,
        status: message.status,
        audience: message.audience,
        authorName: message.author?.name ?? message.sender?.name ?? "학원",
        rejectionReason: message.rejectionReason,
        createdAt: message.createdAt.toISOString(),
        submittedAt: message.submittedAt?.toISOString() ?? null,
        sentAt: message.sentAt?.toISOString() ?? null,
        recipientCount: message._count.recipients,
        targetSummary: summaries.get(message.id) ?? "대상 미지정",
    }));
}

/**
 * 원장 화면: 재원생·활성 반 옵션, 승인 대기, 최근 발송.
 * 학부모 옵션은 ACTIVE 링크만 — 끊긴 보호자는 작곡기에 안 나온다.
 */
export async function getDirectorMessagesData(): Promise<{
    students: MessageRecipientOption[];
    classes: MessageRecipientOption[];
    pending: MessageListItem[];
    mine: MessageListItem[];
}> {
    const [students, classes, pendingMessages, sentMessages] =
        await Promise.all([
            prisma.student.findMany({
                where: { status: "ENROLLED" },
                orderBy: { name: "asc" },
                select: {
                    id: true,
                    name: true,
                    parentLinks: {
                        where: { endedAt: null },
                        select: {
                            parent: {
                                select: {
                                    id: true,
                                    name: true,
                                    status: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.class.findMany({
                where: { active: true },
                orderBy: { name: "asc" },
                select: { id: true, name: true },
            }),
            prisma.message.findMany({
                where: { status: "PENDING_APPROVAL" },
                orderBy: { submittedAt: "desc" },
                take: 50,
                select: messageListSelect,
            }),
            prisma.message.findMany({
                where: { status: "SENT" },
                orderBy: { sentAt: "desc" },
                take: 50,
                select: messageListSelect,
            }),
        ]);

    const [pending, mine] = await Promise.all([
        toMessageListItems(pendingMessages),
        toMessageListItems(sentMessages),
    ]);

    return {
        students: students.map((student) => ({
            id: student.id,
            name: student.name,
            parents: student.parentLinks
                .filter((link) => link.parent.status === "ACTIVE")
                .map((link) => ({
                    userId: link.parent.id,
                    name: link.parent.name,
                })),
        })),
        classes,
        pending,
        mine,
    };
}

/**
 * 직원 화면: 스코프 where로 학생·반을 제한하고, 본인 작성 쪽지만 mine에 넣는다.
 * pending은 항상 []. 승인 큐는 원장 전용이다.
 */
export async function getStaffMessagesData({
    staffUserId,
    studentWhere,
    classWhere,
}: {
    staffUserId: string;
    studentWhere: Prisma.StudentWhereInput;
    classWhere: Prisma.ClassWhereInput;
}): Promise<{
    students: MessageRecipientOption[];
    classes: MessageRecipientOption[];
    pending: MessageListItem[];
    mine: MessageListItem[];
}> {
    const [students, classes, staffMessages] = await Promise.all([
        prisma.student.findMany({
            where: studentWhere,
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                parentLinks: {
                    where: { endedAt: null },
                    select: {
                        parent: {
                            select: {
                                id: true,
                                name: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.class.findMany({
            where: classWhere,
            orderBy: { name: "asc" },
            select: { id: true, name: true },
        }),
        prisma.message.findMany({
            where: {
                authorUserId: staffUserId,
                status: { in: ["PENDING_APPROVAL", "SENT", "REJECTED"] },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
            select: messageListSelect,
        }),
    ]);

    return {
        students: students.map((student) => ({
            id: student.id,
            name: student.name,
            parents: student.parentLinks
                .filter((link) => link.parent.status === "ACTIVE")
                .map((link) => ({
                    userId: link.parent.id,
                    name: link.parent.name,
                })),
        })),
        classes,
        pending: [],
        mine: await toMessageListItems(staffMessages),
    };
}
