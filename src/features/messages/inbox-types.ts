/**
 * 학부모·학생 인박스 DTO.
 *
 * 호출: ParentInboxScreen, StudentInboxScreen, inbox-data.ts.
 * 학부모 쪽지만 hasReport를 두어 리포트 연결 쪽지를 구분한다.
 *
 * 의도적으로 하지 않는 일:
 * - 작성/승인 목록 DTO → `types.ts`.
 * - 읽음 처리 → `inbox-actions.ts`가 recipientId로만 갱신한다.
 *
 * 관련: `inbox-data.ts`, `inbox-presentation.ts`.
 */

/** 인박스 한 통. recipientId는 읽음 처리 키이며 messageId와 다르다. */
export type InboxMessage = {
    recipientId: string;
    messageId: string;
    title: string;
    content: string;
    deepLink: string | null;
    createdAt: string;
    readAt: string | null;
    senderName: string;
    senderRole: string | null;
};

/** 학부모 인박스. hasReport면 리포트 화면으로 이어진다. */
export type ParentInboxMessage = InboxMessage & {
    hasReport: boolean;
};

/** 학부모 인박스 묶음. 링크 없는 학부모는 messages가 빈 배열이다. */
export type ParentInboxData = {
    messages: ParentInboxMessage[];
    unreadCount: number;
};

/** 학생 인박스. deepLink는 /student/만 살아 있다. */
export type StudentInboxData = {
    messages: InboxMessage[];
    unreadCount: number;
};
