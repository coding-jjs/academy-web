/**
 * `/director/grades` 원장 성적 관리.
 *
 * 연 사람: DIRECTOR. layout 가드 + page `requireRole("DIRECTOR")`.
 * 흐름: requireRole → `getGradesManagementData`(재원생 전체) →
 * features `GradesManagementScreen` (`canManage`).
 *
 * 교사 성적 page와 Screen을 공유하지만 studentWhere를 전체 ENROLLED로 연다.
 * 오늘 KST 이후 평가일은 `maxAssessedDate`로 막는다.
 */

import { requireRole } from "@/lib/auth-guard";
import { getKstDayRange } from "@/lib/date-kst";
import { getGradesManagementData } from "@/features/grades/data";
import GradesManagementScreen from "@/features/grades/GradesManagementScreen";

export const dynamic = "force-dynamic";

/** 재원생 전체 성적을 편집 가능한 Screen에 넘긴다. */
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
