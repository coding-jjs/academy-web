import type { InquiryStatus } from "@/features/counseling/types";
import { formatKstDateTime } from "@/lib/date-kst";

export const INQUIRY_STATUS_METADATA: Record<
    InquiryStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    NEW: { label: "신규", tone: "warning" },
    IN_PROGRESS: { label: "진행중", tone: "neutral" },
    DONE: { label: "완료", tone: "success" },
    SPAM: { label: "스팸", tone: "danger" },
};

export function formatCounselingDateTime(isoDate: string) {
    return formatKstDateTime(isoDate);
}

export function getCurrentLocalDateTimeInput(date = new Date()) {
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
