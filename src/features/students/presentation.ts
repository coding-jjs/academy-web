import type { StudentStatus } from "@/features/students/types";
import { formatKstMonthDay } from "@/lib/date-kst";

export const STUDENT_STATUS_METADATA: Record<
    StudentStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    ENROLLED: { label: "재원", tone: "success" },
    PAUSED: { label: "휴원", tone: "warning" },
    WITHDRAWN: { label: "퇴원", tone: "neutral" },
};

export const LEARNING_RECORD_TYPE_LABELS: Record<string, string> = {
    CLASS_NOTE: "수업 기록",
    HOMEWORK: "숙제",
    LIFE_RECORD: "생활 기록",
};

export function formatStudentSchool(
    schoolName: string | null,
    grade: string | null,
    emptyLabel = "미입력",
) {
    if (!schoolName && !grade) return emptyLabel;
    if (!schoolName) return `${grade}학년`;
    if (!grade) return schoolName;
    return `${schoolName} · ${grade}학년`;
}

export function formatStudentOptionLabel(student: {
    name: string;
    schoolName: string | null;
    grade: string | null;
}) {
    const school = formatStudentSchool(student.schoolName, student.grade, "");
    return `${student.name}${school ? ` · ${school}` : ""}`;
}

export function formatStudentRecordDate(isoDate: string) {
    return formatKstMonthDay(isoDate);
}

export function formatEnrollmentChangeDate(isoDate: string) {
    return new Date(isoDate).toLocaleDateString("ko-KR", {
        month: "numeric",
        day: "numeric",
    });
}

export function getTodayDateInput() {
    const today = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");

    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}
