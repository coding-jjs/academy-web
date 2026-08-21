/**
 * `/director/permissions` 교사·직원 권한 토글.
 *
 * 연 사람: DIRECTOR. layout 가드 + page `requireRole("DIRECTOR")`.
 * 흐름: requireRole → `getPermissionMembers` → `PermissionManagementScreen`.
 *
 * 저장은 `saveMemberPermissions`. 교사 billing 키는 서버가 다시 false로 막는다.
 */

import { requireRole } from "@/lib/auth-guard";
import { getPermissionMembers } from "@/features/permissions/data";
import PermissionManagementScreen from "./PermissionManagementScreen";

export const dynamic = "force-dynamic";

/** 권한 멤버 목록을 관리 Screen에 넘긴다. */
export default async function DirectorPermissionsPage() {
    await requireRole("DIRECTOR");
    const members = await getPermissionMembers();

    return <PermissionManagementScreen members={members} />;
}
