import type { AppRole } from "@/types/roles";

export const roleLabels: Record<AppRole, string> = {
    DIRECTOR: "원장",
    TEACHER: "선생님",
    STAFF: "직원",
    PARENT: "학부모",
    STUDENT: "학생",
    GUEST: "게스트",
};

export const adminRoleLabels = {
    director: roleLabels.DIRECTOR,
    teacher: roleLabels.TEACHER,
    employee: roleLabels.STAFF,
} as const;

const roleHomePaths: Record<AppRole, string> = {
    DIRECTOR: "/director/dashboard",
    TEACHER: "/teacher/dashboard",
    STAFF: "/employee/dashboard",
    PARENT: "/parent/dashboard",
    STUDENT: "/student/dashboard",
    GUEST: "/guest/waiting",
};

export function getRoleHomePath(role: AppRole) {
    return roleHomePaths[role];
}
