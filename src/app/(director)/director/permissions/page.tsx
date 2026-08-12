import { requireRole } from "@/lib/auth-guard";
import { getPermissionMembers } from "@/features/permissions/data";
import PermissionManagementScreen from "./PermissionManagementScreen";

export const dynamic = "force-dynamic";

export default async function DirectorPermissionsPage() {
    await requireRole("DIRECTOR");
    const members = await getPermissionMembers();

    return <PermissionManagementScreen members={members} />;
}
