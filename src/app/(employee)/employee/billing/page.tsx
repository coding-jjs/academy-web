import { requireRole } from "@/lib/auth-guard";
import { getBillingManagementData } from "@/features/billing/data";
import { syncOverdueInvoices } from "@/features/billing/overdue";
import { userHasPermission } from "@/lib/permission-guard";
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope";
import BillingManagementScreen from "@/features/billing/BillingManagementScreen";

export const dynamic = "force-dynamic";

export default async function EmployeeBillingPage() {
    const session = await requireRole("STAFF");

    const canManage = await userHasPermission(session.user.id, "billing");
    if (!canManage) {
        return (
            <BillingManagementScreen
                students={[]}
                invoices={[]}
                canManage={false}
                deniedMessage="결제/청구 관리 권한이 없습니다. 원장에게 권한 부여를 요청하세요."
            />
        );
    }

    await syncOverdueInvoices();

    const scope = await getStaffScope(session.user.id);
    const studentWhere = {
        status: "ENROLLED" as const,
        ...studentScopeWhere(scope),
    };

    const billingData = await getBillingManagementData({
        studentWhere,
        invoiceWhere: { student: studentWhere },
    });

    return <BillingManagementScreen {...billingData} canManage />;
}
