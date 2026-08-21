export type ChurnCaseStatus =
    | "DETECTED"
    | "COUNSELING"
    | "PENDING_REVIEW"
    | "IMPROVED"
    | "WITHDRAWN";

export const OPEN_CHURN_STATUSES = [
    "DETECTED",
    "COUNSELING",
    "PENDING_REVIEW",
] as const satisfies readonly ChurnCaseStatus[];

export type ChurnSignalType =
    | "ATTENDANCE_DROP"
    | "SCORE_DROP"
    | "CONSECUTIVE_ABSENCE"
    | "UNPAID_DAYS";

export type ChurnAssigneeOption = {
    id: string;
    name: string;
    role: "TEACHER" | "STAFF";
    classNames: string[];
    subjects: string[];
};

export type ChurnCareMemo = {
    content: string;
    authorName: string;
    counseledAt: string;
};

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

export type ChurnThreshold = {
    attendanceDropPercentPoint: number;
    scoreDropPoints: number;
    consecutiveAbsences: number;
    unpaidDays: number;
};

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
