import { formatKstMonthDay } from "@/lib/date-kst";

export function formatInboxDateTime(isoDate: string) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(isoDate));
}

export function formatInboxDate(isoDate: string) {
    return formatKstMonthDay(isoDate);
}

export function getMessageSenderRoleLabel(role: string | null) {
    if (role === "DIRECTOR") return "원장";
    if (role === "TEACHER") return "선생님";
    if (role === "STAFF") return "사무";
    return "학원";
}
