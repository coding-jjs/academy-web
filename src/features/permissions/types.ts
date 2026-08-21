/**
 * 권한 관리 목록의 한 구성원 타입.
 *
 * 호출: `features/permissions/data.ts`가 grant+프리셋을 합쳐 채우고
 * `(director)/director/permissions/PermissionManagementScreen.tsx`가 토글에 쓴다.
 *
 * 교사·직원만 포함한다. 원장/학부모/학생은 이 화면에 나오지 않는다
 * (원장은 전권, 학부모·학생은 PermissionGrant 대상이 아님).
 *
 * 의도적으로 하지 않는 일:
 * - 키 목록을 여기서 정의하지 않는다 → `@/types/roles`의 `PermissionKey`.
 *
 * 관련: `features/permissions/data.ts`, `features/permissions/actions.ts`,
 * `lib/permissions.ts`.
 */

import type { PermissionKey } from "@/types/roles";

/**
 * ACTIVE TEACHER/STAFF 한 명과 화면 토글에 바로 쓰는 키-불리언 맵.
 * grant 행이 없어도 `resolvePermissions`가 역할 기본값을 채워 모든 키가 존재한다.
 */
export type PermissionMember = {
    id: string;
    name: string;
    email: string;
    role: "TEACHER" | "STAFF";
    permissions: Record<PermissionKey, boolean>;
};
