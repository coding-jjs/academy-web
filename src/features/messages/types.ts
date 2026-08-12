export type MessageAudience = "ALL" | "STAFF" | "PARENT" | "STUDENT";

export type MessageStatus =
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "SENT"
    | "REJECTED"
    | "CANCELLED";

export type MessageRecipientOption = {
    id: string;
    name: string;
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
};
