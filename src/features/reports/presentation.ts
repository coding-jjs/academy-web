/**
 * 리포트 상태 라벨·톤, 키워드/톤 선택지, 기본 기간을 UI에 맞게 정리한다.
 *
 * 호출: 교사 `ReportEditor`·`StaffReportsScreen`, 원장 `DirectorReportsScreen`·테이블.
 * 도메인 전이가 아니라 화면 표시용 상수와 헬퍼만 둔다.
 *
 * 의도적으로 하지 않는 일:
 * - 상태 변경 → `staff-actions` / `director-actions`.
 * - 기간을 KST 달력으로 계산하지 않는다 → UTC 월초·월말로 ISO 날짜만 만든다.
 *
 * 관련: `types.ts`의 `ReportStatus`.
 */

import type { ReportStatus } from "@/features/reports/types";

/** 상태 → 한글 라벨·칩 톤. 교사·원장 화면이 같은 맵을 쓴다. */
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

/** 초안 생성 시 관찰 포인트 프리셋. 자유 입력이 아니라 선택지다. */
export const REPORT_KEYWORD_OPTIONS = [
    "수업 태도 · 과제 · 이해도",
    "참여도 · 질문 · 복습",
    "성실도 · 집중력 · 성장",
];

/** AI/템플릿 초안의 문체. `draft-generator`가 "단호"·"전문적"을 분기한다. */
export const REPORT_TONE_OPTIONS = ["격려·칭찬", "전문적", "단호"];

/**
 * 이번 달(UTC) 1일~말일을 YYYY-MM-DD로 돌려 편집기 기본 기간에 넣는다.
 * 서버 액션은 이 문자열을 `T00:00:00.000Z`로 파싱한다.
 */
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

/**
 * 학생 행에 그릴 대표 상태.
 * 잠긴 제출이 승인 대기면 그걸 우선해, 초안이 있어도 큐에 보이게 한다.
 */
export function getStudentReportStatus(
    student: {
        report: { status: ReportStatus } | null;
        submittedReport?: { status: ReportStatus } | null;
    },
): ReportStatus {
    if (student.submittedReport?.status === "PENDING_APPROVAL") {
        return "PENDING_APPROVAL";
    }
    if (student.report) {
        return student.report.status;
    }
    if (student.submittedReport) {
        return student.submittedReport.status;
    }
    return "UNWRITTEN";
}
