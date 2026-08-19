/**
 * `/teacher/counseling` 교사 상담 메모.
 *
 * 연 사람: TEACHER. layout 가드 + page `requireRole("TEACHER")`.
 * 흐름: requireRole → `getStaffScope` → `getStaffCounselingData`
 * (`includeInquiries: false`, `onlyOwnMemos: true`) → `StaffCounselingScreen`
 * (`role="TEACHER"`).
 *
 * 게스트 문의는 넣지 않는다. 문의 처리는 직원 `/employee/counseling`
 * (`includeInquiries: true`) 몫이다. Screen 파일은 직원이 재사용한다.
 */

import { requireRole } from "@/lib/auth-guard"; // 교사만. 게스트 문의는 넣지 않는다.
import { getStaffScope } from "@/lib/staff-scope"; // 담당 스코프. 문의 탭은 직원 page.
import { getStaffCounselingData } from "@/features/counseling/staff-data"; // 본인 메모만. includeInquiries: false.
import StaffCounselingScreen from "./StaffCounselingScreen"; // Screen 파일은 직원이 재사용. 문의 탭은 비운다.

export const dynamic = "force-dynamic"; // 상담 메모가 캐시에 안 남게.

/** 본인 상담 메모만 교사 Screen에 넘긴다. 문의 목록은 비운다. */
export default async function TeacherCounselingPage() { // proxy→layout→page. 문의는 직원 page.
    const session = await requireRole("TEACHER"); // 교사만. 게스트 문의는 넣지 않는다.
    const staffScope = await getStaffScope(session.user.id); // 담당 스코프. 문의 탭은 직원 page.
    const counselingData = await getStaffCounselingData({ // 본인 메모만. includeInquiries: false.
        staffScope, // 담당 범위. 전 학원 문의가 아니다.
        includeInquiries: false, // 교사 false. 직원 counseling은 true.
        onlyOwnMemos: true, // 본인 메모만. 직원은 false로 전체를 본다.
    }); // 객체/호출 끝.

    return <StaffCounselingScreen role="TEACHER" {...counselingData} />; // Screen 파일은 직원이 재사용. 문의 탭은 비운다.
} // 블록 끝.
