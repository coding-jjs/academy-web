/**
 * 이탈 신호·상태 라벨을 UI용으로 둔다.
 *
 * 호출: `ChurnCaseTable`, `lib/churn-detect`(신호 한글 요약).
 * 상태 전이는 `actions.ts`에 있고, 여기는 표시만 담당한다.
 *
 * 의도적으로 하지 않는 일:
 * - DETECTED→COUNSELING 등 DB 업데이트.
 * - 신호 4종의 계산식 → `@/lib/churn-detect`.
 * - 다음 버튼 문구. 원장 테이블이 상태별로 버튼을 직접 그린다.
 *
 * 관련: `types.ts`.
 */

import type {
    ChurnCaseStatus,
    ChurnSignalType,
} from "@/features/churn/types";

/** 신호 4종 한글. 감지 요약 문장과 테이블 reason에 같이 쓴다. */
export const CHURN_SIGNAL_LABELS: Record<ChurnSignalType, string> = {
    ATTENDANCE_DROP: "출석 하락",
    SCORE_DROP: "성적 하락",
    CONSECUTIVE_ABSENCE: "연속 결석",
    UNPAID_DAYS: "미납",
};

/** 케이스 상태 칩. */
export const CHURN_STATUS_METADATA: Record<
    ChurnCaseStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    DETECTED: { label: "위험 감지", tone: "danger" },
    COUNSELING: { label: "상담 중", tone: "warning" },
    PENDING_REVIEW: { label: "검토 대기", tone: "warning" },
    IMPROVED: { label: "개선", tone: "success" },
    WITHDRAWN: { label: "퇴원", tone: "neutral" },
};
