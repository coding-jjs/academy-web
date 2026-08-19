/**
 * 이탈 케이스 상태·신호 종류·원장 목록 행·임계값 모델이다.
 *
 * 호출: `data.ts` / `actions.ts` / `(director)/director/churn`.
 * 감지(`lib/churn-detect`)·화면·액션이 같은 코드값을 쓰게 한다.
 *
 * 신호 4종: 출석 하락, 성적 하락, 연속 결석, 미납 일수.
 * 목록 스캔 대상은 재원(`ENROLLED`) 학생이다.
 *
 * 의도적으로 하지 않는 일:
 * - 감지 알고리즘 자체 → `@/lib/churn-detect`.
 * - 상태 전이 라벨 → `presentation.ts`.
 *
 * 관련: `actions.ts`, `data.ts`.
 */

/** 케어 워크플로. DETECTED→COUNSELING→IMPROVED. WITHDRAWN은 감지/수동 퇴원. */
export type ChurnCaseStatus = // advance는 DETECTED→COUNSELING→IMPROVED만.
    | "DETECTED" // 열린 이탈. 원장 홈 openChurn에 포함.
    | "COUNSELING" // 상담 중. openChurn에 포함.
    | "IMPROVED" // 쪽지 가능. 열린 이탈이 아님.
    | "WITHDRAWN"; // advance 경로에 없음. 쪽지만.

/**
 * 감지기가 쌓는 신호 4종.
 * ATTENDANCE_DROP / SCORE_DROP / CONSECUTIVE_ABSENCE / UNPAID_DAYS.
 */
export type ChurnSignalType = // 4신호. ENROLLED 재원생만 스캔.
    | "ATTENDANCE_DROP" // 출석 하락 %p.
    | "SCORE_DROP" // 성적 하락 점수.
    | "CONSECUTIVE_ABSENCE" // 연속 결석 횟수.
    | "UNPAID_DAYS"; // 미납 일수.

/** 원장 명단 한 행. 케이스 없는 재원생도 넣고 status=null, reason="이탈 신호 없음". */
export type DirectorChurnCase = { // ENROLLED 전원. 케이스 없어도 행을 남긴다.
    id: string; // Student PK. 케이스 없어도 행을 남긴다.
    churnCaseId: string | null; // 없으면 다음 버튼이 "—".
    studentId: string; // Student PK. id와 같다.
    studentName: string; // User.name.
    schoolName: string | null; // 온보딩 학교.
    grade: string | null; // 1~12.
    className: string | null; // 활성 반.
    teacherName: string | null; // 반 담당.
    reason: string; // 없으면 "이탈 신호 없음".
    status: ChurnCaseStatus | null; // null이면 열린 케이스 없음.
    detectedAt: string | null; // 최초 감지 시각.
};

/** id=1 설정 행. 없으면 data가 기본값(15%p, 10점, 2회, 3일)을 쓴다. */
export type ChurnThreshold = { // 감지기 임계. 알고리즘은 lib/churn-detect.
    attendanceDropPercentPoint: number; // 0~100.
    scoreDropPoints: number; // 점수 하락 폭.
    consecutiveAbsences: number; // 1~30.
    unpaidDays: number; // 1~90.
};
