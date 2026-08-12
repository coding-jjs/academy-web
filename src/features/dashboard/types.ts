import type { AttendanceStatus } from "@/features/attendance/types";

export type DirectorDashboardMetrics = {
    pendingReports: number;
    openChurn: number;
    overdueInvoices: number;
    newInquiries: number;
    enrolledStudents: number;
    guestUsers: number;
    todayAttendanceRate: number | null;
    todaySessionCount: number;
};

export type StaffDashboardSession = {
    id: string;
    classId: string;
    className: string;
    subject: string;
    classroom: string | null;
    timeLabel: string;
    startsAt: string;
    studentCount: number;
    uncheckedCount: number;
};

export type StaffDashboardMetrics = {
    todayClassCount: number;
    firstClassTime: string | null;
    uncheckedSessions: number;
    pendingReports: number;
    myStudentCount: number;
    openInquiries: number;
};

export type DashboardNewsItem = {
    id: string;
    title: string;
    createdAt: string;
};

export type ParentDashboardChild = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    arrivalSummary: {
        title: string;
        detail: string;
        status: AttendanceStatus | null;
        checkInAt: string | null;
    } | null;
    todaySessions: Array<{
        id: string;
        className: string;
        subject: string;
        timeLabel: string;
        classroom: string | null;
        attendanceStatus: AttendanceStatus | null;
    }>;
    reports: Array<{
        id: string;
        content: string;
        teacherName: string;
        sentAt: string | null;
        parentReadAt: string | null;
        periodStart: string;
        periodEnd: string;
    }>;
};

export type ParentDashboardData = {
    childList: ParentDashboardChild[];
    unreadCount: number;
    news: DashboardNewsItem[];
};

export type StudentDashboardData = {
    studentName: string;
    schoolName: string | null;
    grade: string | null;
    linked: boolean;
    todaySessions: Array<{
        id: string;
        className: string;
        subject: string;
        timeLabel: string;
        classroom: string | null;
        startsAt: string;
        attendanceStatus: AttendanceStatus | null;
    }>;
    nextSession: {
        className: string;
        timeLabel: string;
        classroom: string | null;
    } | null;
    todayAttendanceLabel: AttendanceStatus | null;
    latestGrade: {
        subject: string;
        title: string;
        score: number;
        maxScore: number;
        assessedAt: string;
    } | null;
    openWrongCount: number;
    unreadCount: number;
    news: DashboardNewsItem[];
    homework: Array<{
        id: string;
        title: string;
        content: string;
        recordDate: string;
    }>;
};
