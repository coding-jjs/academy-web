/**
 * `/director/churn` 이탈 징후 큐.
 *
 * 연 사람: DIRECTOR. layout 가드 + page `requireRole("DIRECTOR")`.
 * 흐름: requireRole → `getDirectorChurnData` → `DirectorChurnScreen`.
 *
 * 임계값 저장·스캔·상태 전이·학부모 쪽지는 Screen이 churn actions로 보낸다.
 * 미납 일수는 임계값에 있지만 청구 정산 UI는 아직 없다.
 */

import { requireRole } from "@/lib/auth-guard";
import { getDirectorChurnData } from "@/features/churn/data";
import DirectorChurnScreen from "./DirectorChurnScreen";

export const dynamic = "force-dynamic";

/** 이탈 케이스와 임계값을 Screen에 넘긴다. */
export default async function DirectorChurnPage() {
    await requireRole("DIRECTOR");
    const churnData = await getDirectorChurnData();

    return <DirectorChurnScreen {...churnData} />;
}
