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

import { getKstDayRange } from "@/lib/date-kst"; // 오늘 KST 구간. UTC 자정이 아니다.
import { getDirectorDashboardMetrics } from "@/features/dashboard/director-data"; // 원장 지표. 미납은 준비 중 카피.
import DirectorDashboardScreen from "./DirectorDashboardScreen"; // 원장 Screen. 교사 StaffDashboardScreen이 아니다.

export const dynamic = "force-dynamic"; // 오늘 출석·승인 대기가 캐시에 안 남게.

/**
 * 오늘 KST 구간으로 원장 지표를 읽어 Screen에 넘긴다.
 */
export default async function DirectorDashboardPage() { // layout 가드만. page requireRole 없음.
    const { startOfToday, endOfToday } = getKstDayRange(); // 오늘 KST 구간. layout 가드만 탄다.
    const metrics = await getDirectorDashboardMetrics({ // 원장 지표. 미납은 준비 중 카피.
        startOfDay: startOfToday, // KST 오늘 시작. 출석 집계.
        endOfDay: endOfToday, // KST 오늘 끝. Toss 정산 구간이 아니다.
    }); // 객체/호출 끝.

    return <DirectorDashboardScreen metrics={metrics} />; // Screen에 metrics만. Toss 정산 없음.
} // 블록 끝.
