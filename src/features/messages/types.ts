/**
 * 원장·직원 쪽지 작성/목록 DTO와 targetFilter 형태.
 *
 * 호출: MessagesScreen, MessageComposer, MessageListPanel, data.ts.
 * broadcast는 작성 시 전체 선택 여부를 남겨 목록 요약을 '전체 발송'으로 보여 준다.
 *
 * 의도적으로 하지 않는 일:
 * - 인박스 DTO → `inbox-types.ts`.
 * - 수신 User id 해석 → `recipients.ts`.
 *
 * 관련: `target-filter.ts`, `presentation.ts`.
 */

/** 발송 대상 구분. 직원은 PARENT/STUDENT만 요청할 수 있다. */
export type MessageAudience = "ALL" | "STAFF" | "PARENT" | "STUDENT";

/** 처리 단계. 직원 요청은 PENDING_APPROVAL, 원장 즉시 발송은 SENT. */
export type MessageStatus =
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "SENT"
    | "REJECTED"
    | "CANCELLED";

/** 작곡기 학부모 체크 항목. userId는 학생 id가 아니다. */
export type MessageParentOption = {
    userId: string;
    name: string;
};

/** 작곡기 학생 행. parents는 연결된 학부모 User만. */
export type MessageRecipientOption = {
    id: string;
    name: string;
    parents?: MessageParentOption[];
};

/**
 * 승인 시 수신자를 다시 펼치기 위한 Json.
 * broadcast=true면 목록에 "전체 발송"으로 표시한다.
 */
export type MessageTargetFilter = {
    studentIds?: string[];
    parentUserIds?: string[];
    /** 작성 시 전체 선택으로 보낸 경우 */
    broadcast?: boolean;
};

/** 원장 승인 큐·직원 내 요청 목록 행. */
export type MessageListItem = {
    id: string;
    title: string;
    content: string;
    status: MessageStatus;
    audience: MessageAudience | null;
    authorName: string;
    rejectionReason: string | null;
    createdAt: string;
    submittedAt: string | null;
    sentAt: string | null;
    recipientCount: number;
    /** 승인/목록용 대상 요약 ("전체 발송" 또는 이름 목록) */
    targetSummary: string;
};
