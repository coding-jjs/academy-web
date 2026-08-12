import type { AttendanceStatus } from "@/features/attendance/types";
import { formatKstTime } from "@/lib/date-kst";

export const ATTENDANCE_STATUS_METADATA: Record<
    AttendanceStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    PRESENT: { label: "출석", tone: "success" },
    LATE: { label: "지각", tone: "warning" },
    ABSENT: { label: "결석", tone: "danger" },
    EXCUSED: { label: "공결", tone: "neutral" },
    EARLY_LEAVE: { label: "조퇴", tone: "warning" },
};

export const ATTENDANCE_STATUS_OPTIONS = Object.entries(
    ATTENDANCE_STATUS_METADATA,
).map(([value, metadata]) => ({
    value: value as AttendanceStatus,
    label: metadata.label,
}));

export function formatAttendanceCheckInTime(isoDate: string | null) {
    return isoDate ? formatKstTime(isoDate) : null;
}
