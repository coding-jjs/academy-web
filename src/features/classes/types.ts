export type TeacherOption = {
    id: string;
    name: string;
    role: "TEACHER" | "STAFF";
};

export type ClassSessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export type ClassSessionRow = {
    id: string;
    startsAt: string;
    endsAt: string;
    classroom: string | null;
    status: ClassSessionStatus;
};

export type ClassRow = {
    id: string;
    name: string;
    subject: string;
    teacherUserId: string | null;
    teacherName: string | null;
    active: boolean;
    enrollmentCount: number;
    sessions: ClassSessionRow[];
};
