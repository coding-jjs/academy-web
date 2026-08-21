/**
 * `/director/permissions` 교사·직원 권한 토글.
 *
 * 연 사람: DIRECTOR. layout 가드 + page `requireRole("DIRECTOR")`.
 * 흐름: requireRole → `getPermissionMembers` → `PermissionManagementScreen`.
 *
 * 저장은 `saveMemberPermissions`. 교사 billing 키는 서버가 다시 false로 막는다.
 */

import { requireRole } from "@/lib/auth-guard"; // layout에 더해 page에서도 원장만.
import { getPermissionMembers } from "@/features/permissions/data"; // 권한 멤버 목록.
import PermissionManagementScreen from "./PermissionManagementScreen"; // 원장 Screen. 교사 billing 키는 서버가 다시 false.

export const dynamic = "force-dynamic"; // 권한 토글이 캐시에 안 남게.

/** 권한 멤버 목록을 관리 Screen에 넘긴다. */
export default async function DirectorPermissionsPage() { // proxy→layout→page. 저장은 saveMemberPermissions.
    await requireRole("DIRECTOR"); // 원장만. layout에 더해 page에서도 한 번.
    const members = await getPermissionMembers(); // 권한 멤버 목록.

    return <PermissionManagementScreen members={members} />; // Screen에 members만. 교사 billing 키는 서버가 다시 false.
} // 블록 끝.
