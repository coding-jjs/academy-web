import "server-only";

/**
 * 권한 관리 화면에 쓸 ACTIVE 교사·직원과 현재 grant를 읽는다.
 *
 * 호출: `(director)/director/permissions/page.tsx`가 서버에서 불러
 * `PermissionManagementScreen`에 넘긴다.
 *
 * grant 행이 없으면 `resolvePermissions`가 역할 프리셋(교사/직원)을 채운다.
 * 교사는 프리셋·저장 모두에서 `billing`이 항상 false다.
 *
 * 의도적으로 하지 않는 일:
 * - BLOCKED 계정은 목록에 넣지 않는다.
 * - 원장 PermissionGrant를 만들지 않는다 → 원장은 전권.
 *
 * 관련: `features/permissions/types.ts`, `lib/permissions.ts`,
 * `features/permissions/actions.ts`.
 */

import { prisma } from "@/lib/db";
import { resolvePermissions } from "@/lib/permissions";
import type { PermissionMember } from "@/features/permissions/types";

/**
 * 권한 토글 화면에 쓸 교사·직원 목록.
 *
 * @returns 역할·이름순. `permissions`는 프리셋+grant 병합 결과.
 * @auth 페이지가 DIRECTOR만 통과. 이 함수는 재검사하지 않는다.
 * @sideEffects 없음. 읽기 전용.
 */
export async function getPermissionMembers(): Promise<PermissionMember[]> {
    const users = await prisma.user.findMany({
        where: {
            role: { in: ["TEACHER", "STAFF"] },
            status: "ACTIVE",
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            permissionGrant: {
                select: {
                    viewAllStudents: true,
                    viewParentContact: true,
                    editLifeCounseling: true,
                    writeAiReport: true,
                    aiDirectSend: true,
                    ownClassAttendanceGrade: true,
                    otherTeacherAttendanceGrade: true,
                    sendMessage: true,
                    billing: true,
                    linkParentStudent: true,
                },
            },
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return users.map((user) => {
        const role = user.role as PermissionMember["role"];
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role,
            permissions: resolvePermissions(role, user.permissionGrant),
        };
    });
}
