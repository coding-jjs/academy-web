/**
 * `/employee/counseling` 직원 상담.
 *
 * 연 사람: STAFF. layout 가드 + page `requireRole("STAFF")`.
 * 흐름: requireRole → `getStaffScope` → `getStaffCounselingData`
 * (`includeInquiries: true`, `onlyOwnMemos: false`) → 교사
 * `StaffCounselingScreen` (`role="STAFF"`).
 *
 * 게스트 문의(`/guest/inquiry`)를 포함한다. 교사 상담은
 * `includeInquiries: false`라 문의 탭이 비어 있다.
 */

import { requireRole } from "@/lib/auth-guard"; // 직원만. 교사 Screen을 재사용한다.
import { getStaffScope } from "@/lib/staff-scope"; // 직원 스코프. 문의는 전역.
import { getStaffCounselingData } from "@/features/counseling/staff-data"; // 게스트 문의 포함. includeInquiries: true (교사는 false).
import StaffCounselingScreen from "@/app/(teacher)/teacher/counseling/StaffCounselingScreen"; // 교사 Screen을 STAFF로 재사용.

export const dynamic = "force-dynamic"; // 문의·메모가 캐시에 안 남게.

/** 문의+전체 메모를 교사 Screen에 STAFF 역할로 넘긴다. */
export default async function EmployeeCounselingPage() { // proxy→layout→page. 교사 counseling과 Screen 공유, 문의만 다름.
    const session = await requireRole("STAFF"); // 직원만. 교사 Screen을 재사용한다.
    const staffScope = await getStaffScope(session.user.id); // 직원 스코프. 문의는 전역.
    const counselingData = await getStaffCounselingData({ // 게스트 문의 포함. includeInquiries: true (교사는 false).
        staffScope, // 메모 범위. 문의는 includeInquiries로 전역.
        includeInquiries: true, // 직원 true. 교사 counseling은 false.
        onlyOwnMemos: false, // 전체 메모. 교사는 본인 메모만.
    }); // 객체/호출 끝.

    return <StaffCounselingScreen role="STAFF" {...counselingData} />; // 교사 Screen을 STAFF로 재사용. /guest/inquiry 건을 처리한다.
} // 블록 끝.
