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

import { requireRole } from "@/lib/auth-guard"; // 교사만. StaffDashboardScreen은 이 라우트만 연결한다.
import { getKstDayRange } from "@/lib/date-kst"; // 오늘 KST. 출석 회차 구간.
import { getStaffScope } from "@/lib/staff-scope"; // 담당 반·학생. 직원 대시보드는 이 Screen을 쓰지 않는다.
import { getStaffDashboardData } from "@/features/dashboard/staff-data"; // 오늘 세션·지표. isOfficeStaff: false.
import StaffDashboardScreen from "./StaffDashboardScreen"; // 교사 라우트 전용. /employee/dashboard 가 쓰지 않는다.

export const dynamic = "force-dynamic"; // 오늘 세션이 캐시에 안 남게.

/** 담당 스코프의 오늘 세션·지표를 교사 Screen에 넘긴다. */
export default async function TeacherDashboardPage() { // proxy→layout→page. 직원 대시보드는 바로가기 홈.
    const session = await requireRole("TEACHER"); // 교사만. StaffDashboardScreen은 이 라우트만 연결한다.
    const staffScope = await getStaffScope(session.user.id); // 담당 반·학생. 직원 대시보드는 이 Screen을 쓰지 않는다.
    const { startOfToday, endOfToday } = getKstDayRange(); // 오늘 KST. 출석 회차 구간.
    const dashboardData = await getStaffDashboardData({ // 오늘 세션·지표. isOfficeStaff: false.
        staffScope, // 담당 범위. 원장 전 학원 지표가 아니다.
        staffUserId: session.user.id, // 교사 User.id. 직원 대시보드가 아니다.
        isOfficeStaff: false, // 교사. 직원 홈은 이 로더를 타지 않는다.
        startOfDay: startOfToday, // KST 오늘 시작.
        endOfDay: endOfToday, // KST 오늘 끝.
    }); // 객체/호출 끝.

    return ( // 교사 Screen에 props만. 직원 URL은 바로가기 홈.
        <StaffDashboardScreen // 교사 라우트 전용. /employee/dashboard 가 쓰지 않는다.
            role="TEACHER" // 교사. STAFF로 이 Screen을 열지 않는다.
            staffName={session.user.name ?? "선생님"} // 인사 이름. 지표가 아니다.
            {...dashboardData} // 오늘 세션·지표.
        /> // StaffDashboardScreen 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
