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

import type { ReportStatus } from "@/features/reports/types"; // 상태 코드. 전이는 actions.

/** 상태 → 한글 라벨·칩 톤. 교사·원장 화면이 같은 맵을 쓴다. */
export const REPORT_STATUS_METADATA: Record< // 화면 칩. DB를 바꾸지 않는다.
    ReportStatus, // UNWRITTEN 포함. 가상 상태도 라벨이 필요.
    { label: string; tone: "neutral" | "success" | "warning" | "danger" } // StatusChip tone.
> = { // 교사·원장이 같은 맵.
    UNWRITTEN: { label: "미작성", tone: "neutral" }, // DB 행이 없을 때 화면 가상 상태.
    DRAFTING: { label: "작성 중", tone: "neutral" }, // 교사 편집 가능.
    PENDING_APPROVAL: { label: "승인 대기", tone: "warning" }, // 원장 큐. Message는 아직 없음.
    REJECTED: { label: "반려", tone: "danger" }, // Message 없이 교사 EDITABLE로 되돌림.
    SENT: { label: "발송됨", tone: "success" }, // 원장 승인 + 학부모 받은편지.
    FAILED: { label: "실패", tone: "danger" }, // 발송 실패 표시.
};

/** 초안 생성 시 관찰 포인트 프리셋. 자유 입력이 아니라 선택지다. */
export const REPORT_KEYWORD_OPTIONS = [ // draft-generator 입력. 자유 문자열이 아니다.
    "수업 태도 · 과제 · 이해도", // 프리셋 1.
    "참여도 · 질문 · 복습", // 프리셋 2.
    "성실도 · 집중력 · 성장", // 프리셋 3.
]; // REPORT_KEYWORD_OPTIONS 끝.

/** AI/템플릿 초안의 문체. `draft-generator`가 "단호"·"전문적"을 분기한다. */
export const REPORT_TONE_OPTIONS = ["격려·칭찬", "전문적", "단호"]; // Gemini else는 격려 템플릿.

/**
 * 이번 달(UTC) 1일~말일을 YYYY-MM-DD로 돌려 편집기 기본 기간에 넣는다.
 * 서버 액션은 이 문자열을 `T00:00:00.000Z`로 파싱한다.
 */
export function getDefaultReportPeriod() { // KST 달력이 아니다. UTC 월초·월말.
    const now = new Date(); // 서버/브라우저 지금.
    const periodStart = new Date( // UTC 1일 00:00.
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1), // UTC 월초. KST 달력이 아니다.
    );
    const periodEnd = new Date( // UTC 말일.
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0), // UTC 말일. 서버 액션이 T00:00:00.000Z로 파싱한다.
    );

    return { // YYYY-MM-DD만. Date 객체를 화면에 안 넘긴다.
        periodStart: periodStart.toISOString().slice(0, 10), // YYYY-MM-DD.
        periodEnd: periodEnd.toISOString().slice(0, 10), // YYYY-MM-DD.
    };
}

/**
 * 학생 행에 그릴 대표 상태.
 * 잠긴 제출이 승인 대기면 그걸 우선해, 초안이 있어도 큐에 보이게 한다.
 */
export function getStudentReportStatus( // 배지용. DB를 안 친다.
    student: { // 교사 행에서 초안·잠긴 제출만 본다.
        report: { status: ReportStatus } | null; // 작업 초안.
        submittedReport?: { status: ReportStatus } | null; // 잠긴 최신.
    },
): ReportStatus { // UNWRITTEN 포함.
    if (student.submittedReport?.status === "PENDING_APPROVAL") { // 큐 가시성 우선.
        return "PENDING_APPROVAL"; // 잠긴 제출이 승인 대기면 초안보다 큐 가시성을 우선한다.
    }
    if (student.report) { // 초안이 있으면 그 상태(작성중·반려).
        return student.report.status; // 작업 초안(작성중·반려 등).
    }
    if (student.submittedReport) { // 초안 없고 잠긴 제출만.
        return student.submittedReport.status; // 초안이 없으면 잠긴 제출 상태.
    }
    return "UNWRITTEN"; // 둘 다 없으면 미작성.
}
