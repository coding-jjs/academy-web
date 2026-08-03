import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ParentInboxScreen from "@/app/(parent)/parent/inbox/ParentInboxScreen";
import type { ParentInboxMessage } from "@/app/(parent)/parent/inbox/ParentInboxScreen";

export const dynamic = "force-dynamic";

export default async function ParentInboxPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "PARENT") redirect("/post-login");

    const recipients = await prisma.messageRecipient.findMany({
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
                    reportId: true,
                    sender: {
                        select: {
                            name: true,
                            role: true,
                        },
                    },
                },
            },
        },
    });

    const messages: ParentInboxMessage[] = recipients.map((row) => ({
        recipientId: row.id,
        messageId: row.message.id,
        title: row.message.title,
        content: row.message.content,
        deepLink: row.message.deepLink,
        createdAt: row.message.createdAt.toISOString(),
        readAt: row.readAt?.toISOString() ?? null,
        senderName: row.message.sender?.name ?? "A학원",
        senderRole: row.message.sender?.role ?? null,
        hasReport: Boolean(row.message.reportId),
    }));

    const unreadCount = messages.filter((m) => !m.readAt).length;

    return (
        <ParentInboxScreen messages={messages} unreadCount={unreadCount} />
    );
}