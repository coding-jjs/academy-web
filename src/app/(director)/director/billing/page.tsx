import { requireRole } from "@/lib/auth-guard";
import { getBillingManagementData } from "@/features/billing/data";
import { syncOverdueInvoices } from "@/features/billing/overdue";
import BillingManagementScreen from "@/features/billing/BillingManagementScreen";

export const dynamic = "force-dynamic";

export default async function DirectorBillingPage() {
    await requireRole("DIRECTOR");

    await syncOverdueInvoices();

    const billingData = await getBillingManagementData({
        studentWhere: { status: "ENROLLED" },
    });

    return <BillingManagementScreen {...billingData} canManage />;
}
