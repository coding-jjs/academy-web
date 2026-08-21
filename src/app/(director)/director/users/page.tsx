/**
 * `/director/users` 역할 부여 대기 GUEST 목록.
 *
 * 연 사람: DIRECTOR. layout `requireRole("DIRECTOR")`.
 * 흐름: `getPendingRoleUsersData`(users director-data) → `DirectorUsersScreen`.
 *
 * 부여는 `assignUserRole`. 이미 역할 있는 유저를 덮지 않는다.
 * 부트스트랩 원장 API와 별개다.
 */

import { getPendingRoleUsersData } from "@/features/users/director-data";
import DirectorUsersScreen from "./DirectorUsersScreen";

export const dynamic = "force-dynamic";

/** 대기 GUEST와 미연결 원생 옵션을 Screen에 넘긴다. */
export default async function DirectorUsersPage() {
    const usersData = await getPendingRoleUsersData();

    return <DirectorUsersScreen {...usersData} />;
}
