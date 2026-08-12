import { requireRole } from "@/lib/auth-guard";
import { getKstDayRange } from "@/lib/date-kst";
import { getStaffScope } from "@/lib/staff-scope";
import { getStaffDashboardData } from "@/features/dashboard/staff-data";
import StaffDashboardScreen from "./StaffDashboardScreen";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
    const session = await requireRole("TEACHER");
    const staffScope = await getStaffScope(session.user.id);
    const { startOfToday, endOfToday } = getKstDayRange();
    const dashboardData = await getStaffDashboardData({
        staffScope,
        staffUserId: session.user.id,
        isOfficeStaff: false,
        startOfDay: startOfToday,
        endOfDay: endOfToday,
    });

    return (
        <StaffDashboardScreen
            role="TEACHER"
            staffName={session.user.name ?? "선생님"}
            {...dashboardData}
        />
    );
}
