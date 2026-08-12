import "server-only";

import type { Prisma } from "@/generate/prisma/client";
import { prisma } from "@/lib/db";
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
    author: { select: { name: true } },
    sender: { select: { name: true } },
    _count: { select: { recipients: true } },
} satisfies Prisma.MessageSelect;

type MessageRecord = Prisma.MessageGetPayload<{
    select: typeof messageListSelect;
}>;

function toMessageListItem(message: MessageRecord): MessageListItem {
    return {
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
    };
}

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
                select: { id: true, name: true },
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

    return {
        students,
        classes,
        pending: pendingMessages.map(toMessageListItem),
        mine: sentMessages.map(toMessageListItem),
    };
}

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
            select: { id: true, name: true },
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
        students,
        classes,
        pending: [],
        mine: staffMessages.map(toMessageListItem),
    };
}
