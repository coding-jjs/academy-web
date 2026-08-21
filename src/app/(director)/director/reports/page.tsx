/**
 * `/director/reports` 원장 리포트 승인 큐.
 *
 * 연 사람: DIRECTOR. layout `requireRole("DIRECTOR")`.
 * 흐름: `getDirectorReportStudents`(director-data) → `DirectorReportsScreen`.
 *
 * 작성은 교사 `StaffReportsScreen`. 여기서는 승인(학부모 발송) / 반려만.
 */

import { getDirectorReportStudents } from "@/features/reports/director-data";
import DirectorReportsScreen from "./DirectorReportsScreen";

export const dynamic = "force-dynamic";

/** 학생별 리포트 큐를 승인 Screen에 넘긴다. */
export default async function DirectorReportsPage() {
    const students = await getDirectorReportStudents();

    return <DirectorReportsScreen students={students} />;
}
