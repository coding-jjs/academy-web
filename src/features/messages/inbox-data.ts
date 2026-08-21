import "server-only";

/**
 * 학부모·학생 인박스 조회. recipientUserId가 본인인 수신 행만 읽는다.
 *
 * 호출: `/parent/inbox`, `/student/inbox` 페이지.
 * 학생은 /student/ deepLink만 남겨 학부모용 경로가 새지 않게 한다.
 * PENDING_APPROVAL은 수신 행이 없으므로 이 쿼리에 안 나온다.
 *
 * 의도적으로 하지 않는 일:
 * - 읽음 처리 → `inbox-actions.ts`.
 * - 원장/직원 작성 목록 → `data.ts`.
 *
 * 관련: `inbox-types.ts`.
 */

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

/**
 * 학부모 인박스. reportId가 있는 쪽지는 hasReport로 표시한다.
 */
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

/**
 * 학생 인박스. deepLink가 /student/로 시작하지 않으면 링크를 숨긴다.
 * 학부모 결제·리포트 경로가 학생 화면에 열리는 것을 막는다.
 */
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
