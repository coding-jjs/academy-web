import type { AppRole, PermissionKey } from "@/types/roles";

export const PERMISSION_KEYS = [
    "viewAllStudents",
    "viewParentContact",
    "editLifeCounseling",
    "writeAiReport",
    "aiDirectSend",
    "ownClassAttendanceGrade",
    "otherTeacherAttendanceGrade",
    "sendMessage",
    "billing",
    "linkParentStudent",
] as const satisfies readonly PermissionKey[];

export const staffPermissionPreset: Record<PermissionKey, boolean> = {
    viewAllStudents: true,
    viewParentContact: true,
    editLifeCounseling: false,
    writeAiReport: false,
    aiDirectSend: false,
    ownClassAttendanceGrade: true,
    otherTeacherAttendanceGrade: false,
    sendMessage: false,
    billing: true,
    linkParentStudent: true,
};

export const teacherPermissionPreset: Record<PermissionKey, boolean> = {
    viewAllStudents: false,
    viewParentContact: false,
    editLifeCounseling: true,
    writeAiReport: true,
    aiDirectSend: false,
    ownClassAttendanceGrade: true,
    otherTeacherAttendanceGrade: false,
    sendMessage: false,
    billing: false,
    linkParentStudent: false,
};

export function roleHasAllPermissions(role: AppRole) {
    return role === "DIRECTOR";
}

export function presetForRole(
    role: "TEACHER" | "STAFF",
): Record<PermissionKey, boolean> {
    return role === "TEACHER"
        ? { ...teacherPermissionPreset }
        : { ...staffPermissionPreset };
}

export type PermissionGrantRow = Partial<Record<PermissionKey, boolean>> | null;

export function resolvePermissions(
    role: "TEACHER" | "STAFF",
    grant: PermissionGrantRow,
): Record<PermissionKey, boolean> {
    const base = presetForRole(role);
    if (!grant) return base;

    const next = { ...base };
    for (const key of PERMISSION_KEYS) {
        if (typeof grant[key] === "boolean") {
            next[key] = grant[key]!;
        }
    }

    // 직원은 학원 전체 학생 조회가 기본 (청구·성적·상담 등)
    if (role === "STAFF") {
        next.viewAllStudents = true;
    }
    // 교사는 수납 불가
    if (role === "TEACHER") {
        next.billing = false;
    }

    return next;
}