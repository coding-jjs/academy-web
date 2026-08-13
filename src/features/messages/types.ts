export type MessageAudience = "ALL" | "STAFF" | "PARENT" | "STUDENT";

export type MessageStatus =
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "SENT"
    | "REJECTED"
    | "CANCELLED";

export type MessageParentOption = {
    userId: string;
    name: string;
};

export type MessageRecipientOption = {
    id: string;
    name: string;
    parents?: MessageParentOption[];
};

export type MessageTargetFilter = {
    studentIds?: string[];
    parentUserIds?: string[];
    /** 작성 시 전체 선택으로 보낸 경우 */
    broadcast?: boolean;
};

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
