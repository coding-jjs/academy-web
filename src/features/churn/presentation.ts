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

import type { // 코드값만. 감지 식은 lib/churn-detect.
    ChurnCaseStatus, // PENDING_REVIEW 포함.
    ChurnSignalType, // 신호 4종.
} from "@/features/churn/types"; // ENROLLED 스캔 대상과 같은 코드.

/** 신호 4종 한글. 감지 요약 문장과 테이블 reason에 같이 쓴다. */
export const CHURN_SIGNAL_LABELS: Record<ChurnSignalType, string> = { // 계산식이 아니라 라벨.
    ATTENDANCE_DROP: "출석 하락", // 출석 %p 하락.
    SCORE_DROP: "성적 하락", // 점수 하락.
    CONSECUTIVE_ABSENCE: "연속 결석", // 연속 결석 횟수.
    UNPAID_DAYS: "미납", // 미납 일수.
};

/** 케이스 상태 칩. */
export const CHURN_STATUS_METADATA: Record< // 화면 칩. DB 전이는 actions.
    ChurnCaseStatus, // WITHDRAWN·PENDING_REVIEW 포함.
    { label: string; tone: "neutral" | "success" | "warning" | "danger" } // StatusChip.
> = { // 원장 테이블·교사 케어 패널.
    DETECTED: { label: "위험 감지", tone: "danger" }, // 아직 미배정.
    COUNSELING: { label: "상담 중", tone: "warning" }, // 담당자 상담.
    PENDING_REVIEW: { label: "검토 대기", tone: "warning" }, // 원장 확정 대기.
    IMPROVED: { label: "개선", tone: "success" }, // 원장이 확정.
    WITHDRAWN: { label: "퇴원", tone: "neutral" }, // lifecycle이 닫음.
};
