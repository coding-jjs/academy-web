import "server-only";

import { prisma } from "@/lib/db";
import type {
    InboxMessage,
    ParentInboxData,
    ParentStudentInboxData,
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
    const now = new Date();
    const [recipients, newsRows] = await Promise.all([
        getMessageRecipients(studentUserId),
        prisma.newsItem.findMany({
            where: {
                published: true,
                audience: { in: ["STUDENT", "ALL"] },
                OR: [{ startsAt: null }, { startsAt: { lte: now } }],
                AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            take: 30,
            select: {
                id: true,
                title: true,
                content: true,
                category: true,
                createdAt: true,
            },
        }),
    ]);

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
        news: newsRows.map((newsItem) => ({
            ...newsItem,
            createdAt: newsItem.createdAt.toISOString(),
        })),
        unreadCount: countUnreadMessages(messages),
    };
}

export async function getParentStudentInboxData(
    parentUserId: string,
): Promise<ParentStudentInboxData> {
    const now = new Date();
    const [links, newsRows] = await Promise.all([
        prisma.parentStudentLink.findMany({
            where: { parentUserId, endedAt: null },
            orderBy: { linkedAt: "asc" },
            select: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        schoolName: true,
                        grade: true,
                        userId: true,
                        enrollments: {
                            where: { status: "ACTIVE", endedAt: null },
                            take: 1,
                            select: { class: { select: { name: true } } },
                        },
                    },
                },
            },
        }),
        prisma.newsItem.findMany({
            where: {
                published: true,
                audience: { in: ["STUDENT", "ALL"] },
                OR: [{ startsAt: null }, { startsAt: { lte: now } }],
                AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            take: 20,
            select: {
                id: true,
                title: true,
                content: true,
                category: true,
                createdAt: true,
            },
        }),
    ]);
    const studentUserIds = links
        .map(({ student }) => student.userId)
        .filter((userId): userId is string => Boolean(userId));
    const recipients =
        studentUserIds.length === 0
            ? []
            : await prisma.messageRecipient.findMany({
                  where: { recipientUserId: { in: studentUserIds } },
                  orderBy: { createdAt: "desc" },
                  select: {
                      id: true,
                      recipientUserId: true,
                      readAt: true,
                      message: {
                          select: {
                              id: true,
                              title: true,
                              content: true,
                              createdAt: true,
                              sender: { select: { name: true, role: true } },
                          },
                      },
                  },
              });
    const recipientsByUser = Map.groupBy(
        recipients,
        (recipient) => recipient.recipientUserId,
    );

    return {
        childList: links.map(({ student }) => ({
            id: student.id,
            name: student.name,
            schoolName: student.schoolName,
            grade: student.grade,
            className: student.enrollments[0]?.class.name ?? null,
            hasStudentAccount: Boolean(student.userId),
            messages: student.userId
                ? (recipientsByUser.get(student.userId) ?? [])
                      .slice(0, 40)
                      .map((recipient) => ({
                          recipientId: recipient.id,
                          messageId: recipient.message.id,
                          title: recipient.message.title,
                          content: recipient.message.content,
                          deepLink: null,
                          createdAt:
                              recipient.message.createdAt.toISOString(),
                          readAt: recipient.readAt?.toISOString() ?? null,
                          senderName:
                              recipient.message.sender?.name ?? "A학원",
                          senderRole:
                              recipient.message.sender?.role ?? null,
                      }))
                : [],
        })),
        news: newsRows.map((newsItem) => ({
            ...newsItem,
            createdAt: newsItem.createdAt.toISOString(),
        })),
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
