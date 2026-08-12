import { requireRole } from "@/lib/auth-guard";
import ParentReportsScreen from "@/app/(parent)/parent/reports/ParentReportsScreen";
import { getParentReportChildren } from "@/features/reports/parent-data";

export const dynamic = "force-dynamic";

export default async function ParentReportsPage() {
    const session = await requireRole("PARENT");

    const children = await getParentReportChildren(session.user.id);

    return <ParentReportsScreen childList={children} />;
}
