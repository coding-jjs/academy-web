import { requireRole } from "@/lib/auth-guard";
import ParentReportsScreen from "@/app/(parent)/parent/reports/ParentReportsScreen";
import { getParentReportChildren } from "@/features/reports/parent-data";
import { resolveChild } from "@/features/families/resolve-child";
import { readParentChildCookie } from "@/features/families/parent-child-cooke";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function ParentReportsPage({
    searchParams,
}: {
    searchParams: Promise<{ childId?: string }>;
}) {
    const session = await requireRole("PARENT");
    const params = await searchParams;
    const cookieStore = await cookies();
    const children = await getParentReportChildren(session.user.id);
    const activeChildId = resolveChild(
        children.map((child) => child.id),
        params.childId ?? readParentChildCookie(cookieStore),
    );

    return (
        <ParentReportsScreen
            key={activeChildId}
            childList={children}
            activeChildId={activeChildId}
        />
    );
}
