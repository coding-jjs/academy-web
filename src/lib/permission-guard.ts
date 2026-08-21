/**
 * 개별 권한 키 판정. 페이지·액션이 `userHasPermission(id, "billing")`처럼 부른다.
 *
 * 호출: 교사/직원 페이지와 `features/{grades,attendance,messages,counseling}` actions.
 * `requireRole`이 역할 URL은 통과시킨 뒤, 이 함수가 키 단위로 막는다
 * (예: 직원은 /employee 가능, billing grant가 꺼져 있으면 수납 액션 거부).
 *
 * 서버 전용 읽기. JWT의 권한을 믿지 않고 grant 테이블을 본다.
 * 쓰지 않음 — 권한 저장은 `features/permissions/actions.ts`.
 *
 * 의도적으로 하지 않는 일:
 * - PARENT/STUDENT/GUEST에게 키를 주지 않는다 → 항상 false.
 * - 학생 스코프(담당 반)는 보지 않는다 → `staff-scope.ts`.
 * - 레이아웃 redirect는 하지 않는다. false를 돌려 호출부가 UI를 가린다.
 *
 * 관련: `permissions.ts`, `staff-scope.ts`, `auth-guard.ts`.
 */

import { prisma } from "@/lib/db";
import {
    PERMISSION_KEYS,
    resolvePermissions,
    roleHasAllPermissions,
} from "@/lib/permissions";
import type { AppRole, PermissionKey } from "@/types/roles";

/** grant 행에서 키 컬럼만 select. PERMISSION_KEYS가 늘면 여기도 같이 늘어난다. */
const grantSelect = Object.fromEntries(
    PERMISSION_KEYS.map((key) => [key, true]),
) as Record<PermissionKey, true>;

/**
 * 이 사용자가 해당 키를 쓰도 되는지.
 *
 * @returns 원장 true. 없는 user / 학부모·학생·게스트 false.
 *          교사·직원은 프리셋+grant (교사 billing은 항상 false).
 */
export async function userHasPermission(
    userId: string,
    key: PermissionKey,
): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            permissionGrant: { select: grantSelect },
        },
    });

    if (!user) return false;

    if (roleHasAllPermissions(user.role as AppRole)) return true;

    if (user.role !== "TEACHER" && user.role !== "STAFF") return false;

    return resolvePermissions(user.role, user.permissionGrant)[key];
}
