import { formatKstYearMonthDay } from "@/lib/date-kst";

export function formatGradeDate(isoDate: string) {
    return formatKstYearMonthDay(isoDate);
}

export function formatGradeDelta(delta: number | null) {
    if (delta == null) return "비교 없음";
    if (delta > 0) return `이전 대비 +${delta}`;
    if (delta < 0) return `이전 대비 ${delta}`;
    return "이전과 동일";
}
