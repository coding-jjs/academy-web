import { requireRole } from "@/lib/auth-guard";
import { getStaffScope } from "@/lib/staff-scope";
import { getStaffCounselingData } from "@/features/counseling/staff-data";
import StaffCounselingScreen from "./StaffCounselingScreen";

export const dynamic = "force-dynamic";

export default async function StaffCounselingPage() {
    const session = await requireRole("STAFF", "TEACHER");
    const staffScope = await getStaffScope(session.user.id);
    const role = session.user.role as "TEACHER" | "STAFF";
    const counselingData = await getStaffCounselingData({
        staffScope,
        includeInquiries: role === "STAFF",
    });

    return <StaffCounselingScreen role={role} {...counselingData} />;
}
