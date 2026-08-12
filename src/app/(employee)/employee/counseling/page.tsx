import { requireRole } from "@/lib/auth-guard";
import { getStaffScope } from "@/lib/staff-scope";
import { getStaffCounselingData } from "@/features/counseling/staff-data";
import StaffCounselingScreen from "@/app/(teacher)/teacher/counseling/StaffCounselingScreen";

export const dynamic = "force-dynamic";

export default async function EmployeeCounselingPage() {
    const session = await requireRole("STAFF");
    const staffScope = await getStaffScope(session.user.id);
    const counselingData = await getStaffCounselingData({
        staffScope,
        includeInquiries: true,
    });

    return <StaffCounselingScreen role="STAFF" {...counselingData} />;
}
