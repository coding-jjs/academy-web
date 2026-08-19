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

import { prisma } from "@/lib/db"; // server-only. JWT의 권한을 믿지 않고 grant를 본다.
import { // 이름만 가져온다. 역할 가드는 proxy·requireRole.
    PERMISSION_KEYS, // 요청마다 grant. 교사 billing은 항상 false.
    resolvePermissions, // 요청마다 grant. 교사 billing은 항상 false.
    roleHasAllPermissions, // 요청마다 grant. 교사 billing은 항상 false.
} from "@/lib/permissions"; // 프리셋+교사 billing 하드 룰. grant 저장은 actions.ts.
import type { AppRole, PermissionKey } from "@/types/roles"; // 키 이름. PARENT/STUDENT/GUEST는 키 개념이 없다.

/** grant 행에서 키 컬럼만 select. PERMISSION_KEYS가 늘면 여기도 같이 늘어난다. */
const grantSelect = Object.fromEntries( // 여기 없는 키는 클라이언트가 보내도 저장 액션이 무시한다.
    PERMISSION_KEYS.map((key) => [key, true]), // 여기 없는 키는 클라이언트가 보내도 저장 액션이 무시한다.
) as Record<PermissionKey, true>; // Prisma select. 권한 키 맵을 JWT에 싣지 않는 이유와 같음.

/**
 * 이 사용자가 해당 키를 쓰도 되는지.
 *
 * @returns 원장 true. 없는 user / 학부모·학생·게스트 false.
 *          교사·직원은 프리셋+grant (교사 billing은 항상 false).
 */
export async function userHasPermission( // 요청마다 grant. 교사 billing은 항상 false.
    userId: string, // requireRole이 넘긴 DB User.id. JWT userId만 믿지 않는다.
    key: PermissionKey, // billing 등. 레이아웃 redirect가 아니라 boolean.
): Promise<boolean> { // false면 호출부가 UI·액션을 가린다. 담당 반은 staff-scope.
    const user = await prisma.user.findUnique({ // JWT의 권한을 믿지 않고 grant 테이블을 본다.
        where: { id: userId }, // 없는 계정이면 아래에서 false.
        select: { // 역할과 grant만. 스코프 where는 만들지 않는다.
            role: true, // DIRECTOR면 grant를 건너뛴다.
            permissionGrant: { select: grantSelect }, // 교사 billing은 resolvePermissions가 다시 끈다.
        },
    });

    if (!user) return false; // 없는 계정은 키를 주지 않는다.

    if (roleHasAllPermissions(user.role as AppRole)) return true; // 원장. grant 조회를 건너뛰고 모든 키 true.

    if (user.role !== "TEACHER" && user.role !== "STAFF") return false; // 학부모·학생·게스트는 키 개념이 없다. 직원 API를 쳐도 false.

    return resolvePermissions(user.role, user.permissionGrant)[key]; // 프리셋 + grant. 교사 billing은 항상 false.
}
