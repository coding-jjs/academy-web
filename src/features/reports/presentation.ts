import type { ReportStatus } from "@/features/reports/types";

export const REPORT_STATUS_METADATA: Record<
    ReportStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    UNWRITTEN: { label: "미작성", tone: "neutral" },
    DRAFTING: { label: "작성 중", tone: "neutral" },
    PENDING_APPROVAL: { label: "승인 대기", tone: "warning" },
    REJECTED: { label: "반려", tone: "danger" },
    SENT: { label: "발송됨", tone: "success" },
    FAILED: { label: "실패", tone: "danger" },
};

export const REPORT_KEYWORD_OPTIONS = [
    "수업 태도 · 과제 · 이해도",
    "참여도 · 질문 · 복습",
    "성실도 · 집중력 · 성장",
];

export const REPORT_TONE_OPTIONS = ["격려·칭찬", "전문적", "단호"];

export function getDefaultReportPeriod() {
    const now = new Date();
    const periodStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const periodEnd = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
    );

    return {
        periodStart: periodStart.toISOString().slice(0, 10),
        periodEnd: periodEnd.toISOString().slice(0, 10),
    };
}

export function getStudentReportStatus(
    student: { report: { status: ReportStatus } | null },
): ReportStatus {
    return student.report?.status ?? "UNWRITTEN";
}
