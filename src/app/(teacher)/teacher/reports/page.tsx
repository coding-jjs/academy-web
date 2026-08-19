/**
 * `/teacher/reports` 교사 리포트 초안.
 *
 * 연 사람: TEACHER. layout 가드 + page `requireRole("TEACHER")`.
 * 흐름: requireRole → `getStaffScope` → `getStaffReportsData` → `StaffReportsScreen`.
 *
 * 원장 승인 전에 학부모에게 나가지 않는다. 직원 URL에는 리포트 page가 없다.
 */

import { requireRole } from "@/lib/auth-guard"; // 교사만. 직원 URL에는 리포트 page가 없다.
import { getStaffScope } from "@/lib/staff-scope"; // 담당 학생. 원장 승인 전에 학부모에게 안 나간다.
import { getStaffReportsData } from "@/features/reports/staff-data"; // 스코프 안 학생 리포트 상태.
import StaffReportsScreen from "./StaffReportsScreen"; // 초안 작성 Screen. 승인은 /director/reports.

export const dynamic = "force-dynamic"; // 초안 상태가 캐시에 안 남게.

/** 스코프 안 학생 리포트 상태를 작성 Screen에 넘긴다. */
export default async function TeacherReportsPage() { // proxy→layout→page. 직원 리포트 URL 없음.
    const session = await requireRole("TEACHER"); // 교사만. 직원 URL에는 리포트 page가 없다.
    const staffScope = await getStaffScope(session.user.id); // 담당 학생. 원장 승인 전에 학부모에게 안 나간다.
    const students = await getStaffReportsData(staffScope); // 스코프 안 학생 리포트 상태.

    return <StaffReportsScreen students={students} />; // 초안 작성 Screen. 승인은 /director/reports.
} // 블록 끝.
