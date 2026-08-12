export type ChurnCaseStatus =
    | "DETECTED"
    | "COUNSELING"
    | "IMPROVED"
    | "WITHDRAWN";

export type ChurnSignalType =
    | "ATTENDANCE_DROP"
    | "SCORE_DROP"
    | "CONSECUTIVE_ABSENCE"
    | "UNPAID_DAYS";

export type DirectorChurnCase = {
    id: string;
    churnCaseId: string | null;
    studentId: string;
    studentName: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    reason: string;
    status: ChurnCaseStatus | null;
    detectedAt: string | null;
};

export type ChurnThreshold = {
    attendanceDropPercentPoint: number;
    scoreDropPoints: number;
    consecutiveAbsences: number;
    unpaidDays: number;
};
