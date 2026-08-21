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

import { requireRole } from "@/lib/auth-guard"; // 교사만. 직원 App Router에는 출석 page가 없다.
import { getKstDayRange } from "@/lib/date-kst"; // 오늘 KST 회차 구간.
import { getStaffScope } from "@/lib/staff-scope"; // 담당 반 세션.
import { getStaffAttendanceSessions } from "@/features/attendance/staff-data"; // 오늘 담당 세션.
import StaffAttendanceScreen from "./StaffAttendanceScreen"; // 출석 Screen. 저장은 AttendanceSessionEditor.

export const dynamic = "force-dynamic"; // 오늘 세션이 캐시에 안 남게.

/** 오늘 담당 세션을 출석 Screen에 넘긴다. */
export default async function StaffAttendancePage() { // proxy→layout→page. 직원 출석 URL 없음.
    const session = await requireRole("TEACHER"); // 교사만. 직원 App Router에는 출석 page가 없다.
    const staffScope = await getStaffScope(session.user.id); // 담당 반 세션.
    const { startOfToday, endOfToday } = getKstDayRange(); // 오늘 KST 회차 구간.
    const sessions = await getStaffAttendanceSessions({ // 오늘 담당 세션.
        staffScope, // 담당 반만. 원장 전 학원이 아니다.
        startOfDay: startOfToday, // KST 오늘 시작.
        endOfDay: endOfToday, // KST 오늘 끝.
    }); // 객체/호출 끝.

    return <StaffAttendanceScreen sessions={sessions} role="TEACHER" />; // 출석 Screen. 저장은 AttendanceSessionEditor.
} // 블록 끝.
