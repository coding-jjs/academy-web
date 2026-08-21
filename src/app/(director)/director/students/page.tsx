/**
 * `/director/students` 원장 원생 명단.
 *
 * 연 사람: DIRECTOR. layout `requireRole("DIRECTOR")`. 이 page는 가드를 반복하지 않는다.
 * 흐름: `getDirectorStudentsData` + `getDirectorCounselingMemos` →
 * `DirectorStudentsScreen`.
 *
 * 직원/교사 `StaffStudentsScreen`을 쓰지 않는다. 상태 전이·수강 배정은 원장 전용.
 */

import { getDirectorCounselingMemos } from "@/features/counseling/director-data"; // 원장 상담 메모. 교사 문의 탭이 아니다.
import { getDirectorStudentsData } from "@/features/students/director-data"; // 원생 목록. 상태 전이·수강 배정용.
import DirectorStudentsScreen from "@/app/(director)/director/students/DirectorStudentsScreen"; // 원장 전용. StaffStudentsScreen을 쓰지 않는다.

export const dynamic = "force-dynamic"; // 원생 상태·상담이 캐시에 안 남게.

/** 원생 목록과 상담 메모를 워크스페이스 Screen에 넘긴다. */
export default async function DirectorStudentsPage() { // layout 가드만. 상태 전이는 원장 전용.
    const [studentsData, counselingMemos] = await Promise.all([ // 원생 목록 + 상담 메모. layout 가드만.
        getDirectorStudentsData(), // 원생 목록. StaffStudentsScreen 데이터가 아니다.
        getDirectorCounselingMemos(), // 원장 상담 메모.
    ]);{/* 구문 끝. */}

    return ( // 원장 전용 Screen. StaffStudentsScreen을 쓰지 않는다.
        <DirectorStudentsScreen // 상태 전이·수강 배정은 여기. 교사/직원 명단이 아니다.
            {...studentsData} // 원생 목록 DTO.
            counselingMemos={counselingMemos} // 원장 상담 메모. 게스트 문의가 아니다.
        /> // DirectorStudentsScreen 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
