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
