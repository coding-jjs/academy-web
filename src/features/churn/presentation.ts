import type {
    ChurnCaseStatus,
    ChurnSignalType,
} from "@/features/churn/types";

export const CHURN_SIGNAL_LABELS: Record<ChurnSignalType, string> = {
    ATTENDANCE_DROP: "출석 하락",
    SCORE_DROP: "성적 하락",
    CONSECUTIVE_ABSENCE: "연속 결석",
    UNPAID_DAYS: "미납",
};

export const CHURN_STATUS_METADATA: Record<
    ChurnCaseStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    DETECTED: { label: "위험 감지", tone: "danger" },
    COUNSELING: { label: "상담 중", tone: "warning" },
    IMPROVED: { label: "개선", tone: "success" },
    WITHDRAWN: { label: "퇴원", tone: "neutral" },
};

export function getChurnActionLabel(status: ChurnCaseStatus | null) {
    if (status === "DETECTED") return "상담 시작";
    if (status === "COUNSELING") return "개선 처리";
    if (status === "IMPROVED" || status === "WITHDRAWN") return "쪽지";
    return "—";
}
