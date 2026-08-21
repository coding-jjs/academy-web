/**
 * `/teacher/reports` 교사 리포트 초안.
 *
 * 연 사람: TEACHER. layout 가드 + page `requireRole("TEACHER")`.
 * 흐름: requireRole → `getStaffScope` → `getStaffReportsData` → `StaffReportsScreen`.
 *
 * 원장 승인 전에 학부모에게 나가지 않는다. 직원 URL에는 리포트 page가 없다.
 */

import { requireRole } from "@/lib/auth-guard";
import { getStaffScope } from "@/lib/staff-scope";
import { getStaffReportsData } from "@/features/reports/staff-data";
import StaffReportsScreen from "./StaffReportsScreen";

export const dynamic = "force-dynamic";

/** 스코프 안 학생 리포트 상태를 작성 Screen에 넘긴다. */
export default async function TeacherReportsPage() {
    const session = await requireRole("TEACHER");
    const staffScope = await getStaffScope(session.user.id);
    const students = await getStaffReportsData(staffScope);

    return <StaffReportsScreen students={students} />;
}
