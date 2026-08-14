export type Notice = {
    id: string;
    audience: string;
    title: string;
    date: string;
    body: string;
    imageUrl: string | null;
};

export const NOTICE_PAGE_SIZE = 8;

export const NOTICE_AUDIENCE_LABELS: Record<string, string> = {
    ALL: "전체",
    PARENT: "학부모",
    STUDENT: "학생",
};

export function filterNoticesByTitle(notices: Notice[], query: string) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return notices;
    return notices.filter((notice) =>
        notice.title.toLowerCase().includes(normalized),
    );
}

export function formatNoticeListDate(date: Date | string) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(typeof date === "string" ? new Date(date) : date);

    const month = parts.find((part) => part.type === "month")?.value ?? "01";
    const day = parts.find((part) => part.type === "day")?.value ?? "01";
    return `${month}.${day}`;
}
