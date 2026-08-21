/**
 * `/teacher/counseling` 교사 상담 메모 + 배정된 이탈 케어.
 *
 * 연 사람: TEACHER. layout 가드 + page `requireRole("TEACHER")`.
 * 흐름: requireRole → `getStaffScope` → `getStaffCounselingData`
 * (`includeInquiries: false`, `onlyOwnMemos: true`) + `getTeacherChurnCareTasks`
 * → `StaffCounselingScreen` (`role="TEACHER"`).
 *
 * 게스트 문의는 넣지 않는다. 문의 처리는 직원 `/employee/counseling`
 * (`includeInquiries: true`) 몫이다. Screen 파일은 직원이 재사용한다.
 */

import { requireRole } from "@/lib/auth-guard";
import { getStaffScope } from "@/lib/staff-scope";
import { getStaffCounselingData } from "@/features/counseling/staff-data";
import { getTeacherChurnCareTasks } from "@/features/churn/teacher-data";
import StaffCounselingScreen from "./StaffCounselingScreen";

export const dynamic = "force-dynamic";

/** 본인 상담 메모와 배정 케어를 교사 Screen에 넘긴다. 문의 목록은 비운다. */
export default async function TeacherCounselingPage() {
    const session = await requireRole("TEACHER");
    const staffScope = await getStaffScope(session.user.id);
    const [counselingData, churnTasks] = await Promise.all([
        getStaffCounselingData({
            staffScope,
            includeInquiries: false,
            onlyOwnMemos: true,
        }),
        getTeacherChurnCareTasks(session.user.id),
    ]);

    return (
        <StaffCounselingScreen
            role="TEACHER"
            {...counselingData}
            churnTasks={churnTasks}
        />
    );
}
