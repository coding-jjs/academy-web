import { requireRole } from "@/lib/auth-guard";
import { getKstDayRange } from "@/lib/date-kst";
import { getGradesManagementData } from "@/features/grades/data";
import GradesManagementScreen from "@/features/grades/GradesManagementScreen";

export const dynamic = "force-dynamic";

export default async function DirectorGradesPage() {
    await requireRole("DIRECTOR");
    const { day: todayKst } = getKstDayRange();

    const gradesData = await getGradesManagementData({
        studentWhere: { status: "ENROLLED" },
    });

    return (
        <GradesManagementScreen
            {...gradesData}
            canManage
            maxAssessedDate={todayKst}
        />
    );
}
