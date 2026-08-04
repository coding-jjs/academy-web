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
    viewAllStudents: false,
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

    if (role === "TEACHER") {
        next.billing = false;
    }

    return next;
}
