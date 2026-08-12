import { requireRole } from "@/lib/auth-guard";
import { getParentDashboardData } from "@/features/dashboard/parent-data";
import ParentDashboardScreen from "./ParentDashboardScreen";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
    const session = await requireRole("PARENT");
    const data = await getParentDashboardData(session.user.id);
    return <ParentDashboardScreen {...data} />;
}
