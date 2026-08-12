import { requireRole } from "@/lib/auth-guard";
import { getStaffScope } from "@/lib/staff-scope";
import { getStaffReportsData } from "@/features/reports/staff-data";
import StaffReportsScreen from "@/app/(staff)/staff/reports/StaffReportsScreen";

export const dynamic = "force-dynamic";

export default async function StaffReportsPage() {
    const session = await requireRole("STAFF", "TEACHER");
    const staffScope = await getStaffScope(session.user.id);
    const students = await getStaffReportsData(staffScope);

    return <StaffReportsScreen students={students} />;
}
