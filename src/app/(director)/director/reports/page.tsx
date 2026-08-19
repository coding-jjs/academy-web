/**
 * `/director/reports` 원장 리포트 승인 큐.
 *
 * 연 사람: DIRECTOR. layout `requireRole("DIRECTOR")`.
 * 흐름: `getDirectorReportStudents`(director-data) → `DirectorReportsScreen`.
 *
 * 작성은 교사 `StaffReportsScreen`. 여기서는 승인(학부모 발송) / 반려만.
 */

import { getDirectorReportStudents } from "@/features/reports/director-data"; // 학생별 승인 큐. 작성은 교사 Screen.
import DirectorReportsScreen from "./DirectorReportsScreen"; // 승인/반려만. 초안 작성 UI가 아니다.

export const dynamic = "force-dynamic"; // 승인 큐가 캐시에 안 남게.

/** 학생별 리포트 큐를 승인 Screen에 넘긴다. */
export default async function DirectorReportsPage() { // layout 가드만. 작성은 교사 StaffReportsScreen.
    const students = await getDirectorReportStudents(); // 학생별 승인 큐. 작성은 교사 Screen.

    return <DirectorReportsScreen students={students} />; // 승인/반려만. 초안 작성 UI가 아니다.
} // 블록 끝.
