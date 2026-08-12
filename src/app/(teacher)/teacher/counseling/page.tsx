import { requireRole } from "@/lib/auth-guard";
import { getStaffScope } from "@/lib/staff-scope";
import { getStaffCounselingData } from "@/features/counseling/staff-data";
import StaffCounselingScreen from "./StaffCounselingScreen";

export const dynamic = "force-dynamic";

export default async function TeacherCounselingPage() {
    const session = await requireRole("TEACHER");
    const staffScope = await getStaffScope(session.user.id);
    const counselingData = await getStaffCounselingData({
        staffScope,
        includeInquiries: false,
    });

    return <StaffCounselingScreen role="TEACHER" {...counselingData} />;
}
