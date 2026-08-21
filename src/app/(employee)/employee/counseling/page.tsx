/**
 * `/employee/counseling` 직원 상담.
 *
 * 연 사람: STAFF. layout 가드 + page `requireRole("STAFF")`.
 * 흐름: requireRole → `getStaffScope` → `getStaffCounselingData`
 * (`includeInquiries: true`, `onlyOwnMemos: false`) + `getTeacherChurnCareTasks`
 * → 교사 `StaffCounselingScreen` (`role="STAFF"`).
 *
 * 게스트 문의(`/guest/inquiry`)를 포함한다. 교사 상담은
 * `includeInquiries: false`라 문의 탭이 비어 있다.
 * 이탈 케어도 같은 Screen의 ChurnCarePanel로 올린다.
 */

import { requireRole } from "@/lib/auth-guard";
import { getStaffScope } from "@/lib/staff-scope";
import { getStaffCounselingData } from "@/features/counseling/staff-data";
import { getTeacherChurnCareTasks } from "@/features/churn/teacher-data";
import StaffCounselingScreen from "@/app/(teacher)/teacher/counseling/StaffCounselingScreen";

export const dynamic = "force-dynamic";

/** 문의+전체 메모+배정 케어를 교사 Screen에 STAFF 역할로 넘긴다. */
export default async function EmployeeCounselingPage() {
    const session = await requireRole("STAFF");
    const staffScope = await getStaffScope(session.user.id);
    const [counselingData, churnTasks] = await Promise.all([
        getStaffCounselingData({
            staffScope,
            includeInquiries: true,
            onlyOwnMemos: false,
        }),
        getTeacherChurnCareTasks(session.user.id),
    ]);

    return (
        <StaffCounselingScreen
            role="STAFF"
            {...counselingData}
            churnTasks={churnTasks}
        />
    );
}
