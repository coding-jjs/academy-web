export type ReportStatus =
    | "UNWRITTEN"
    | "DRAFTING"
    | "PENDING_APPROVAL"
    | "REJECTED"
    | "SENT"
    | "FAILED";

export type StaffReportItem = {
    id: string;
    status: ReportStatus;
    content: string;
    keywords: string[];
    rejectionReason: string | null;
    teacherName: string;
    periodStart: string;
    periodEnd: string;
    updatedAt: string;
};

export type StaffReportStudent = {
    id: string;
    studentProfileId: string | null;
    name: string;
    email: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    /** Editable draft, or latest locked report when no draft exists. */
    report: StaffReportItem | null;
    /** Latest submitted/locked report (승인 대기·발송·실패). */
    submittedReport: StaffReportItem | null;
    /** Recent locked reports, newest first (includes submittedReport). */
    submittedReports: StaffReportItem[];
};

export type DirectorReportStudent = {
    id: string;
    studentProfileId: string | null;
    name: string;
    email: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    report: {
        id: string;
        status: ReportStatus;
        content: string;
        teacherName: string;
        periodStart: string;
        periodEnd: string;
    } | null;
};
