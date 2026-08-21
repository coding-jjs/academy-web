/**
 * `/director/students` 원장 원생 명단.
 *
 * 연 사람: DIRECTOR. layout `requireRole("DIRECTOR")`. 이 page는 가드를 반복하지 않는다.
 * 흐름: `getDirectorStudentsData` + `getDirectorCounselingMemos` →
 * `DirectorStudentsScreen`.
 *
 * 직원/교사 `StaffStudentsScreen`을 쓰지 않는다. 상태 전이·수강 배정은 원장 전용.
 */

import { getDirectorCounselingMemos } from "@/features/counseling/director-data";
import { getDirectorStudentsData } from "@/features/students/director-data";
import DirectorStudentsScreen from "@/app/(director)/director/students/DirectorStudentsScreen";

export const dynamic = "force-dynamic";

/** 원생 목록과 상담 메모를 워크스페이스 Screen에 넘긴다. */
export default async function DirectorStudentsPage() {
    const [studentsData, counselingMemos] = await Promise.all([
        getDirectorStudentsData(),
        getDirectorCounselingMemos(),
    ]);

    return (
        <DirectorStudentsScreen
            {...studentsData}
            counselingMemos={counselingMemos}
        />
    );
}
