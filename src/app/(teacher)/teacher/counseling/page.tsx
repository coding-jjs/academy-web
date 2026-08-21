import { requireRole } from "@/lib/auth-guard";
import { getStaffScope } from "@/lib/staff-scope";
import { getStaffCounselingData } from "@/features/counseling/staff-data";
import { getTeacherChurnCareTasks } from "@/features/churn/teacher-data";
import StaffCounselingScreen from "./StaffCounselingScreen";

export const dynamic = "force-dynamic";

export default async function TeacherCounselingPage() {
    const session = await requireRole("TEACHER");
    const staffScope = await getStaffScope(session.user.id);
    const [counselingData, churnTasks] = await Promise.all([
        getStaffCounselingData({
            staffScope,
            includeInquiries: false,
            onlyOwnMemos: true,
        }),
        getTeacherChurnCareTasks(session.user.id),
    ]);

    return (
        <StaffCounselingScreen
            role="TEACHER"
            {...counselingData}
            churnTasks={churnTasks}
        />
    );
}
