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

export type ParentInboxMessage = InboxMessage & {
    hasReport: boolean;
};

export type ParentInboxData = {
    messages: ParentInboxMessage[];
    unreadCount: number;
};

export type StudentInboxData = {
    messages: InboxMessage[];
    unreadCount: number;
};
