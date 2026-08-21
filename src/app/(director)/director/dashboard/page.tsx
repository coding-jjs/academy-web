/**
 * `/director/dashboard` 원장 운영 대시보드.
 *
 * 연 사람: DIRECTOR. layout `requireRole("DIRECTOR")`. 이 page는 가드를 반복하지 않는다.
 * 흐름: `getKstDayRange()` → `getDirectorDashboardMetrics`(director-data) →
 * `DirectorDashboardScreen`.
 *
 * 미납 카드는 준비 중 카피. 청구 정산·Toss와 연결하지 않는다.
 *
 * `dynamic = force-dynamic`: 오늘 출석·승인 대기가 캐시에 안 남게.
 */

import { getKstDayRange } from "@/lib/date-kst";
import { getDirectorDashboardMetrics } from "@/features/dashboard/director-data";
import DirectorDashboardScreen from "./DirectorDashboardScreen";

export const dynamic = "force-dynamic";

/**
 * 오늘 KST 구간으로 원장 지표를 읽어 Screen에 넘긴다.
 */
export default async function DirectorDashboardPage() {
    const { startOfToday, endOfToday } = getKstDayRange();
    const metrics = await getDirectorDashboardMetrics({
        startOfDay: startOfToday,
        endOfDay: endOfToday,
    });

    return <DirectorDashboardScreen metrics={metrics} />;
}
