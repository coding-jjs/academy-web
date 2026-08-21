/**
 * `/teacher/dashboard` 교사 오늘 수업 홈.
 *
 * 연 사람: TEACHER. layout 가드 + page `requireRole("TEACHER")`.
 * 흐름: requireRole → `getStaffScope` → `getStaffDashboardData`(staff-data,
 * `isOfficeStaff: false`) → `StaffDashboardScreen`.
 *
 * `StaffDashboardScreen`은 교사 라우트만 연결한다. 직원 `/employee/dashboard`는
 * 이 Screen을 쓰지 않고 바로가기 홈을 둔다.
 */

import { requireRole } from "@/lib/auth-guard";
import { getKstDayRange } from "@/lib/date-kst";
import { getStaffScope } from "@/lib/staff-scope";
import { getStaffDashboardData } from "@/features/dashboard/staff-data";
import StaffDashboardScreen from "./StaffDashboardScreen";

export const dynamic = "force-dynamic";

/** 담당 스코프의 오늘 세션·지표를 교사 Screen에 넘긴다. */
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
