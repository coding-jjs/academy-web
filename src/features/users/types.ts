import type { StudentStatus } from "@/features/students/types";

export type PendingRoleUser = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    schoolName: string | null;
    grade: string | null;
    joinedAt: string;
    hasStudentProfile: boolean;
};

export type UnlinkedStudentOption = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    status: StudentStatus;
};
