import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import StudentInboxScreen from "./StudentInboxScreen";
import type {
    StudentInboxMessage,
    StudentNewsItem,
} from "./StudentInboxScreen";

export const dynamic = "force-dynamic";

export default async function StudentInboxPage() {
    const session = await requireRole("STUDENT");

    const now = new Date();

    const [recipients, newsRows] = await Promise.all([
        prisma.messageRecipient.findMany({
            where: { recipientUserId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 50,
            select: {
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
                        sender: {
                            select: {
                                name: true,
                                role: true,
                            },
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
                AND: [
                    {
                        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
                    },
                ],
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

    const messages: StudentInboxMessage[] = recipients.map((row) => {
        const deepLink = row.message.deepLink;
        const safeDeepLink =
            deepLink && deepLink.startsWith("/student/") ? deepLink : null;

        return {
            recipientId: row.id,
            messageId: row.message.id,
            title: row.message.title,
            content: row.message.content,
            deepLink: safeDeepLink,
            createdAt: row.message.createdAt.toISOString(),
            readAt: row.readAt?.toISOString() ?? null,
            senderName: row.message.sender?.name ?? "A학원",
            senderRole: row.message.sender?.role ?? null,
        };
    });

    const news: StudentNewsItem[] = newsRows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category,
        createdAt: row.createdAt.toISOString(),
    }));

    const unreadCount = messages.filter((m) => !m.readAt).length;

    return (
        <StudentInboxScreen
            messages={messages}
            news={news}
            unreadCount={unreadCount}
        />
    );
}
