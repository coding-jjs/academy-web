import { requireRole } from "@/lib/auth-guard";
import { getParentDashboardData } from "@/features/dashboard/parent-data";
import ParentDashboardScreen from "./ParentDashboardScreen";
import { resolveChild } from "@/features/families/resolve-child";
import { cookies } from "next/headers";
import { readParentChildCookie } from "@/features/families/parent-child-cooke";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ childId?: string }>;
}) {
    const session = await requireRole("PARENT");
    const params = await searchParams;
    const cookieStore = await cookies();
    const data = await getParentDashboardData(session.user.id);
    const activeChildId = resolveChild(
        data.childList.map((child) => child.id),
        params.childId ?? readParentChildCookie(cookieStore),
    );

    return <ParentDashboardScreen {...data} activeChildId={activeChildId} />;
}
