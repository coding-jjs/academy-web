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
export type ChurnCaseStatus = // 원장 확정 전에는 IMPROVED로 바로 가지 않는다.
    | "DETECTED" // 열린 이탈. 원장 홈 openChurn에 포함.
    | "COUNSELING" // 담당자에게 배정된 상담 중. openChurn에 포함.
    | "PENDING_REVIEW" // 담당자가 검토 요청. 원장이 개선 확정/재상담.
    | "IMPROVED" // 원장 확정. 열린 이탈이 아님.
    | "WITHDRAWN"; // advance 경로에 없음. 퇴원 시 lifecycle이 닫음.

/** 대시보드·스캔·퇴원 종결이 같이 보는 열린 상태. */
export const OPEN_CHURN_STATUSES = [ // IMPROVED·WITHDRAWN 제외.
    "DETECTED", // 미배정 감지.
    "COUNSELING", // 상담 중.
    "PENDING_REVIEW", // 원장 검토 대기.
] as const satisfies readonly ChurnCaseStatus[];

/**
 * 감지기가 쌓는 신호 4종.
 * ATTENDANCE_DROP / SCORE_DROP / CONSECUTIVE_ABSENCE / UNPAID_DAYS.
 */
export type ChurnSignalType = // 4신호. ENROLLED 재원생만 스캔.
    | "ATTENDANCE_DROP" // 출석 하락 %p.
    | "SCORE_DROP" // 성적 하락 점수.
    | "CONSECUTIVE_ABSENCE" // 연속 결석 횟수.
    | "UNPAID_DAYS"; // 미납 일수.

/** 원장이 배정할 담당자 후보. 담당 반 교사·직원. */
export type ChurnAssigneeOption = { // assignees.ts가 반 수강에서 만든다.
    id: string; // User PK.
    name: string; // User.name.
    role: "TEACHER" | "STAFF"; // 교사 또는 직원.
    classNames: string[]; // 이 학생과 겹치는 반 이름.
    subjects: string[]; // 그 반 과목.
};

/** 담당자 상담 메모 한 줄. 원장 테이블·교사 케어 패널이 같이 본다. */
export type ChurnCareMemo = {
    content: string; // 메모 본문.
    authorName: string; // 작성자 이름.
    counseledAt: string; // ISO.
};

/** 원장 명단 한 행. 케이스 없는 재원생도 넣고 status=null, reason="이탈 신호 없음". */
export type DirectorChurnCase = { // ENROLLED 전원. 케이스 없어도 행을 남긴다.
    id: string; // Student PK. 케이스 없어도 행을 남긴다.
    churnCaseId: string | null; // 없으면 배정/확정 버튼이 비활성.
    studentId: string; // Student PK. id와 같다.
    studentName: string; // User.name.
    schoolName: string | null; // 온보딩 학교.
    grade: string | null; // 1~12.
    className: string | null; // 활성 반(들).
    teacherName: string | null; // 배정 담당 또는 추천 담당.
    assigneeUserId: string | null; // 현재 배정 User.
    suggestedAssigneeUserId: string | null; // 신호·반 기반 추천.
    assignees: ChurnAssigneeOption[]; // 이 학생 담당 반 후보.
    reason: string; // 없으면 "이탈 신호 없음".
    status: ChurnCaseStatus | null; // null이면 열린 케이스 없음.
    detectedAt: string | null; // 최초 감지 시각.
    latestMemo: ChurnCareMemo | null; // 최근 상담 메모.
};

/** id=1 설정 행. 없으면 data가 기본값(15%p, 10점, 2회, 3일)을 쓴다. */
export type ChurnThreshold = { // 감지기 임계. 알고리즘은 lib/churn-detect.
    attendanceDropPercentPoint: number; // 0~100.
    scoreDropPoints: number; // 점수 하락 폭.
    consecutiveAbsences: number; // 1~30.
    unpaidDays: number; // 1~90.
};

/** 교사·직원 상담 화면에 올릴 내게 배정된 케어 한 건. */
export type TeacherChurnCareTask = { // teacher-data.ts. COUNSELING·PENDING_REVIEW만.
    churnCaseId: string; // ChurnCase PK.
    studentId: string; // Student PK.
    studentName: string; // 학생 이름.
    className: string | null; // 반.
    reason: string; // 신호 요약.
    status: "COUNSELING" | "PENDING_REVIEW"; // 열린 배정 건만.
    detectedAt: string; // ISO.
    latestMemo: ChurnCareMemo | null; // 최근 메모.
};
