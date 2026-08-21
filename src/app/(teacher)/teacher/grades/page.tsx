/**
 * `/teacher/grades` 교사 성적.
 *
 * 연 사람: TEACHER. layout 가드 + page `requireRole("TEACHER")`.
 * 흐름: requireRole → 권한 키(`ownClassAttendanceGrade` /
 * `otherTeacherAttendanceGrade`) → 없으면 빈 Screen+안내 →
 * 있으면 staff-scope `getGradesManagementData` → features `GradesManagementScreen`.
 *
 * 원장 성적 page와 Screen을 공유하되 조회 범위를 담당 반으로 자른다.
 */

import { requireRole } from "@/lib/auth-guard";
import { getKstDayRange } from "@/lib/date-kst";
import { getGradesManagementData } from "@/features/grades/data";
import { userHasPermission } from "@/lib/permission-guard";
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope";
import GradesManagementScreen from "@/features/grades/GradesManagementScreen";

export const dynamic = "force-dynamic";

/** 권한과 스코프를 반영한 성적 관리 Screen을 연다. */
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
