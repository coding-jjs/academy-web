import "server-only";

import { prisma } from "@/lib/db";
import type {
    InboxMessage,
    ParentInboxData,
    StudentInboxData,
} from "@/features/messages/inbox-types";

const messageSelection = {
    id: true,
    readAt: true,
    createdAt: true,
    message: {
        select: {
            id: true,
            title: true,
            content: true,
            deepLink: true,
            createdAt: true,
            reportId: true,
            sender: { select: { name: true, role: true } },
        },
    },
} as const;

export async function getParentInboxData(
    parentUserId: string,
): Promise<ParentInboxData> {
    const recipients = await getMessageRecipients(parentUserId);
    const messages = recipients.map((row) => ({
        ...mapInboxMessage(row),
        hasReport: Boolean(row.message.reportId),
    }));

    return { messages, unreadCount: countUnreadMessages(messages) };
}

export async function getStudentInboxData(
    studentUserId: string,
): Promise<StudentInboxData> {
    const recipients = await getMessageRecipients(studentUserId);

    const messages = recipients.map((row) => {
        const message = mapInboxMessage(row);
        return {
            ...message,
            deepLink: message.deepLink?.startsWith("/student/")
                ? message.deepLink
                : null,
        };
    });

    return {
        messages,
        unreadCount: countUnreadMessages(messages),
    };
}

function getMessageRecipients(recipientUserId: string) {
    return prisma.messageRecipient.findMany({
        where: { recipientUserId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: messageSelection,
    });
}

function mapInboxMessage(
    row: Awaited<ReturnType<typeof getMessageRecipients>>[number],
): InboxMessage {
    return {
        recipientId: row.id,
        messageId: row.message.id,
        title: row.message.title,
        content: row.message.content,
        deepLink: row.message.deepLink,
        createdAt: row.message.createdAt.toISOString(),
        readAt: row.readAt?.toISOString() ?? null,
        senderName: row.message.sender?.name ?? "A학원",
        senderRole: row.message.sender?.role ?? null,
    };
}

function countUnreadMessages(messages: Array<{ readAt: string | null }>) {
    return messages.filter((message) => !message.readAt).length;
}
