import type { AppRole } from "@/types/roles";

export const roleLabels: Record<AppRole, string> = {
    DIRECTOR: "원장",
    TEACHER: "교사",
    STAFF: "직원",
    PARENT: "학부모",
    STUDENT: "학생",
    GUEST: "게스트",
};

const roleHomePaths: Record<AppRole, string> = {
    DIRECTOR: "/director/dashboard",
    TEACHER: "/staff/dashboard",
    STAFF: "/staff/dashboard",
    PARENT: "/parent/dashboard",
    STUDENT: "/student/dashboard",
    GUEST: "/guest/waiting",
};

export function getRoleHomePath(role: AppRole) {
    return roleHomePaths[role];
}
