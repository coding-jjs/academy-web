export type ParentReportItem = {
    id: string;
    content: string;
    keywords: string[];
    teacherName: string;
    periodStart: string;
    periodEnd: string;
    sentAt: string | null;
    parentReadAt: string | null;
};

export type ParentReportChild = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    reports: ParentReportItem[];
};
