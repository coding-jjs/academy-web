import { requireRole } from "@/lib/auth-guard";
import { getKstDayRange } from "@/lib/date-kst";
import { getStaffScope } from "@/lib/staff-scope";
import { getStaffAttendanceSessions } from "@/features/attendance/staff-data";
import StaffAttendanceScreen from "./StaffAttendanceScreen";

export const dynamic = "force-dynamic";

export default async function StaffAttendancePage() {
    const session = await requireRole("STAFF", "TEACHER");
    const staffScope = await getStaffScope(session.user.id);
    const { startOfToday, endOfToday } = getKstDayRange();
    const sessions = await getStaffAttendanceSessions({
        staffScope,
        startOfDay: startOfToday,
        endOfDay: endOfToday,
    });

    return (
        <StaffAttendanceScreen
            sessions={sessions}
            role={session.user.role as "TEACHER" | "STAFF"}
        />
    );
}
