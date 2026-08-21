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

import type { AppRole, PermissionKey } from "@/types/roles"; // grant 컬럼 이름. PARENT/STUDENT/GUEST는 키 없음.

/**
 * grant 컬럼과 1:1. 원장 저장 액션이 이 배열만 순회하므로
 * 여기 없는 키는 클라이언트가 보내도 무시된다.
 */
export const PERMISSION_KEYS = [ // 여기 없는 키는 클라이언트가 보내도 저장 액션이 무시한다.
    "viewAllStudents", // 꺼지면 staff-scope가 담임 반만.
    "viewParentContact", // 원생 상세 연락처.
    "editLifeCounseling", // 상담 메모.
    "writeAiReport", // 교사 리포트 초안. 발송은 원장 승인.
    "aiDirectSend", // 원장 승인 없이 발송. 교사 기본 false.
    "ownClassAttendanceGrade", // 담당 반 출석·성적.
    "otherTeacherAttendanceGrade", // 타반. 기본 false.
    "sendMessage", // 직원은 PENDING_APPROVAL.
    "billing", // 교사는 아래 하드 룰로 항상 false.
    "linkParentStudent", // 학부모-원생 연결. 교사 기본 false.
] as const satisfies readonly PermissionKey[]; // Prisma grant 컬럼과 1:1. 새 키는 마이그레이션과 같이.

/**
 * 직원 기본값. 수납·학부모 연락·원생 연결은 열고,
 * 전 원생 조회·AI 발송·타반 출석은 원장이 켜 주기 전까지 끈다.
 */
export const staffPermissionPreset: Record<PermissionKey, boolean> = { // 직원. billing 기본 true. 교사는 이 맵이 아니다.
    viewAllStudents: false, // 원장이 켜기 전엔 담임 반만.
    viewParentContact: true, // 직원 연락 업무.
    editLifeCounseling: false, // 상담은 교사 프리셋.
    writeAiReport: false, // 리포트 초안은 교사.
    aiDirectSend: false, // 발송은 원장.
    ownClassAttendanceGrade: true, // 담당 반 출석.
    otherTeacherAttendanceGrade: false, // 타반은 원장이 켜기 전엔 끈다.
    sendMessage: false, // 켜면 승인 대기 쪽지.
    billing: true, // 직원 수납. 교사는 이 프리셋이 아니다.
    linkParentStudent: true, // 학부모-원생 연결.
};

/**
 * 교사 기본값. 상담·리포트 초안·담당 반 출석만 연다.
 * billing은 여기도 false이고, resolvePermissions가 grant와 무관하게 다시 끈다.
 */
export const teacherPermissionPreset: Record<PermissionKey, boolean> = { // 교사. 수납은 원장/직원.
    viewAllStudents: false, // 담임 반만. staff-scope.
    viewParentContact: false, // 학부모 연락은 직원 프리셋.
    editLifeCounseling: true, // 상담 메모.
    writeAiReport: true, // 초안·승인요청. SENT는 원장.
    aiDirectSend: false, // 원장 승인 없이 발송하지 않는다.
    ownClassAttendanceGrade: true, // 담당 반 출석·성적.
    otherTeacherAttendanceGrade: false, // 타반은 원장이 켜기 전엔 끈다.
    sendMessage: false, // 켜면 쪽지. 직원과 달리 승인은 원장 설정.
    billing: false, // 하드 룰이 한 번 더 끈다. 수납은 원장/직원.
    linkParentStudent: false, // 학부모 연결은 직원.
};

/**
 * 원장만 모든 키 true. permission-guard가 grant 조회를 건너뛸 때 쓴다.
 * TEACHER/STAFF는 false — 프리셋+grant를 탄다.
 */
export function roleHasAllPermissions(role: AppRole) { // PARENT/STUDENT/GUEST는 키 자체가 없다.
    return role === "DIRECTOR"; // 원장만 모든 키 true. TEACHER/STAFF는 프리셋+grant.
}

/**
 * 역할 기본 맵의 복사본. 화면이 프리셋을 mutate해도 모듈 상수가 안 바뀌게 spread한다.
 */
export function presetForRole( // 프리셋+grant. 교사 billing 하드 룰.
    role: "TEACHER" | "STAFF", // 원장/학부모/학생/게스트는 프리셋이 없다.
): Record<PermissionKey, boolean> { // 복사본. 화면 리셋이 모듈 상수를 바꾸지 않게.
    return role === "TEACHER" // 프리셋+grant. 교사 billing 하드 룰.
        ? { ...teacherPermissionPreset } // 화면이 mutate해도 모듈 상수가 안 바뀌게 복사.
        : { ...staffPermissionPreset }; // 직원. billing 기본 true.
}

/** Prisma grant 행. 컬럼이 비어 있거나 관계가 없으면 null. */
export type PermissionGrantRow = Partial<Record<PermissionKey, boolean>> | null; // 없는 키는 프리셋 유지.

/**
 * 프리셋 위에 grant boolean만 덮는다. grant에 없는 키는 프리셋 유지.
 *
 * 교사 `billing`은 grant가 true여도 강제로 false.
 * 수납은 원장/직원 영역으로 남기고, 실수로 교사에게 켠 값이 있어도 청구 화면을 못 연다.
 */
export function resolvePermissions( // 프리셋+grant. 교사 billing 하드 룰.
    role: "TEACHER" | "STAFF", // 원장은 이 함수를 타지 않는다. roleHasAllPermissions.
    grant: PermissionGrantRow, // null이면 프리셋만. 교사 billing은 그래도 끈다.
): Record<PermissionKey, boolean> { // 최종 맵. JWT에 싣지 않고 요청마다 계산.
    const base = presetForRole(role); // 역할 기본. grant 없으면 이 값만.

    if (!grant) return base; // grant 행이 없으면 역할 기본값만.

    const next = { ...base }; // grant에 boolean이 있는 키만 덮는다. 없는 키는 프리셋 유지.
    for (const key of PERMISSION_KEYS) { // 여기 없는 키는 클라이언트가 보내도 무시.
        if (typeof grant[key] === "boolean") { // null/undefined는 프리셋 유지. 클라이언트가 보낸 없는 키는 무시.
            next[key] = grant[key]!; // boolean만 덮는다. 교사 billing은 아래에서 다시 끈다.
        }
    }

    if (role === "TEACHER") { // 교사 billing은 grant가 true여도 끈다. 수납은 원장/직원 영역.
        next.billing = false; // 하드 룰. 실수로 켠 grant가 있어도 청구 화면을 못 연다.
    }

    return next; // 최종 맵. userHasPermission이 키 하나만 꺼낸다.
}
