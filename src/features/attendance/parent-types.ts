import type { AttendanceStatus } from "@/features/attendance/types";

export type ParentAttendanceSession = {
    id: string;
    className: string;
    subject: string;
    teacherName: string | null;
    classroom: string | null;
    startsAt: string;
    endsAt: string;
    timeLabel: string;
    isToday: boolean;
    attendanceStatus: AttendanceStatus | null;
    checkInAt: string | null;
    checkOutAt: string | null;
    absenceRequest: {
        id: string;
        reason: string;
        requestedAt: string;
    } | null;
};

export type ParentAttendanceChild = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    monthCounts: {
        present: number;
        late: number;
        absent: number;
        earlyLeave: number;
    };
    todayHighlight: {
        className: string;
        timeLabel: string;
        classroom: string | null;
        status: AttendanceStatus | null;
    } | null;
    sessions: ParentAttendanceSession[];
};
