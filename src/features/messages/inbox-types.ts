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
export type InboxMessage = { // 수신 행. PENDING_APPROVAL은 수신 행이 없어 여기 없다.
    recipientId: string; // MessageRecipient id. 읽음 처리 키. messageId로 갱신하지 않는다.
    messageId: string; // Message 행. PENDING_APPROVAL은 수신 행이 없어 여기에 안 나온다.
    title: string; // 쪽지 제목.
    content: string; // 본문. 인박스에서 지우지 않고 읽음 시각만 찍는다.
    deepLink: string | null; // 학생은 /student/만 살린다. 학부모 결제·리포트 경로를 막는다.
    createdAt: string; // ISO. 화면은 KST.
    readAt: string | null; // 없으면 미읽음. unreadCount에 들어간다.
    senderName: string; // 없으면 "A학원".
    senderRole: string | null; // 인박스 역할 라벨. 작성 화면 상태 칩이 아니다.
};

/** 학부모 인박스. hasReport면 리포트 화면으로 이어진다. */
export type ParentInboxMessage = InboxMessage & { // 학부모만 hasReport. 학생 인박스에는 없다.
    hasReport: boolean; // reportId가 있으면 true. 학생 인박스에는 이 필드가 없다.
};

/** 학부모 인박스 묶음. 링크 없는 학부모는 messages가 빈 배열이다. */
export type ParentInboxData = { // 본인 수신만. 끊긴 자녀 쪽지를 채우지 않는다.
    messages: ParentInboxMessage[]; // 본인 수신 행만. 끊긴 자녀 쪽지를 채우지 않는다.
    unreadCount: number; // readAt이 없는 통만.
};

/** 학생 인박스. deepLink는 /student/만 살아 있다. */
export type StudentInboxData = { // /student/가 아닌 링크는 null. 학부모 경로를 막는다.
    messages: InboxMessage[]; // /student/가 아닌 deepLink는 null로 내린다.
    unreadCount: number; // 본인 미읽음만.
};
