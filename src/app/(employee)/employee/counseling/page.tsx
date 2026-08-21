import { requireRole } from "@/lib/auth-guard";
import { getStaffScope } from "@/lib/staff-scope";
import { getStaffCounselingData } from "@/features/counseling/staff-data";
import { getTeacherChurnCareTasks } from "@/features/churn/teacher-data";
import StaffCounselingScreen from "@/app/(teacher)/teacher/counseling/StaffCounselingScreen";

export const dynamic = "force-dynamic";

export default async function EmployeeCounselingPage() {
    const session = await requireRole("STAFF");
    const staffScope = await getStaffScope(session.user.id);
    const [counselingData, churnTasks] = await Promise.all([
        getStaffCounselingData({
            staffScope,
            includeInquiries: true,
            onlyOwnMemos: false,
        }),
        getTeacherChurnCareTasks(session.user.id),
    ]);

    return (
        <StaffCounselingScreen
            role="STAFF"
            {...counselingData}
            churnTasks={churnTasks}
        />
    );
}
