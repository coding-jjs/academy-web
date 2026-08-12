import type { AttendanceStatus } from "@/features/attendance/types";

export type StaffAttendanceStudent = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    status: AttendanceStatus | null;
    checkInAt: string | null;
    checkOutAt: string | null;
    note: string | null;
    absenceRequest: { reason: string } | null;
};

export type StaffAttendanceSession = {
    id: string;
    classId: string;
    className: string;
    subject: string;
    teacherName: string | null;
    classroom: string | null;
    startsAt: string;
    endsAt: string;
    timeLabel: string;
    students: StaffAttendanceStudent[];
};
