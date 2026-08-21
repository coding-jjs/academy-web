/**
 * `/director/parents` 학부모-원생 링크 관리.
 *
 * 연 사람: DIRECTOR. layout `requireRole("DIRECTOR")`.
 * 흐름: `getDirectorFamilyLinksData`(families director-data) → `DirectorParentsScreen`.
 *
 * 연결/해제는 Screen 안의 `linkParentStudent` / `unlinkParentStudent`.
 * 학부모가 자녀를 스스로 묶지 못하게 원장만 연다.
 */

import { getDirectorFamilyLinksData } from "@/features/families/director-data";
import DirectorParentsScreen from "./DirectorParentsScreen";

export const dynamic = "force-dynamic";

/** 연결 가능 계정과 현재 링크를 Screen에 넘긴다. */
export default async function DirectorParentsPage() {
    const familyLinksData = await getDirectorFamilyLinksData();

    return <DirectorParentsScreen {...familyLinksData} />;
}
