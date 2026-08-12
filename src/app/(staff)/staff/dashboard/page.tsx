import { requireRole } from "@/lib/auth-guard";
import { getKstDayRange } from "@/lib/date-kst";
import { getStaffScope } from "@/lib/staff-scope";
import { getStaffDashboardData } from "@/features/dashboard/staff-data";
import StaffDashboardScreen from "./StaffDashboardScreen";

export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
    const session = await requireRole("STAFF", "TEACHER");
    const role = session.user.role as "TEACHER" | "STAFF";
    const staffScope = await getStaffScope(session.user.id);
    const { startOfToday, endOfToday } = getKstDayRange();
    const dashboardData = await getStaffDashboardData({
        staffScope,
        staffUserId: session.user.id,
        isOfficeStaff: role === "STAFF",
        startOfDay: startOfToday,
        endOfDay: endOfToday,
    });

    return (
        <StaffDashboardScreen
            role={role}
            staffName={session.user.name ?? "직원"}
            {...dashboardData}
        />
    );
}
