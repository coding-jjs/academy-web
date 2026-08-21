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

import { requireRole } from "@/lib/auth-guard"; // layout에 더해 page에서도 원장만.
import { getKstDayRange } from "@/lib/date-kst"; // 오늘 KST. 이후 평가일은 막는다.
import { getGradesManagementData } from "@/features/grades/data"; // 재원생 전체. 교사 page와 Screen을 공유하되 where만 전체 ENROLLED.
import GradesManagementScreen from "@/features/grades/GradesManagementScreen"; // 교사 grades page와 같은 Screen. 범위만 전체.

export const dynamic = "force-dynamic"; // 성적이 캐시에 안 남게.

/** 재원생 전체 성적을 편집 가능한 Screen에 넘긴다. */
export default async function DirectorGradesPage() { // proxy→layout→page. 교사와 Screen 공유, where만 전체.
    await requireRole("DIRECTOR"); // 원장만.
    const { day: todayKst } = getKstDayRange(); // 오늘 KST. 이후 평가일은 막는다.

    const gradesData = await getGradesManagementData({ // 재원생 전체. 교사 page와 Screen을 공유하되 where만 전체 ENROLLED.
        studentWhere: { status: "ENROLLED" }, // 담당 반 제한 없음. 원장 전 재원생.
    }); // 객체/호출 끝.

    return ( // 편집 가능. 오늘 KST 이후 평가일은 maxAssessedDate로 막는다.
        <GradesManagementScreen // 교사 grades page와 같은 Screen. 범위만 전체.
            {...gradesData} // 재원생 전체 성적·오답.
            canManage // 원장은 무조건 편집. 교사 page는 권한 키를 본다.
            maxAssessedDate={todayKst} // 오늘 KST 이후 평가일은 막는다.
        /> // GradesManagementScreen 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
