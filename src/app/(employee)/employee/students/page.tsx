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
