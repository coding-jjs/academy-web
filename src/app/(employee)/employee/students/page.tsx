/**
 * `/employee/students` 직원 원생 라우트.
 *
 * 연 사람: STAFF. layout 가드 + page `requireRole("STAFF")`.
 * 흐름: requireRole → `getStaffScope` → `getStaffStudentsData` →
 * 교사 `StaffStudentsScreen` 재사용.
 *
 * UI는 교사와 같고 조회 범위만 staff-scope로 바뀐다.
 * 원생 상태 전이는 원장 `/director/students` 몫이다.
 */

import { requireRole } from "@/lib/auth-guard";
import { getKstRecentRange } from "@/lib/date-kst";
import {
    classScopeWhere,
    getStaffScope,
    studentScopeWhere,
} from "@/lib/staff-scope";
import { getStaffStudentsData } from "@/features/students/staff-data";
import StaffStudentsScreen from "@/app/(teacher)/teacher/students/StaffStudentsScreen";

export const dynamic = "force-dynamic";

/** 직원 스코프 재원생을 교사 Screen에 넘긴다. */
export default async function EmployeeStudentsPage() {
    const session = await requireRole("STAFF");
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
