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

export type StudentNewsItem = {
    id: string;
    title: string;
    content: string | null;
    category: string;
    createdAt: string;
};

export type ParentInboxData = {
    messages: ParentInboxMessage[];
    unreadCount: number;
};

export type StudentInboxData = {
    messages: InboxMessage[];
    news: StudentNewsItem[];
    unreadCount: number;
};

export type ParentStudentInboxChild = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    hasStudentAccount: boolean;
    messages: InboxMessage[];
};

export type ParentStudentInboxData = {
    childList: ParentStudentInboxChild[];
    news: StudentNewsItem[];
};
