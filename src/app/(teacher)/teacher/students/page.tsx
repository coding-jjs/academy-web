/**
 * `/teacher/students` 담당 재원생.
 *
 * 연 사람: TEACHER. layout 가드 + page `requireRole("TEACHER")`.
 * 흐름: requireRole → `getStaffScope` → `getStaffStudentsData`(staff-data) →
 * `StaffStudentsScreen`.
 *
 * 직원 `/employee/students`가 같은 Screen을 재사용한다. 상태 전이는 원장만.
 */

import { requireRole } from "@/lib/auth-guard";
import { getKstRecentRange } from "@/lib/date-kst";
import {
    classScopeWhere,
    getStaffScope,
    studentScopeWhere,
} from "@/lib/staff-scope";
import { getStaffStudentsData } from "@/features/students/staff-data";
import StaffStudentsScreen from "./StaffStudentsScreen";

export const dynamic = "force-dynamic";

/** 스코프 안 재원생을 교사/직원 공용 Screen에 넘긴다. */
export default async function StaffStudentsPage() {
    const session = await requireRole("TEACHER");
    const staffScope = await getStaffScope(session.user.id);
    const { startRecent } = getKstRecentRange(14);
    const studentsData = await getStaffStudentsData({
        studentWhere: {
            status: "ENROLLED",
            ...studentScopeWhere(staffScope),
        },
        classWhere: {
            active: true,
            ...classScopeWhere(staffScope),
        },
        recentAttendanceStart: startRecent,
    });

    return (
        <StaffStudentsScreen
            viewAllStudents={staffScope.viewAllStudents}
            {...studentsData}
        />
    );
}
