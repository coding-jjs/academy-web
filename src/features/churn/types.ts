/**
 * 이탈 케이스 상태·신호 종류·원장 목록 행·임계값 모델이다.
 *
 * 호출: `data.ts` / `actions.ts` / `(director)/director/churn` / 교사 케어 패널.
 * 감지(`lib/churn-detect`)·화면·액션이 같은 코드값을 쓰게 한다.
 *
 * 신호 4종: 출석 하락, 성적 하락, 연속 결석, 미납 일수.
 * 목록 스캔 대상은 재원(`ENROLLED`) 학생이다.
 * 열린 상태: DETECTED → COUNSELING → PENDING_REVIEW. IMPROVED/WITHDRAWN은 닫힘.
 *
 * 의도적으로 하지 않는 일:
 * - 감지 알고리즘 자체 → `@/lib/churn-detect`.
 * - 상태 전이 라벨 → `presentation.ts`.
 *
 * 관련: `actions.ts`, `data.ts`, `teacher-data.ts`.
 */

/** 케어 워크플로. DETECTED→COUNSELING→PENDING_REVIEW→IMPROVED. WITHDRAWN은 감지/수동 퇴원. */
export type ChurnCaseStatus =
    | "DETECTED"
    | "COUNSELING"
    | "PENDING_REVIEW"
    | "IMPROVED"
    | "WITHDRAWN";

/** 대시보드·스캔·퇴원 종결이 같이 보는 열린 상태. */
export const OPEN_CHURN_STATUSES = [
    "DETECTED",
    "COUNSELING",
    "PENDING_REVIEW",
] as const satisfies readonly ChurnCaseStatus[];

/**
 * 감지기가 쌓는 신호 4종.
 * ATTENDANCE_DROP / SCORE_DROP / CONSECUTIVE_ABSENCE / UNPAID_DAYS.
 */
export type ChurnSignalType =
    | "ATTENDANCE_DROP"
    | "SCORE_DROP"
    | "CONSECUTIVE_ABSENCE"
    | "UNPAID_DAYS";

/** 원장이 배정할 담당자 후보. 담당 반 교사·직원. */
export type ChurnAssigneeOption = {
    id: string;
    name: string;
    role: "TEACHER" | "STAFF";
    classNames: string[];
    subjects: string[];
};

/** 담당자 상담 메모 한 줄. 원장 테이블·교사 케어 패널이 같이 본다. */
export type ChurnCareMemo = {
    content: string;
    authorName: string;
    counseledAt: string;
};

/** 원장 명단 한 행. 케이스 없는 재원생도 넣고 status=null, reason="이탈 신호 없음". */
export type DirectorChurnCase = {
    id: string;
    churnCaseId: string | null;
    studentId: string;
    studentName: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    assigneeUserId: string | null;
    suggestedAssigneeUserId: string | null;
    assignees: ChurnAssigneeOption[];
    reason: string;
    status: ChurnCaseStatus | null;
    detectedAt: string | null;
    latestMemo: ChurnCareMemo | null;
};

/** id=1 설정 행. 없으면 data가 기본값(15%p, 10점, 2회, 3일)을 쓴다. */
export type ChurnThreshold = {
    attendanceDropPercentPoint: number;
    scoreDropPoints: number;
    consecutiveAbsences: number;
    unpaidDays: number;
};

/** 교사·직원 상담 화면에 올릴 내게 배정된 케어 한 건. */
export type TeacherChurnCareTask = {
    churnCaseId: string;
    studentId: string;
    studentName: string;
    className: string | null;
    reason: string;
    status: "COUNSELING" | "PENDING_REVIEW";
    detectedAt: string;
    latestMemo: ChurnCareMemo | null;
};
