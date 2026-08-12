import { getPendingRoleUsersData } from "@/features/users/director-data";
import DirectorUsersScreen from "./DirectorUsersScreen";

export const dynamic = "force-dynamic";

export default async function DirectorUsersPage() {
    const usersData = await getPendingRoleUsersData();

    return <DirectorUsersScreen {...usersData} />;
}
