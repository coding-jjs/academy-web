import { requireRole } from "@/lib/auth-guard";
import { getParentPaymentsData } from "@/features/billing/parent-data";
import ParentPaymentsScreen from "./ParentPaymentsScreen";

export const dynamic = "force-dynamic";

export default async function ParentPaymentsPage() {
    const session = await requireRole("PARENT");
    const data = await getParentPaymentsData(session.user.id);
    return (
        <ParentPaymentsScreen
            {...data}
            tossReady={Boolean(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY)}
        />
    );
}
