import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/permission-guard";
import {
    classScopeWhere,
    getStaffScope,
    studentScopeWhere,
} from "@/lib/staff-scope";
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

export default async function StaffMessagesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "TEACHER" && session.user.role !== "STAFF") {
        redirect("/post-login");
    }

    const canCompose = await userHasPermission(
        session.user.id,
        "sendMessage",
    );

    if (!canCompose) {
        return (
            <MessagesScreen
                mode="staff"
                canCompose={false}
                deniedMessage="쪽지 발송 권한이 없습니다. 원장에게 권한 부여를 요청하세요."
                students={[]}
                classes={[]}
                pending={[]}
                mine={[]}
            />
        );
    }

    const scope = await getStaffScope(session.user.id);

    const [students, classes, mineRaw] = await Promise.all([
        prisma.student.findMany({
            where: {
                status: "ENROLLED",
                ...studentScopeWhere(scope),
            },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
        }),
        prisma.class.findMany({
            where: {
                active: true,
                ...classScopeWhere(scope),
            },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
        }),
        prisma.message.findMany({
            where: {
                authorUserId: session.user.id,
                status: { in: ["PENDING_APPROVAL", "SENT", "REJECTED"] },
            },
            orderBy: { createdAt: "desc" },
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
            mode="staff"
            canCompose
            students={students}
            classes={classes}
            pending={[]}
            mine={mineRaw.map(mapRow)}
        />
    );
}