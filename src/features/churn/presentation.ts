/**
 * 이탈 신호·상태 라벨과 다음 액션 버튼 문구를 UI용으로 둔다.
 *
 * 호출: `ChurnCaseTable`, `lib/churn-detect`(신호 한글 요약).
 * 상태 전이는 `actions.ts`에 있고, 여기는 표시만 담당한다.
 *
 * 의도적으로 하지 않는 일:
 * - DETECTED→COUNSELING 등 DB 업데이트.
 * - 신호 4종의 계산식 → `@/lib/churn-detect`.
 *
 * 관련: `types.ts`.
 */

import type { // 코드값만. 감지 식은 lib/churn-detect.
    ChurnCaseStatus, // DETECTED→COUNSELING→IMPROVED.
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
    ChurnCaseStatus, // WITHDRAWN 포함.
    { label: string; tone: "neutral" | "success" | "warning" | "danger" } // StatusChip.
> = { // 원장 테이블.
    DETECTED: { label: "위험 감지", tone: "danger" }, // 다음 버튼: 상담 시작.
    COUNSELING: { label: "상담 중", tone: "warning" }, // 다음 버튼: 개선 처리.
    IMPROVED: { label: "개선", tone: "success" }, // 다음 버튼: 학부모 쪽지.
    WITHDRAWN: { label: "퇴원", tone: "neutral" }, // advance 경로에 없음. 쪽지만.
};

/**
 * 다음 버튼 문구.
 * DETECTED→상담 시작, COUNSELING→개선 처리, IMPROVED/WITHDRAWN→쪽지.
 * 케이스 없으면 "—".
 */
export function getChurnActionLabel(status: ChurnCaseStatus | null) { // 버튼 카피만. 전이는 actions.
    if (status === "DETECTED") return "상담 시작"; // advanceChurnCase → COUNSELING.
    if (status === "COUNSELING") return "개선 처리"; // advanceChurnCase → IMPROVED. WITHDRAWN은 이 경로 없음.
    if (status === "IMPROVED" || status === "WITHDRAWN") return "쪽지"; // sendChurnParentNote. Message SENT.
    return "—"; // 케이스 없는 재원생.
}
