import "server-only"; // 조회만. 읽음 처리는 inbox-actions.ts. 브라우저가 Prisma를 치지 않는다.

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

import { prisma } from "@/lib/db"; // server-only Prisma. 본인 수신 행만.
import type { // 인박스 DTO. 작성/승인 MessageListItem과 나눈다.
    InboxMessage, // recipientId가 읽음 키. messageId와 다르다.
    ParentInboxData, // hasReport. 학생 인박스에는 없다.
    StudentInboxData, // /student/ 링크만. 학부모 경로를 막는다.
} from "@/features/messages/inbox-types"; // 인박스 DTO. types.ts 작성 목록이 아니다.

const messageSelection = { // 수신 행 + 쪽지. PENDING은 수신 행이 없어 안 나온다.
    id: true, // MessageRecipient id = 읽음 처리 키.
    readAt: true, // 없으면 미읽음.
    createdAt: true, // 수신 시각. 목록 정렬.
    message: { // SENT 쪽지만. 직원 PENDING_APPROVAL은 수신 행이 없다.
        select: { // 인박스 카드. 작성 화면 상태 칩이 아니다.
            id: true, // Message 행. 읽음 키가 아니다.
            title: true, // 쪽지 제목.
            content: true, // 본문. 인박스에서 지우지 않는다.
            deepLink: true, // 학생은 /student/만 살린다.
            createdAt: true, // ISO. 화면은 KST.
            reportId: true, // 학부모 hasReport. 학생 인박스에는 이 필드를 안 붙인다.
            sender: { select: { name: true, role: true } }, // 없으면 "A학원".
        },
    },
} as const; // 학부모·학생 공통 select. hasReport는 학부모 map에서만.

/**
 * 학부모 인박스. reportId가 있는 쪽지는 hasReport로 표시한다.
 */
export async function getParentInboxData( // 본인 수신만. 끊긴 자녀 쪽지를 채우지 않는다.
    parentUserId: string, // PARENT User id. 원생 카드 id가 아니다.
): Promise<ParentInboxData> { // hasReport. 학생 인박스 DTO가 아니다.
    const recipients = await getMessageRecipients(parentUserId); // 본인 수신 행만. PENDING_APPROVAL은 수신 행이 없어 안 나온다.
    const messages = recipients.map((row) => ({ // 학부모 카드. 학생 deepLink 필터는 없다.
        ...mapInboxMessage(row), // 공통 인박스 필드.
        hasReport: Boolean(row.message.reportId), // 리포트 연결 쪽지. 학생 인박스에는 이 필드가 없다.
    }));

    return { messages, unreadCount: countUnreadMessages(messages) }; // 본인 미읽음만.
}

/**
 * 학생 인박스. deepLink가 /student/로 시작하지 않으면 링크를 숨긴다.
 * 학부모 결제·리포트 경로가 학생 화면에 열리는 것을 막는다.
 */
export async function getStudentInboxData( // /student/만. 학부모 결제·리포트 경로를 막는다.
    studentUserId: string, // STUDENT User id. 원생 카드 id가 아니다.
): Promise<StudentInboxData> { // hasReport 없음. /student/가 아니면 deepLink=null.
    const recipients = await getMessageRecipients(studentUserId); // 본인 수신만. PENDING은 여기 없다.

    const messages = recipients.map((row) => { // 학생 카드. 학부모 경로를 null로.
        const message = mapInboxMessage(row); // 공통 필드. hasReport는 안 붙인다.
        return { // /student/가 아니면 링크를 숨긴다.
            ...message, // 공통 인박스 필드.
            deepLink: message.deepLink?.startsWith("/student/") // 학부모 결제·리포트 경로가 열리지 않게.
                ? message.deepLink // 학생 업무 경로만.
                : null, // 학부모 결제·리포트 경로가 열리지 않게.
        };
    });

    return { // 본인 미읽음만. hasReport 없음.
        messages, // /student/가 아닌 deepLink는 null.
        unreadCount: countUnreadMessages(messages), // 본인 미읽음만.
    };
}

function getMessageRecipients(recipientUserId: string) { // 본인 수신 행만. 직원 PENDING은 여기 없다.
    return prisma.messageRecipient.findMany({ // SENT 수신만. 작성 목록 data.ts와 나눈다.
        where: { recipientUserId }, // 본인 수신 행만. 직원 PENDING은 여기 없다.
        orderBy: { createdAt: "desc" }, // 최근 수신.
        take: 50, // 인박스 상한.
        select: messageSelection, // 학부모·학생 공통. hasReport는 map에서만.
    });
}

function mapInboxMessage( // 공통 인박스 필드. hasReport·deepLink 필터는 호출부.
    row: Awaited<ReturnType<typeof getMessageRecipients>>[number], // 본인 수신 행.
): InboxMessage { // PENDING은 수신 행이 없어 여기 없다.
    return { // 읽음 키는 recipientId. messageId로 갱신하지 않는다.
        recipientId: row.id, // 읽음 처리 키. messageId와 다르다.
        messageId: row.message.id, // Message 행. 읽음 키가 아니다.
        title: row.message.title, // 쪽지 제목.
        content: row.message.content, // 본문. 인박스에서 지우지 않는다.
        deepLink: row.message.deepLink, // 학생 조회가 /student/만 살린다.
        createdAt: row.message.createdAt.toISOString(), // ISO. 화면은 KST.
        readAt: row.readAt?.toISOString() ?? null, // 없으면 미읽음.
        senderName: row.message.sender?.name ?? "A학원", // 시스템/리포트 자동 쪽지.
        senderRole: row.message.sender?.role ?? null, // 인박스 역할 라벨. 작성 화면 상태 칩이 아니다.
    };
}

function countUnreadMessages(messages: Array<{ readAt: string | null }>) { // 본인 목록 기준. 타 수신자를 세지 않는다.
    return messages.filter((message) => !message.readAt).length; // readAt이 없는 통만.
}
