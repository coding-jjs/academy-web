/**
 * `/director/churn` 이탈 징후 큐.
 *
 * 연 사람: DIRECTOR. layout 가드 + page `requireRole("DIRECTOR")`.
 * 흐름: requireRole → `getDirectorChurnData` → `DirectorChurnScreen`.
 *
 * 임계값 저장·스캔·상태 전이·학부모 쪽지는 Screen이 churn actions로 보낸다.
 * 미납 일수는 임계값에 있지만 청구 정산 UI는 아직 없다.
 */

import { requireRole } from "@/lib/auth-guard"; // layout에 더해 page에서도 원장만.
import { getDirectorChurnData } from "@/features/churn/data"; // 이탈 케이스·임계값. 정산 UI는 없다.
import DirectorChurnScreen from "./DirectorChurnScreen"; // 원장 Screen. 저장은 churn actions.

export const dynamic = "force-dynamic"; // 이탈 케이스가 캐시에 안 남게.

/** 이탈 케이스와 임계값을 Screen에 넘긴다. */
export default async function DirectorChurnPage() { // proxy→layout→page 가드. Screen이 쓰기를 보낸다.
    await requireRole("DIRECTOR"); // 원장만.
    const churnData = await getDirectorChurnData(); // 이탈 케이스와 임계값. 미납 일수는 있어도 정산 UI는 없다.

    return <DirectorChurnScreen {...churnData} />; // Screen에 props만. Toss 정산이 아니다.
} // 블록 끝.
