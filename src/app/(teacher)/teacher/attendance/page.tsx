/**
 * `/teacher/attendance` 오늘 회차 출석.
 *
 * 연 사람: TEACHER. layout 가드 + page `requireRole("TEACHER")`.
 * 흐름: requireRole → `getStaffScope` → `getStaffAttendanceSessions`(staff-data) →
 * `StaffAttendanceScreen` (`role="TEACHER"`).
 *
 * 직원 App Router에는 출석 page가 없다. 저장은 `AttendanceSessionEditor` →
 * `saveSessionAttendance`.
 */

import { requireRole } from "@/lib/auth-guard";
import { getKstDayRange } from "@/lib/date-kst";
import { getStaffScope } from "@/lib/staff-scope";
import { getStaffAttendanceSessions } from "@/features/attendance/staff-data";
import StaffAttendanceScreen from "./StaffAttendanceScreen";

export const dynamic = "force-dynamic";

/** 오늘 담당 세션을 출석 Screen에 넘긴다. */
export default async function StaffAttendancePage() {
    const session = await requireRole("TEACHER");
    const staffScope = await getStaffScope(session.user.id);
    const { startOfToday, endOfToday } = getKstDayRange();
    const sessions = await getStaffAttendanceSessions({
        staffScope,
        startOfDay: startOfToday,
        endOfDay: endOfToday,
    });

    return <StaffAttendanceScreen sessions={sessions} role="TEACHER" />;
}
