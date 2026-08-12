export type ReportStatus =
    | "UNWRITTEN"
    | "DRAFTING"
    | "PENDING_APPROVAL"
    | "REJECTED"
    | "SENT"
    | "FAILED";

export type StaffReportStudent = {
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
        keywords: string[];
        rejectionReason: string | null;
        teacherName: string;
        periodStart: string;
        periodEnd: string;
    } | null;
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
