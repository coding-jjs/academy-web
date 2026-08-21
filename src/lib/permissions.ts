/**
 * 교사/직원 권한 키와 역할 프리셋.
 * grant 테이블의 부분 덮어쓰기와 "교사는 billing 불가" 하드 룰을 한곳에서 적용한다.
 *
 * 호출:
 * - `permission-guard.ts` `userHasPermission` — 요청마다 최종 boolean
 * - `features/permissions/data.ts` — 원장 권한 화면의 현재 값
 * - `features/permissions/actions.ts` — 저장 시 허용 키 목록
 * - `PermissionManagementScreen` — 프리셋으로 리셋
 *
 * 읽기 전용 순수 함수. 클라이언트(권한 화면)와 서버가 같이 import한다. DB는 치지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - DIRECTOR/PARENT/STUDENT/GUEST 프리셋은 없다. 원장은 전부 true, 나머지는 키 자체가 없다.
 * - URL 접근을 막지 않는다 → `requireRole`. 메뉴 숨김도 하지 않는다 → `navigation.ts`.
 *
 * 관련: `permission-guard.ts`, `types/roles.ts`, Prisma `PermissionGrant`.
 */

import type { AppRole, PermissionKey } from "@/types/roles";

/**
 * grant 컬럼과 1:1. 원장 저장 액션이 이 배열만 순회하므로
 * 여기 없는 키는 클라이언트가 보내도 무시된다.
 */
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

/**
 * 직원 기본값. 수납·학부모 연락·원생 연결은 열고,
 * 전 원생 조회·AI 발송·타반 출석은 원장이 켜 주기 전까지 끈다.
 */
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

/**
 * 교사 기본값. 상담·리포트 초안·담당 반 출석만 연다.
 * billing은 여기도 false이고, resolvePermissions가 grant와 무관하게 다시 끈다.
 */
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

/**
 * 원장만 모든 키 true. permission-guard가 grant 조회를 건너뛸 때 쓴다.
 * TEACHER/STAFF는 false — 프리셋+grant를 탄다.
 */
export function roleHasAllPermissions(role: AppRole) {
    return role === "DIRECTOR";
}

/**
 * 역할 기본 맵의 복사본. 화면이 프리셋을 mutate해도 모듈 상수가 안 바뀌게 spread한다.
 */
export function presetForRole(
    role: "TEACHER" | "STAFF",
): Record<PermissionKey, boolean> {
    return role === "TEACHER"
        ? { ...teacherPermissionPreset }
        : { ...staffPermissionPreset };
}

/** Prisma grant 행. 컬럼이 비어 있거나 관계가 없으면 null. */
export type PermissionGrantRow = Partial<Record<PermissionKey, boolean>> | null;

/**
 * 프리셋 위에 grant boolean만 덮는다. grant에 없는 키는 프리셋 유지.
 *
 * 교사 `billing`은 grant가 true여도 강제로 false.
 * 수납은 원장/직원 영역으로 남기고, 실수로 교사에게 켠 값이 있어도 청구 화면을 못 연다.
 */
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
