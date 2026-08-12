import { requireRole } from "@/lib/auth-guard";
import { getKstDayRange } from "@/lib/date-kst";
import { getGradesManagementData } from "@/features/grades/data";
import { userHasPermission } from "@/lib/permission-guard";
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope";
import GradesManagementScreen from "@/features/grades/GradesManagementScreen";

export const dynamic = "force-dynamic";

export default async function StaffGradesPage() {
    const session = await requireRole("TEACHER");
    const { day: todayKst } = getKstDayRange();

    const [canOwn, canOther] = await Promise.all([
        userHasPermission(session.user.id, "ownClassAttendanceGrade"),
        userHasPermission(session.user.id, "otherTeacherAttendanceGrade"),
    ]);
    const canManage = canOwn || canOther;

    if (!canManage) {
        return (
            <GradesManagementScreen
                students={[]}
                grades={[]}
                wrongNotes={[]}
                canManage={false}
                maxAssessedDate={todayKst}
                deniedMessage="성적 입력 권한이 없습니다. 원장에게 권한 부여를 요청하세요."
            />
        );
    }

    const scope = await getStaffScope(session.user.id);
    const studentWhere = {
        status: "ENROLLED" as const,
        ...studentScopeWhere(scope),
    };

    const gradesData = await getGradesManagementData({
        studentWhere,
        gradeWhere: { student: studentWhere },
        wrongNoteWhere: { student: studentWhere },
    });

    return (
        <GradesManagementScreen
            {...gradesData}
            canManage
            maxAssessedDate={todayKst}
        />
    );
}
