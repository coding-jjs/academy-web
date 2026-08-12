import type { AttendanceStatus } from "@/features/attendance/types";

export type StudentStatus = "ENROLLED" | "PAUSED" | "WITHDRAWN";

export type DirectorStudentClass = {
    enrollmentId: string;
    classId: string;
    className: string;
    teacherName: string | null;
    enrolledAt: string;
};

export type DirectorStudentChange = {
    id: string;
    className: string;
    endedAt: string;
    status: string;
};

export type DirectorStudent = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    status: StudentStatus;
    googleLinked: boolean;
    email: string | null;
    parentCount: number;
    parentNames: string[];
    classes: DirectorStudentClass[];
    recentChanges: DirectorStudentChange[];
};

export type DirectorClassOption = {
    id: string;
    name: string;
    teacherName: string | null;
};

export type StaffClassOption = {
    id: string;
    name: string;
    subject: string;
};

export type StaffStudentRow = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    status: StudentStatus;
    googleLinked: boolean;
    email: string | null;
    classes: {
        id: string;
        name: string;
        subject: string;
        teacherName: string | null;
    }[];
    parents: { name: string; relationship: string | null }[];
    recentAttendance: {
        status: AttendanceStatus;
        className: string;
        startsAt: string;
        checkInAt: string | null;
    }[];
    recentGrades: {
        id: string;
        title: string;
        subject: string;
        score: number;
        maxScore: number;
        assessedAt: string;
    }[];
    recentRecords: {
        id: string;
        type: string;
        title: string;
        content: string;
        recordDate: string;
        authorName: string;
    }[];
};
