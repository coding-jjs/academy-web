import type { MessageAudience, MessageStatus } from "@/features/messages/types";

export const MESSAGE_AUDIENCE_LABELS: Record<MessageAudience, string> = {
    ALL: "전체 사용자",
    STAFF: "직원(선생님·사무)",
    PARENT: "학부모",
    STUDENT: "학생",
};

export const MESSAGE_STATUS_METADATA: Record<
    MessageStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    PENDING_APPROVAL: { label: "승인 대기", tone: "warning" },
    SENT: { label: "발송됨", tone: "success" },
    REJECTED: { label: "반려", tone: "danger" },
    DRAFT: { label: "임시", tone: "neutral" },
    CANCELLED: { label: "취소", tone: "neutral" },
};
