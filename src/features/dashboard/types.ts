/**
 * 원장·스태프·학부모·학생 역할 홈 대시보드가 공유하는 조회 모델이다.
 *
 * 호출: 각 `*-data.ts`가 채우고 `(director|teacher|parent|student)/dashboard` 화면이 읽는다.
 * 역할마다 묶음이 달라, 화면이 필요한 필드만 받게 나눈다.
 *
 * 의도적으로 하지 않는 일:
 * - 공개 마케팅 홈(`/`) 모델 → `features/home`. 여기는 로그인 후 역할 대시보드.
 * - 상태 전이 액션. 숫자·오늘 세션·자녀 요약만.
 *
 * 관련: `director-data.ts`, `staff-data.ts`, `parent-data.ts`, `student-data.ts`.
 */

import type { AttendanceStatus } from "@/features/attendance/types";

/** 원장 홈 카드용 집계. 오늘 출석률은 세션 출결 분모가 0이면 null. */
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

/** 교사·직원 홈의 오늘 수업 한 칸. uncheckedCount는 출결 미체크 재원 수. */
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

/** 스태프 홈 지표. openInquiries는 사무 직원만 data가 채운다. */
export type StaffDashboardMetrics = {
    todayClassCount: number;
    firstClassTime: string | null;
    uncheckedSessions: number;
    pendingReports: number;
    myStudentCount: number;
    openInquiries: number;
    pendingChurnCare: number;
};

/** 홈 공지 3건용 짧은 행. */
export type DashboardNewsItem = {
    id: string;
    title: string;
    createdAt: string;
};

/** 학부모 홈 자녀 한 명. 오늘 수업·도착 요약·최근 SENT 리포트. */
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

/** 학부모 홈 페이로드. 안 읽은 쪽지 수와 뉴스 3건을 같이. */
export type ParentDashboardData = {
    childList: ParentDashboardChild[];
    unreadCount: number;
    news: DashboardNewsItem[];
};

/**
 * 학생 홈 페이로드.
 * linked=false면 프로필 연결 전. 화면이 빈 카드만 그리게 필드를 0/null로 둔다.
 */
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
