import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import MessagesScreen from "@/features/messages/MessagesScreen";
import type { MessageListItem } from "@/lib/message-actions";

export const dynamic = "force-dynamic";

function mapRow(row: {
    id: string;
    title: string;
    content: string;
    status: MessageListItem["status"];
    audience: MessageListItem["audience"];
    rejectionReason: string | null;
    createdAt: Date;
    submittedAt: Date | null;
    sentAt: Date | null;
    author: { name: string | null } | null;
    sender: { name: string | null } | null;
    _count: { recipients: number };
}): MessageListItem {
    return {
        id: row.id,
        title: row.title,
        content: row.content,
        status: row.status,
        audience: row.audience,
        authorName: row.author?.name ?? row.sender?.name ?? "학원",
        rejectionReason: row.rejectionReason,
        createdAt: row.createdAt.toISOString(),
        submittedAt: row.submittedAt?.toISOString() ?? null,
        sentAt: row.sentAt?.toISOString() ?? null,
        recipientCount: row._count.recipients,
    };
}

export default async function DirectorMessagesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "DIRECTOR") redirect("/post-login");

    const [students, classes, pendingRaw, sentRaw] = await Promise.all([
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
            select: {
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
            },
        }),
        prisma.message.findMany({
            where: { status: "SENT" },
            orderBy: { sentAt: "desc" },
            take: 50,
            select: {
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
            },
        }),
    ]);

    return (
        <MessagesScreen
            mode="director"
            canCompose
            students={students}
            classes={classes}
            pending={pendingRaw.map(mapRow)}
            mine={sentRaw.map(mapRow)}
        />
    );
}