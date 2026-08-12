export type AppRole =
    | "DIRECTOR"
    | "TEACHER"
    | "STAFF"
    | "PARENT"
    | "STUDENT"
    | "GUEST";

export type RolePrefix =
    | "director"
    | "teacher"
    | "employee"
    | "parent"
    | "student"
    | "guest";

export type NavItem = {
    href: string;
    label: string;
    icon: string;
};

export type PermissionKey =
    | "viewAllStudents"
    | "viewParentContact"
    | "editLifeCounseling"
    | "writeAiReport"
    | "aiDirectSend"
    | "ownClassAttendanceGrade"
    | "otherTeacherAttendanceGrade"
    | "sendMessage"
    | "billing"
    | "linkParentStudent";
